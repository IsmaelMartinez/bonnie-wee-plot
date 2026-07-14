'use client'

/**
 * Season Review — the Season Observer's Phase 2b report page.
 *
 * Deterministic rendering only: pick a year, see the season's monthly weather
 * against the plot's 10-year baseline, the rules-engine findings, and the
 * per-planting derived metrics. Everything on screen comes from tested pure
 * functions (src/lib/season-review/) over logs + cached archive weather — no
 * narration, no LLM (that's the still-open Phase 2c decision), and nothing is
 * persisted: the review is recomputed on demand.
 *
 * Degrades gracefully: no coordinates → log-only findings plus a pointer to
 * set a location; no cached weather and offline → same; sparse logs → an
 * honest "nothing confidently worth flagging" empty state.
 */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  BookOpenCheck,
  ChevronLeft,
  CloudOff,
  Info,
  MapPin,
  Sprout,
} from 'lucide-react'
import { useAllotment } from '@/hooks/useAllotment'
import {
  fetchSeasonWeather,
  isValidPlotCoordinates,
  type PlotCoordinates,
  type SeasonWeather,
} from '@/lib/weather/open-meteo-archive'
import { getBaseline, type WeatherBaseline } from '@/lib/weather/weather-baseline'
import {
  computeMonthlyActuals,
  computeMonthlyAnomalies,
  type MonthlyAnomaly,
} from '@/lib/season-review/metrics'
import {
  computePlantingMetrics,
  evaluateSeason,
  type SeasonReviewInput,
} from '@/lib/season-review/rules'
import type { Finding, FindingSeverity } from '@/lib/season-review/findings'
import { todayLocalISO } from '@/lib/log-date'

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

const SEVERITY_STYLES: Record<FindingSeverity, { card: string; label: string; badge: string }> = {
  warning: {
    card: 'border-zen-kitsune-200 bg-zen-kitsune-50',
    label: 'Worth acting on',
    badge: 'bg-zen-kitsune-600 text-white',
  },
  notice: {
    card: 'border-zen-stone-200 bg-white',
    label: 'Worth knowing',
    badge: 'bg-zen-ink-700 text-white',
  },
  info: {
    card: 'border-zen-stone-200 bg-zen-stone-50',
    label: 'Context',
    badge: 'bg-zen-stone-400 text-white',
  },
}

type WeatherStatus = 'no-coordinates' | 'loading' | 'ready' | 'unavailable'

