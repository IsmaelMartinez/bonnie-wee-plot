'use client'

/**
 * Quick Log — the Season Observer's 15-second capture path.
 *
 * The hard requirement (build brief §4): logging one event must take under
 * 15 seconds on a phone, one-handed, outdoors, in bad light. So: big tap
 * targets, the active bed kept selected between saves, date defaulting to
 * today, everything past "bed + event" optional. Writes go straight to the
 * Yjs/IndexedDB store, which is already offline-first — no signal needed;
 * it syncs when the allotment gets a bar of reception.
 *
 * Observations and harvests are stored as CareLogEntry rows on the current
 * season (schema v23). Nothing here computes agronomy — capture only.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Sprout,
  Package,
  Bug,
  ShieldAlert,
  Droplets,
  Leaf,
  Scissors,
  AlertTriangle,
  StickyNote,
  Flower2,
  Camera,
  Check,
  ChevronLeft,
  ClipboardList,
  MapPin,
} from 'lucide-react'
import { useAllotment } from '@/hooks/useAllotment'
import { getVegetableById } from '@/lib/vegetable-database'
import type { CareLogType, NewCareLogEntry, ObservationSeverity } from '@/types/unified-allotment'
import type { Area } from '@/types/unified-allotment'
import { normalizeLogDate, todayLocalISO } from '@/lib/log-date'

interface EventConfig {
  type: CareLogType
  label: string
  icon: typeof Sprout
  /** Ask for a 1-3 severity (pest/disease/damage). */
  needsSeverity?: boolean
  /** Show quantity + unit inputs (harvest). */
  isHarvest?: boolean
}

// Ordered by how often you reach for them mid-season, most common first.
const EVENTS: EventConfig[] = [
  { type: 'harvest', label: 'Harvest', icon: Package, isHarvest: true },
  { type: 'germinated', label: 'Germinated', icon: Sprout },
  { type: 'flowering', label: 'Flowering', icon: Flower2 },
  { type: 'pest', label: 'Pest', icon: Bug, needsSeverity: true },
  { type: 'disease', label: 'Disease', icon: ShieldAlert, needsSeverity: true },
  { type: 'water', label: 'Watered', icon: Droplets },
  { type: 'feed', label: 'Fed', icon: Leaf },
  { type: 'thinned', label: 'Thinned', icon: Scissors },
  { type: 'bolted', label: 'Bolted', icon: AlertTriangle },
  { type: 'damage', label: 'Damage', icon: AlertTriangle, needsSeverity: true },
  // Free-form note maps to the existing 'observation' care-log type — we don't
  // keep a separate near-identical 'note' type (simplicity-first).
  { type: 'observation', label: 'Note', icon: StickyNote },
]

const SEVERITY_LABELS: Record<ObservationSeverity, string> = {
  1: 'Minor',
  2: 'Moderate',
  3: 'Severe',
}

// today() aliases the shared helper so the JSX below reads the same as before.
const today = todayLocalISO

