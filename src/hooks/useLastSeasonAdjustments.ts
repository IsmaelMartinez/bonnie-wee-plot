'use client'

/**
 * Last-season plan adjustments for a plan year (Season Observer Phase 4).
 *
 * The one place that turns "the year I'm planning" into rule-derived
 * suggestions from the previous season: weather loads cache-first via the
 * archive client (a previously reviewed season costs no network), findings
 * come from `evaluateSeason`, and the pure `derivePlanAdjustments` mapper
 * produces the suggestions. Extracted from LastSeasonPanel so the panel and
 * the Add Planting flow compute from the same logic instead of duplicating
 * the cache-first pattern.
 *
 * Everything is computed on demand and memoized per (season, weather) —
 * never per keystroke — and nothing is persisted to the Yjs doc. Weather
 * degrades to null (log-only findings) when coordinates are missing, the
 * device is offline, or nothing is cached; `settled` flips true once that
 * outcome is known so consumers can hold rendering until suggestions are
 * complete rather than popping in piecemeal.
 */

import { useEffect, useMemo, useState } from 'react'
import type { Area, SeasonRecord } from '@/types/unified-allotment'
import {
  fetchSeasonWeather,
  isValidPlotCoordinates,
  type PlotCoordinates,
  type SeasonWeather,
} from '@/lib/weather/open-meteo-archive'
import { getBaseline, type WeatherBaseline } from '@/lib/weather/weather-baseline'
import { evaluateSeason } from '@/lib/season-review/rules'
import {
  derivePlanAdjustments,
  type PlanAdjustment,
  type PlanAdjustmentContext,
} from '@/lib/season-review/plan-adjustments'

export interface UseLastSeasonAdjustmentsInputs {
  /** The year being planned; the review runs over `planYear - 1`. */
  planYear: number
  /** All areas, for resolving bed names in findings. */
  areas: Area[]
  /** The previous year's season record, or null when there isn't one. */
  seasonRecord: SeasonRecord | null
  /** Coordinates from meta — re-validated here before any fetch. */
  coordinates?: PlotCoordinates | null
  /** Average frost dates from meta, when known. */
  frostDates?: PlanAdjustmentContext['frostDates']
}

export interface UseLastSeasonAdjustmentsResult {
  /**
   * True once weather has settled (loaded, cache-served, or confirmed
   * unavailable). `adjustments` stays empty until then.
   */
  settled: boolean
  /** Rule-derived suggestions from the previous season; often empty. */
  adjustments: PlanAdjustment[]
}

export function useLastSeasonAdjustments({
  planYear,
  areas,
  seasonRecord,
  coordinates,
  frostDates,
}: UseLastSeasonAdjustmentsInputs): UseLastSeasonAdjustmentsResult {
  const reviewYear = planYear - 1
  // Weather settles to null (no coords / offline / no cache) or data;
  // adjustments stay empty until then so suggestions never pop in piecemeal.
  const [weatherSettled, setWeatherSettled] = useState(false)
  const [weather, setWeather] = useState<SeasonWeather | null>(null)
  const [baseline, setBaseline] = useState<WeatherBaseline | null>(null)

  // The fetch needs only "is there a season to review" plus the coordinate
  // values — depending on primitives rather than object identity keeps
  // unrelated data mutations (which regenerate the snapshot and every
  // object in it) from resetting `settled` and re-running the effect.
  const hasSeasonRecord = seasonRecord !== null
  const latitude = coordinates?.latitude
  const longitude = coordinates?.longitude

  useEffect(() => {
    const coords =
      latitude !== undefined && longitude !== undefined ? { latitude, longitude } : null
    if (!hasSeasonRecord || !isValidPlotCoordinates(coords)) {
      // No season means nothing will ever load; no valid coordinates means
      // weather is log-only. Either way the outcome is known: settle now.
      setWeather(null)
      setBaseline(null)
      setWeatherSettled(true)
      return
    }
    let cancelled = false
    setWeatherSettled(false)
    setWeather(null)
    setBaseline(null)
    // Cache-first, same as /season-review — a previously reviewed season
    // costs no network here.
    Promise.all([fetchSeasonWeather(coords, reviewYear), getBaseline(coords)])
      .then(([season, base]) => {
        if (cancelled) return
        setWeather(season)
        setBaseline(base)
        setWeatherSettled(true)
      })
      .catch(() => {
        if (cancelled) return
        setWeather(null)
        setBaseline(null)
        setWeatherSettled(true)
      })
    return () => {
      cancelled = true
    }
  }, [hasSeasonRecord, latitude, longitude, reviewYear])

  const adjustments = useMemo(() => {
    if (!seasonRecord || !weatherSettled) return []
    const findings = evaluateSeason({
      year: reviewYear,
      areas,
      seasonRecord,
      weather,
      baseline,
    })
    return derivePlanAdjustments(findings, { frostDates })
  }, [seasonRecord, weatherSettled, reviewYear, areas, weather, baseline, frostDates])

  return { settled: weatherSettled, adjustments }
}