function FindingCard({ finding }: { finding: Finding }) {
  const style = SEVERITY_STYLES[finding.severity]
  const entityLabels = finding.entities
    .map((e) => [e.plantName, e.varietyName, e.areaName].filter(Boolean).join(' · '))
    .filter(Boolean)
  return (
    <li className={`rounded-zen border p-4 ${style.card}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`text-[11px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full ${style.badge}`}>
          {style.label}
        </span>
        {entityLabels.map((label, i) => (
          // Labels can repeat (same crop in two beds) — key by position.
          <span key={`${finding.id}-entity-${i}`} className="text-xs text-zen-stone-500 truncate">
            {label}
          </span>
        ))}
      </div>
      <p className="text-sm text-zen-ink-800">{finding.summary}</p>
    </li>
  )
}

function formatDelta(delta: number | null, unit: string): string {
  if (delta === null) return '—'
  const sign = delta > 0 ? '+' : ''
  return `${sign}${delta}${unit}`
}

function MonthlyWeatherTable({ anomalies }: { anomalies: MonthlyAnomaly[] }) {
  const rows = anomalies.filter(
    (m) => m.actualTempC !== null || m.actualRainMm !== null || m.actualSunshineHours !== null
  )
  if (rows.length === 0) return null
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-zen-stone-500 border-b border-zen-stone-200">
            <th className="py-2 pr-3 font-medium">Month</th>
            <th className="py-2 pr-3 font-medium">Mean temp</th>
            <th className="py-2 pr-3 font-medium">vs 10-yr</th>
            <th className="py-2 pr-3 font-medium">Rain</th>
            <th className="py-2 pr-3 font-medium">vs 10-yr</th>
            <th className="py-2 font-medium">Sunshine</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((m) => (
            <tr key={m.month} className="border-b border-zen-stone-100 last:border-0">
              <td className="py-2 pr-3 font-medium text-zen-ink-700">{MONTH_NAMES[m.month - 1]}</td>
              <td className="py-2 pr-3 text-zen-ink-800">
                {m.actualTempC !== null ? `${m.actualTempC}°C` : '—'}
              </td>
              <td className="py-2 pr-3 text-zen-stone-600">{formatDelta(m.tempDeltaC, '°C')}</td>
              <td className="py-2 pr-3 text-zen-ink-800">
                {m.actualRainMm !== null ? `${m.actualRainMm}mm` : '—'}
              </td>
              <td className="py-2 pr-3 text-zen-stone-600">
                {m.rainRatio !== null ? `${Math.round(m.rainRatio * 100)}%` : '—'}
              </td>
              <td className="py-2 text-zen-ink-800">
                {m.actualSunshineHours !== null ? `${Math.round(m.actualSunshineHours)}h` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function SeasonReviewPage() {
  const { data, isLoading, getYears, getAllAreas } = useAllotment()

  const currentCalendarYear = Number(todayLocalISO().slice(0, 4))
  // Reviewable years: seasons that exist and aren't in the future.
  const years = useMemo(
    () => getYears().filter((y) => y <= currentCalendarYear).sort((a, b) => b - a),
    [getYears, currentCalendarYear]
  )
  const [year, setYear] = useState<number | null>(null)
  // Clamp to the available list so a stale pick (e.g. after the season was
  // deleted or the data was replaced) falls back to the newest year.
  const selectedReviewYear = year !== null && years.includes(year) ? year : years[0] ?? null

  const coordinates: PlotCoordinates | null = useMemo(() => {
    const coords = data?.meta.coordinates
    return isValidPlotCoordinates(coords) ? coords : null
  }, [data?.meta.coordinates])

  const [weatherStatus, setWeatherStatus] = useState<WeatherStatus>('loading')
  const [weather, setWeather] = useState<SeasonWeather | null>(null)
  const [baseline, setBaseline] = useState<WeatherBaseline | null>(null)

  useEffect(() => {
    if (isLoading || selectedReviewYear === null) return
    if (!coordinates) {
      setWeatherStatus('no-coordinates')
      setWeather(null)
      setBaseline(null)
      return
    }
    let cancelled = false
    setWeatherStatus('loading')
    // Drop the previous year's data immediately so findings/anomalies never
    // render the new season record against stale weather while fetching.
    setWeather(null)
    setBaseline(null)
    // Both are cache-first: a previously-reviewed season costs no network.
    Promise.all([
      fetchSeasonWeather(coordinates, selectedReviewYear),
      getBaseline(coordinates),
    ])
      .then(([season, base]) => {
        if (cancelled) return
        setWeather(season)
        setBaseline(base)
        setWeatherStatus(season ? 'ready' : 'unavailable')
      })
      // Both services resolve null on failure, but never let a surprise
      // rejection escape the effect — degrade to the log-only view instead.
      .catch(() => {
        if (cancelled) return
        setWeather(null)
        setBaseline(null)
        setWeatherStatus('unavailable')
      })
    return () => {
      cancelled = true
    }
  }, [isLoading, coordinates, selectedReviewYear])

  const input: SeasonReviewInput | null = useMemo(() => {
    if (!data || selectedReviewYear === null) return null
    return {
      year: selectedReviewYear,
      areas: getAllAreas(),
      seasonRecord: data.seasons.find((s) => s.year === selectedReviewYear) ?? null,
      weather,
      baseline,
    }
  }, [data, selectedReviewYear, getAllAreas, weather, baseline])

  const findings = useMemo(() => (input ? evaluateSeason(input) : []), [input])
  const plantingMetrics = useMemo(() => (input ? computePlantingMetrics(input) : []), [input])
  const anomalies = useMemo(() => {
    if (!weather) return []
    const actuals = computeMonthlyActuals(weather)
    if (baseline) return computeMonthlyAnomalies(actuals, baseline)
    // No baseline: show the season's own numbers with empty comparisons.
    return actuals.map((a) => ({
      month: a.month,
      tempDeltaC: null,
      actualTempC: a.meanTempC,
      baselineTempC: null,
      rainRatio: null,
      actualRainMm: a.rainfallMm,
      baselineRainMm: null,
      sunshineRatio: null,
      actualSunshineHours: a.sunshineHours,
      baselineSunshineHours: null,
    }))
  }, [weather, baseline])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zen-stone-50 flex items-center justify-center">
        <p className="text-zen-stone-500">Loading…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zen-stone-50 zen-texture">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <header className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <BookOpenCheck className="w-6 h-6 text-zen-moss-600" />
            <h1 className="text-zen-ink-900">Season Review</h1>
          </div>
          <p className="text-zen-stone-500">
            What your logs and the weather say about the season. Every number is computed —
            nothing is guessed.
          </p>
        </header>

        {years.length === 0 ? (
          <div className="zen-card p-6 text-center">
            <Sprout className="w-8 h-8 text-zen-moss-400 mx-auto mb-3" />
            <p className="text-zen-stone-600 mb-4">
              There&apos;s no season to review yet. Start planning a year and logging what happens
              on the plot.
            </p>
            <Link href="/allotment" className="zen-btn-primary">
              Go to Allotment
            </Link>
          </div>
        ) : (
          <>
            {/* Year picker */}
            <section className="mb-6" aria-label="Choose a year">
              <div className="flex flex-wrap gap-2">
                {years.map((y) => (
                  <button
                    key={y}
                    onClick={() => setYear(y)}
                    aria-pressed={y === selectedReviewYear}
                    className={`min-h-[44px] px-4 rounded-zen text-sm font-medium border transition ${
                      y === selectedReviewYear
                        ? 'bg-zen-moss-600 text-white border-zen-moss-600'
                        : 'bg-white text-zen-ink-700 border-zen-stone-200 hover:bg-zen-stone-50'
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </section>

            {/* Weather availability notes */}
            {weatherStatus === 'no-coordinates' && (
              <div
                role="note"
                className="mb-6 flex items-start gap-2 rounded-zen bg-zen-water-50 border border-zen-water-200 px-4 py-3 text-sm text-zen-ink-700"
              >
                <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-zen-water-600" />
                <span>
                  Your allotment has no location set, so this review only uses what you logged.
                  Allow location on the <Link href="/" className="underline">Today</Link> page to
                  compare the season against local weather. Your coordinates stay on this device.
                </span>
              </div>
            )}
            {weatherStatus === 'unavailable' && (
              <div
                role="note"
                className="mb-6 flex items-start gap-2 rounded-zen bg-zen-stone-100 border border-zen-stone-200 px-4 py-3 text-sm text-zen-ink-700"
              >
                <CloudOff className="w-4 h-4 shrink-0 mt-0.5 text-zen-stone-500" />
                <span>
                  Weather for {selectedReviewYear} isn&apos;t available right now (offline, or not
                  fetched yet). Findings below use your logs only — reload when online to add
                  weather.
                </span>
              </div>
            )}
            {weatherStatus === 'loading' && (
              <p className="mb-6 text-sm text-zen-stone-500">Fetching the season&apos;s weather…</p>
            )}

            {/* Findings */}
            <section className="mb-8" aria-label="Findings">
              <h2 className="text-sm font-medium text-zen-ink-700 mb-2">
                Findings {weatherStatus === 'loading' ? '(so far)' : ''}
              </h2>
              {findings.length === 0 ? (
                <div className="zen-card p-5 flex items-start gap-3">
                  <Info className="w-5 h-5 text-zen-stone-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-zen-stone-600">
                    Nothing confidently worth flagging for {selectedReviewYear}. That usually means
                    a smooth season — or not enough logged sowings, observations and dates for the
                    rules to work with. The more you <Link href="/log" className="underline">log</Link>,
                    the more this page can tell you.
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {findings.map((finding) => (
                    <FindingCard key={finding.id} finding={finding} />
                  ))}
                </ul>
              )}
            </section>

            {/* Monthly weather vs baseline */}
            {weather && anomalies.length > 0 && (
              <section className="zen-card p-4 mb-8" aria-label="Monthly weather">
                <h2 className="text-sm font-medium text-zen-ink-700 mb-1">
                  {selectedReviewYear} weather, month by month
                </h2>
                <p className="text-xs text-zen-stone-500 mb-3">
                  {baseline
                    ? `Compared against your ${baseline.startYear}–${baseline.endYear} averages. Rain shows this year as a percentage of normal.`
                    : 'A 10-year baseline isn’t available yet, so only this season’s numbers are shown.'}
                </p>
                <MonthlyWeatherTable anomalies={anomalies} />
              </section>
            )}

            {/* Per-planting metrics */}
            {plantingMetrics.length > 0 && (
              <section className="zen-card p-4 mb-8" aria-label="Planting metrics">
                <h2 className="text-sm font-medium text-zen-ink-700 mb-3">Your plantings</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-zen-stone-500 border-b border-zen-stone-200">
                        <th className="py-2 pr-3 font-medium">Crop</th>
                        <th className="py-2 pr-3 font-medium">Bed</th>
                        <th className="py-2 pr-3 font-medium">Soil at sowing</th>
                        <th className="py-2 pr-3 font-medium">Germination</th>
                        <th className="py-2 font-medium">Growing degree days</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plantingMetrics.map((p) => (
                        <tr key={p.plantingId} className="border-b border-zen-stone-100 last:border-0">
                          <td className="py-2 pr-3 font-medium text-zen-ink-700">
                            {p.plantName}
                            {p.varietyName && (
                              <span className="text-zen-stone-500 font-normal"> · {p.varietyName}</span>
                            )}
                          </td>
                          <td className="py-2 pr-3 text-zen-ink-800">{p.areaName ?? '—'}</td>
                          <td className="py-2 pr-3 text-zen-ink-800">
                            {p.soilTempAtSowC !== null ? `${p.soilTempAtSowC}°C` : '—'}
                          </td>
                          <td className="py-2 pr-3 text-zen-ink-800">
                            {p.germination
                              ? `${p.germination.days} days (typ. ~${p.typicalDaysToGerminate})`
                              : '—'}
                          </td>
                          <td className="py-2 text-zen-ink-800">
                            {p.gdd ? `${p.gdd.gdd} (base ${p.gddBaseTempC}°C)` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-zen-stone-400 mt-2 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  Soil and degree-day figures need a sow or transplant date; germination needs a
                  &ldquo;Germinated&rdquo; entry in the log. Dashes mean there wasn&apos;t enough
                  data to compute a number.
                </p>
              </section>
            )}
          </>
        )}

        <div className="mt-4 flex items-center justify-between text-sm">
          <Link
            href="/log"
            className="inline-flex items-center gap-1 text-zen-stone-500 hover:text-zen-moss-700"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Quick Log
          </Link>
          {/* Open-Meteo data is CC BY 4.0 — attribution with a link is required. */}
          <span className="text-zen-stone-400">
            Weather{' '}
            <a
              href="https://open-meteo.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-zen-stone-500"
            >
              by Open-Meteo
            </a>{' '}
            (CC BY 4.0)
          </span>
        </div>
      </div>
    </div>
  )
}
