import { describe, it, expect } from 'vitest'
import { aggregateSoilDaily, type HourlySoilSeries } from '@/lib/weather/soil-daily'

function hourlyTimes(date: string, hours: number): string[] {
  return Array.from({ length: hours }, (_, h) => `${date}T${String(h).padStart(2, '0')}:00`)
}

describe('aggregateSoilDaily', () => {
  it('computes daily means for a full day of readings', () => {
    const series: HourlySoilSeries = {
      time: hourlyTimes('2025-06-01', 24),
      soil_temperature_0_to_7cm: Array.from({ length: 24 }, (_, h) => 10 + (h % 2)), // alternating 10/11
      soil_temperature_7_to_28cm: Array(24).fill(13),
      soil_moisture_0_to_7cm: Array(24).fill(0.1614),
    }

    const result = aggregateSoilDaily(series)
    const day = result.get('2025-06-01')
    expect(day).toBeDefined()
    expect(day!.soilTempMean0to7C).toBe(10.5)
    expect(day!.soilTempMean7to28C).toBe(13)
    // Moisture keeps three decimals
    expect(day!.soilMoistureMean0to7).toBe(0.161)
  })

  it('groups readings by date across multiple days', () => {
    const series: HourlySoilSeries = {
      time: [...hourlyTimes('2025-06-01', 24), ...hourlyTimes('2025-06-02', 24)],
      soil_temperature_0_to_7cm: [...Array(24).fill(10), ...Array(24).fill(14)],
    }

    const result = aggregateSoilDaily(series)
    expect(result.size).toBe(2)
    expect(result.get('2025-06-01')!.soilTempMean0to7C).toBe(10)
    expect(result.get('2025-06-02')!.soilTempMean0to7C).toBe(14)
  })

  it('returns null for a partial day with too few readings', () => {
    // Only 6 hourly readings (e.g. the ragged edge near "now")
    const series: HourlySoilSeries = {
      time: hourlyTimes('2025-06-01', 6),
      soil_temperature_0_to_7cm: Array(6).fill(12),
    }

    const result = aggregateSoilDaily(series)
    expect(result.get('2025-06-01')!.soilTempMean0to7C).toBeNull()
  })

  it('skips null readings but still averages when enough remain', () => {
    const temps: (number | null)[] = Array(24).fill(10)
    // 8 nulls scattered through the day -> 16 valid readings, still >= minimum
    for (let i = 0; i < 8; i++) temps[i * 3] = null
    const series: HourlySoilSeries = {
      time: hourlyTimes('2025-06-01', 24),
      soil_temperature_0_to_7cm: temps,
    }

    const result = aggregateSoilDaily(series)
    expect(result.get('2025-06-01')!.soilTempMean0to7C).toBe(10)
  })

  it('returns null when nulls leave too few valid readings', () => {
    const temps: (number | null)[] = Array(24).fill(null)
    // Only 11 valid readings — one below the minimum of 12
    for (let i = 0; i < 11; i++) temps[i] = 9
    const series: HourlySoilSeries = {
      time: hourlyTimes('2025-06-01', 24),
      soil_temperature_0_to_7cm: temps,
    }

    const result = aggregateSoilDaily(series)
    expect(result.get('2025-06-01')!.soilTempMean0to7C).toBeNull()
  })

  it('returns null for metrics whose series is missing entirely', () => {
    const series: HourlySoilSeries = {
      time: hourlyTimes('2025-06-01', 24),
      soil_temperature_0_to_7cm: Array(24).fill(11),
    }

    const day = aggregateSoilDaily(series).get('2025-06-01')!
    expect(day.soilTempMean0to7C).toBe(11)
    expect(day.soilTempMean7to28C).toBeNull()
    expect(day.soilMoistureMean0to7).toBeNull()
  })

  it('returns an empty map for an empty series', () => {
    expect(aggregateSoilDaily({ time: [] }).size).toBe(0)
  })
})