export default function QuickLogPage() {
  const {
    isLoading,
    currentSeason,
    selectedYear,
    getAllAreas,
    getPlantings,
    addCareLog,
  } = useAllotment()

  const [bedId, setBedId] = useState<string | null>(null)
  const [event, setEvent] = useState<EventConfig | null>(null)
  const [date, setDate] = useState<string>(today())
  const [note, setNote] = useState('')
  const [severity, setSeverity] = useState<ObservationSeverity>(2)
  const [quantity, setQuantity] = useState('')
  // Deliberately limited to kg + count for the fast one-handed path. Both are
  // drawn from HarvestTracker's unit vocabulary (kg/lbs/count/bunches/baskets),
  // so /log never introduces a unit the rest of the app doesn't use (e.g.
  // grams). It doesn't enforce a single unit across a bed's entries — that
  // stays the user's choice, same as HarvestTracker.
  const [unit, setUnit] = useState<'kg' | 'count'>('kg')
  const [plantingId, setPlantingId] = useState<string | null>(null)
  const [savedFlash, setSavedFlash] = useState<string | null>(null)
  const flashTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // A logged entry is filed into selectedYear's season (via addCareLog), so the
  // date must fall in that year — otherwise a backdated entry misfiles into a
  // season it doesn't belong to. Bound the picker (and the stored value) to
  // [Jan 1, min(today, Dec 31)] of the selected year. Computed per render (not
  // memoized) so today() stays current if the page is left open past midnight.
  const todayStr = today()
  const seasonMin = `${selectedYear}-01-01`
  const yearEnd = `${selectedYear}-12-31`
  const seasonMax = todayStr < yearEnd ? todayStr : yearEnd

  // selectedYear is the app-wide active season (shared with the rest of the app,
  // persisted as currentYear). /log follows it for consistency, but if it's not
  // the current calendar year — because the user left the active year on a past
  // season elsewhere — say so, so entries aren't filed into the wrong season
  // unnoticed. Derive the calendar year from the same value the dates use.
  const calendarYear = Number(todayStr.slice(0, 4))
  // Logging into a past season is valid (backfilling last year's log). Logging
  // into a *future* season isn't — the events haven't happened, and there's no
  // valid in-season, non-future date to store, so block it rather than clamp a
  // date into a season it doesn't belong to.
  const isFutureSeason = selectedYear > calendarYear
  const isPastSeason = selectedYear < calendarYear

  // Clear a pending flash timeout on unmount so it never fires on an
  // unmounted component.
  useEffect(() => () => {
    if (flashTimeout.current) clearTimeout(flashTimeout.current)
  }, [])

  // Keep the picked date inside the selected season's bounds (e.g. after the
  // selected year changes) so the field never shows an out-of-season value.
  useEffect(() => {
    setDate(d => normalizeLogDate(d, seasonMax, seasonMin))
  }, [seasonMin, seasonMax])

  // Beds that can hold plantings, with the active ones (something planted this
  // season) surfaced first so the muddy-thumb path lands on the right bed fast.
  const beds = useMemo(() => {
    const all = getAllAreas().filter((a: Area) => a.canHavePlantings && !a.isArchived)
    const activeCount = (a: Area) => (currentSeason?.areas?.find(s => s.areaId === a.id)?.plantings?.length ?? 0)
    return [...all].sort((a, b) => {
      const diff = activeCount(b) - activeCount(a)
      if (diff !== 0) return diff
      return a.name.localeCompare(b.name)
    })
  }, [getAllAreas, currentSeason])

  // Plantings in the chosen bed this season — lets an observation name a crop.
  const bedPlantings = useMemo(() => {
    if (!bedId) return []
    return getPlantings(bedId) ?? []
  }, [bedId, getPlantings])

  const selectedBed = beds.find(b => b.id === bedId) ?? null

  const resetForNextEntry = () => {
    setEvent(null)
    setNote('')
    setSeverity(2)
    setQuantity('')
    setPlantingId(null)
    // Keep bedId and date — you usually log several things in one bed on one visit.
  }

  const handleSave = () => {
    if (!bedId || !event || !currentSeason || isFutureSeason) return

    const normalizedDate = normalizeLogDate(date, seasonMax, seasonMin)
    // Keep the picker in sync with what actually gets stored, so a clamped or
    // corrected date isn't silently different from what the field shows.
    if (normalizedDate !== date) setDate(normalizedDate)

    const entry: NewCareLogEntry = {
      type: event.type,
      date: normalizedDate,
    }
    const trimmed = note.trim()
    if (trimmed) entry.description = trimmed
    if (event.needsSeverity) entry.severity = severity
    if (plantingId) entry.plantingId = plantingId
    if (event.isHarvest) {
      const qty = parseFloat(quantity)
      if (!Number.isNaN(qty) && qty > 0) {
        entry.quantity = qty
        entry.unit = unit
      }
    }

    addCareLog(bedId, entry)

    const cropName = plantingId
      ? getVegetableById(bedPlantings.find(p => p.id === plantingId)?.plantId ?? '')?.name
      : undefined
    setSavedFlash(`${event.label}${cropName ? ` · ${cropName}` : ''} logged in ${selectedBed?.name ?? 'bed'}`)
    // Reset the flash timer on each save so a rapid second save doesn't get its
    // confirmation cleared early by the previous save's timeout.
    if (flashTimeout.current) clearTimeout(flashTimeout.current)
    flashTimeout.current = setTimeout(() => setSavedFlash(null), 2500)
    resetForNextEntry()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zen-stone-50 flex items-center justify-center">
        <p className="text-zen-stone-500">Loading…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zen-stone-50 zen-texture">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <header className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <ClipboardList className="w-6 h-6 text-zen-moss-600" />
            <h1 className="text-zen-ink-900">Quick Log</h1>
          </div>
          <p className="text-zen-stone-500">
            Tap a bed, tap what happened. {selectedYear} season.
          </p>
          {isPastSeason && (
            <div
              role="note"
              className="mt-2 flex items-start gap-2 rounded-zen bg-zen-kitsune-50 border border-zen-kitsune-200 px-3 py-2 text-xs text-zen-kitsune-800"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                You&apos;re logging into the <strong>{selectedYear}</strong> season, not the current
                year ({calendarYear}). Change the active year on the Allotment page to log for {calendarYear}.
              </span>
            </div>
          )}
        </header>

        {savedFlash && (
          <div
            role="status"
            className="mb-4 flex items-center gap-2 rounded-zen bg-zen-moss-100 border border-zen-moss-300 px-4 py-3 text-zen-moss-800"
          >
            <Check className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">{savedFlash}</span>
          </div>
        )}

        {isFutureSeason ? (
          <div className="zen-card p-6 text-center">
            <AlertTriangle className="w-8 h-8 text-zen-kitsune-400 mx-auto mb-3" />
            <p className="text-zen-stone-600 mb-4">
              The active season is <strong>{selectedYear}</strong>, which is in the future. You can
              only log events that have already happened. Switch the active year to {calendarYear} on
              the Allotment page to log now.
            </p>
            <Link href="/allotment" className="zen-btn-primary">
              <MapPin className="w-4 h-4" />
              Go to Allotment
            </Link>
          </div>
        ) : beds.length === 0 ? (
          <div className="zen-card p-6 text-center">
            <MapPin className="w-8 h-8 text-zen-water-400 mx-auto mb-3" />
            <p className="text-zen-stone-600 mb-4">
              You need a bed before you can log anything.
            </p>
            <Link href="/allotment" className="zen-btn-primary">
              <MapPin className="w-4 h-4" />
              Set up my allotment
            </Link>
          </div>
        ) : (
          <>
            {/* Step 1 — pick the bed */}
            <section className="mb-6" aria-label="Choose a bed">
              <h2 className="text-sm font-medium text-zen-ink-700 mb-2">Which bed?</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {beds.map(bed => {
                  const active = bedId === bed.id
                  return (
                    <button
                      key={bed.id}
                      onClick={() => {
                        setBedId(bed.id)
                        setPlantingId(null)
                      }}
                      aria-pressed={active}
                      className={`min-h-[56px] rounded-zen px-3 py-2 text-left font-medium transition border ${
                        active
                          ? 'bg-zen-moss-600 text-white border-zen-moss-600'
                          : 'bg-white text-zen-ink-700 border-zen-stone-200 hover:bg-zen-stone-50'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        {bed.icon && <span>{bed.icon}</span>}
                        <span className="truncate">{bed.name}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>

            {/* Step 2 — pick the event */}
            {bedId && (
              <section className="mb-6" aria-label="Choose an event">
                <h2 className="text-sm font-medium text-zen-ink-700 mb-2">What happened?</h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {EVENTS.map(ev => {
                    const Icon = ev.icon
                    const active = event?.type === ev.type
                    return (
                      <button
                        key={ev.type}
                        onClick={() => setEvent(ev)}
                        aria-pressed={active}
                        className={`min-h-[72px] rounded-zen flex flex-col items-center justify-center gap-1 px-2 py-2 transition border ${
                          active
                            ? 'bg-zen-moss-600 text-white border-zen-moss-600'
                            : 'bg-white text-zen-ink-700 border-zen-stone-200 hover:bg-zen-stone-50'
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                        <span className="text-xs font-medium">{ev.label}</span>
                      </button>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Step 3 — details (all optional except harvest quantity is encouraged) */}
            {bedId && event && (
              <section className="zen-card p-4 mb-6" aria-label="Details">
                {/* Optional: which crop is this about */}
                {bedPlantings.length > 0 && (
                  <div className="mb-4">
                    <label className="text-sm font-medium text-zen-ink-700 mb-2 block">
                      About which crop? <span className="text-zen-stone-400 font-normal">(optional)</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setPlantingId(null)}
                        aria-pressed={plantingId === null}
                        className={`min-h-[44px] px-3 rounded-zen text-sm border ${
                          plantingId === null
                            ? 'bg-zen-ink-700 text-white border-zen-ink-700'
                            : 'bg-white text-zen-ink-700 border-zen-stone-200'
                        }`}
                      >
                        Whole bed
                      </button>
                      {bedPlantings.map(p => {
                        const veg = getVegetableById(p.plantId)
                        const label = veg?.name ?? p.plantId
                        const active = plantingId === p.id
                        return (
                          <button
                            key={p.id}
                            onClick={() => setPlantingId(p.id)}
                            aria-pressed={active}
                            className={`min-h-[44px] px-3 rounded-zen text-sm border ${
                              active
                                ? 'bg-zen-moss-600 text-white border-zen-moss-600'
                                : 'bg-white text-zen-ink-700 border-zen-stone-200'
                            }`}
                          >
                            {label}
                            {p.varietyName ? ` · ${p.varietyName}` : ''}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Harvest quantity */}
                {event.isHarvest && (
                  <div className="mb-4">
                    <label className="text-sm font-medium text-zen-ink-700 mb-2 block">
                      How much? <span className="text-zen-stone-400 font-normal">(optional)</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        placeholder="Amount"
                        value={quantity}
                        onChange={e => setQuantity(e.target.value)}
                        className="flex-1 min-h-[48px] px-3 border border-zen-stone-200 rounded-zen"
                      />
                      <div className="flex rounded-zen overflow-hidden border border-zen-stone-200">
                        {(['kg', 'count'] as const).map(u => (
                          <button
                            key={u}
                            onClick={() => setUnit(u)}
                            aria-pressed={unit === u}
                            className={`min-h-[48px] px-4 text-sm font-medium ${
                              unit === u ? 'bg-zen-moss-600 text-white' : 'bg-white text-zen-ink-700'
                            }`}
                          >
                            {u}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Severity for pest/disease/damage */}
                {event.needsSeverity && (
                  <div className="mb-4">
                    <label className="text-sm font-medium text-zen-ink-700 mb-2 block">How bad?</label>
                    <div className="flex gap-2">
                      {([1, 2, 3] as ObservationSeverity[]).map(s => (
                        <button
                          key={s}
                          onClick={() => setSeverity(s)}
                          aria-pressed={severity === s}
                          className={`flex-1 min-h-[48px] rounded-zen text-sm font-medium border ${
                            severity === s
                              ? 'bg-zen-kitsune-600 text-white border-zen-kitsune-600'
                              : 'bg-white text-zen-ink-700 border-zen-stone-200'
                          }`}
                        >
                          {s} · {SEVERITY_LABELS[s]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Optional note */}
                <div className="mb-4">
                  <label htmlFor="log-note" className="text-sm font-medium text-zen-ink-700 mb-2 block">
                    Note <span className="text-zen-stone-400 font-normal">(optional)</span>
                  </label>
                  <input
                    id="log-note"
                    type="text"
                    placeholder="e.g. slugs on the outer leaves"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    className="w-full min-h-[48px] px-3 border border-zen-stone-200 rounded-zen"
                  />
                </div>

                {/* Date — defaults to today, tap to backdate */}
                <div className="mb-4">
                  <label htmlFor="log-date" className="text-sm font-medium text-zen-ink-700 mb-2 block">
                    When
                  </label>
                  <input
                    id="log-date"
                    type="date"
                    value={date}
                    min={seasonMin}
                    max={seasonMax}
                    onChange={e => setDate(e.target.value)}
                    className="min-h-[48px] px-3 border border-zen-stone-200 rounded-zen"
                  />
                </div>

                <button
                  onClick={handleSave}
                  className="w-full min-h-[56px] rounded-zen bg-zen-moss-600 text-white font-medium text-lg flex items-center justify-center gap-2 hover:bg-zen-moss-700 transition"
                >
                  <Check className="w-6 h-6" />
                  Save
                </button>
              </section>
            )}
          </>
        )}

        {/* Retroactive capture: rebuild the season from camera-roll photos */}
        <div className="mt-6">
          <Link
            href="/log/import"
            className="inline-flex items-center gap-2 text-sm text-zen-moss-700 hover:text-zen-moss-800 font-medium"
          >
            <Camera className="w-4 h-4" />
            Import observations from photos
          </Link>
        </div>

        <div className="mt-8 flex items-center justify-between text-sm">
          <Link href="/allotment" className="inline-flex items-center gap-1 text-zen-stone-500 hover:text-zen-moss-700">
            <ChevronLeft className="w-4 h-4" />
            Back to allotment
          </Link>
          <span className="text-zen-stone-400">Saves offline · syncs later</span>
        </div>
      </div>
    </div>
  )
}
