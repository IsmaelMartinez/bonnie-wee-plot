/**
 * Hourly → daily aggregation for Open-Meteo soil variables.
 *
 * The Archive API only publishes soil temperature and soil moisture as
 * hourly series, so the season-archive client aggregates them to one
 * value per day before caching. Pure functions, no I/O — unit tested
 * directly with fixture series.
 */

/** Hourly soil series as returned by the Open-Meteo Archive API. */
export interface HourlySoilSeries {
  /** ISO timestamps, e.g. "2025-06-01T13:00". */
  time: string[]
  soil_temperature_0_to_7cm?: (number | null)[]
  soil_temperature_7_to_28cm?: (number | null)[]
  soil_moisture_0_to_7cm?: (number | null)[]
}

/** Daily aggregates derived from the hourly soil series. */
export interface DailySoilAggregates {
  /** Mean soil temperature at 0–7cm in °C, or null when coverage is too thin. */
  soilTempMean0to7C: number | null
  /** Mean soil temperature at 7–28cm in °C, or null when coverage is too thin. */
  soilTempMean7to28C: number | null
  /** Mean volumetric soil moisture at 0–7cm in m³/m³, or null when coverage is too thin. */
  soilMoistureMean0to7: number | null
}

/**
 * Minimum valid hourly readings required before a daily mean is trusted.
 * A half-day of data still gives a usable mean; fewer readings (e.g. the
 * archive's ragged trailing edge near "now") yield null instead of a
 * value skewed toward one part of the day.
 */
const MIN_HOURLY_READINGS = 12

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

/**
 * Mean of the values at the given indexes, skipping null/NaN entries.
 * Returns null when fewer than MIN_HOURLY_READINGS valid readings exist.
 */
function meanAt(
  series: (number | null)[] | undefined,
  indexes: number[],
  decimals: number
): number | null {
  if (!series) return null
  let sum = 0
  let count = 0
  for (const i of indexes) {
    const v = series[i]
    if (typeof v !== 'number' || Number.isNaN(v)) continue
    sum += v
    count++
  }
  if (count < MIN_HOURLY_READINGS) return null
  return round(sum / count, decimals)
}

/**
 * Aggregate hourly soil series into per-day means keyed by ISO date
 * (YYYY-MM-DD). Days with too few valid readings get null for the
 * affected metric rather than a misleading partial mean.
 */
export function aggregateSoilDaily(hourly: HourlySoilSeries): Map<string, DailySoilAggregates> {
  const indexesByDate = new Map<string, number[]>()
  for (let i = 0; i < hourly.time.length; i++) {
    const stamp = hourly.time[i]
    // The series comes from an untyped API payload — skip malformed entries.
    if (typeof stamp !== 'string') continue
    const date = stamp.slice(0, 10)
    if (date.length !== 10) continue
    const indexes = indexesByDate.get(date)
    if (indexes) {
      indexes.push(i)
    } else {
      indexesByDate.set(date, [i])
    }
  }

  const result = new Map<string, DailySoilAggregates>()
  for (const [date, indexes] of indexesByDate) {
    result.set(date, {
      soilTempMean0to7C: meanAt(hourly.soil_temperature_0_to_7cm, indexes, 1),
      soilTempMean7to28C: meanAt(hourly.soil_temperature_7_to_28cm, indexes, 1),
      soilMoistureMean0to7: meanAt(hourly.soil_moisture_0_to_7cm, indexes, 3),
    })
  }
  return result
}
