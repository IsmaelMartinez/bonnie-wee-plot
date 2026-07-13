'use client'

/**
 * Camera-roll importer — reconstruct a season from phone photos
 * (Season Observer Phase 2, workstream A).
 *
 * The user points this at their photo library; we read EXIF timestamps and
 * GPS *client-side only*, keep the photos taken within ~100m of the plot
 * (`meta.coordinates`), group them by calendar date, and present each date
 * as draft observations. Nothing is saved until the user assigns a bed and
 * confirms a date — unconfirmed drafts are discarded, never persisted.
 *
 * Privacy: photo bytes and EXIF (including GPS) stay on this device. Blobs
 * go to the separate `bwp-photos` IndexedDB store; the Yjs/AllotmentData
 * document (which cloud sync, export, and share serialise) only ever holds
 * the opaque `photoId` string on the confirmed care-log entry.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Camera,
  Check,
  ChevronLeft,
  Images,
  Loader2,
  MapPin,
  MapPinOff,
  AlertTriangle,
} from 'lucide-react'
import { useAllotment } from '@/hooks/useAllotment'
import { generateId } from '@/lib/utils'
import { todayLocalISO } from '@/lib/log-date'
import { parseExif } from '@/lib/photo-import/exif'
import {
  buildDraftObservations,
  type DraftGroup,
  type DraftPipelineResult,
  type PhotoMetaRecord,
} from '@/lib/photo-import/pipeline'
import { putPhotos, type StoredPhoto } from '@/services/photo-store'
import type { Area, NewCareLogEntry } from '@/types/unified-allotment'

const EXCLUSION_LABELS: Record<string, string> = {
  'no-date': 'no readable date (HEIC or stripped EXIF)',
  'no-gps': 'no location data',
  'outside-geofence': 'taken away from the plot',
}

export default function PhotoImportPage() {
  const {
    isLoading,
    data,
    selectedYear,
    getAllAreas,
    addCareLog,
  } = useAllotment()

  const [parsing, setParsing] = useState(false)
  const [result, setResult] = useState<DraftPipelineResult | null>(null)
  const [bedByDate, setBedByDate] = useState<Record<string, string>>({})
  const [excludedPhotos, setExcludedPhotos] = useState<Record<string, boolean>>({})
  const [captions, setCaptions] = useState<Record<string, string>>({})
  const [confirmedDates, setConfirmedDates] = useState<Record<string, number>>({})
  const [savingDate, setSavingDate] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Photo bytes + preview object URLs, kept outside React state (not render
  // input except via previewVersion bump after parse).
  const filesRef = useRef<Map<string, File>>(new Map())
  const previewUrlsRef = useRef<Map<string, string>>(new Map())
  const [, setPreviewVersion] = useState(0)
  // Drafts whose care-log entry has actually been written. If a save fails
  // partway, the confirm button stays active for retry — and a retry must
  // only process the genuinely unsaved remainder, because addCareLog
  // appends: re-running an already-saved draft would duplicate its
  // observation entry. (putPhotos is an idempotent overwrite by id, so
  // photos don't have this problem.)
  const savedPhotoIdsRef = useRef<Set<string>>(new Set())

  const plotCoordinates = data?.meta.coordinates

  const revokeAllPreviews = () => {
    for (const url of previewUrlsRef.current.values()) URL.revokeObjectURL(url)
    previewUrlsRef.current.clear()
  }

  // Release preview object URLs on unmount so blobs don't stay pinned.
  useEffect(() => revokeAllPreviews, [])

  const beds = useMemo(
    () =>
      getAllAreas()
        .filter((a: Area) => a.canHavePlantings && !a.isArchived)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [getAllAreas]
  )

  // Confirmed entries file into the selected season via addCareLog, so only
  // dates inside that season (and not in the future) are importable. Other
  // groups render with an explanation instead of a confirm button.
  const todayStr = todayLocalISO()
  const seasonMin = `${selectedYear}-01-01`
  const yearEnd = `${selectedYear}-12-31`
  const seasonMax = todayStr < yearEnd ? todayStr : yearEnd
  const isDateImportable = (date: string) => date >= seasonMin && date <= seasonMax

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    setParsing(true)
    setSaveError(null)
    setResult(null)
    setConfirmedDates({})
    setExcludedPhotos({})
    setCaptions({})
    setBedByDate({})
    revokeAllPreviews()
    filesRef.current.clear()
    savedPhotoIdsRef.current.clear()

    // Parse in parallel, but in modest chunks: each in-flight file holds its
    // full ArrayBuffer until parsed, so unbounded Promise.all over a
    // multi-hundred-photo camera roll would balloon memory. Eight at a time
    // keeps the I/O pipelined without that risk; chunk results are appended
    // in order so record order stays stable.
    const PARSE_CONCURRENCY = 8
    const files = Array.from(fileList)
    const records: PhotoMetaRecord[] = []
    for (let i = 0; i < files.length; i += PARSE_CONCURRENCY) {
      const chunk = files.slice(i, i + PARSE_CONCURRENCY)
      const parsed = await Promise.all(
        chunk.map(async file => {
          const id = generateId('photo')
          let exif: ReturnType<typeof parseExif> = {}
          try {
            exif = parseExif(await file.arrayBuffer())
          } catch {
            // Unreadable file — fall through with empty EXIF; the pipeline
            // will report it as excluded rather than aborting the import.
          }
          filesRef.current.set(id, file)
          previewUrlsRef.current.set(id, URL.createObjectURL(file))
          const record: PhotoMetaRecord = { id, fileName: file.name }
          if (exif.takenAt) record.takenAt = exif.takenAt
          if (exif.latitude !== undefined) record.latitude = exif.latitude
          if (exif.longitude !== undefined) record.longitude = exif.longitude
          return record
        })
      )
      records.push(...parsed)
    }

    const pipelineResult = buildDraftObservations(records, {
      plotCoordinates,
    })
    setResult(pipelineResult)
    setPreviewVersion(v => v + 1)
    setParsing(false)
  }

  const handleConfirmGroup = async (group: DraftGroup) => {
    const bedId = bedByDate[group.date]
    if (!bedId || savingDate) return
    setSavingDate(group.date)
    setSaveError(null)

    // Only the drafts the user kept, minus anything a previous (partially
    // failed) attempt already saved — see savedPhotoIdsRef.
    const pending = group.drafts.filter(
      draft =>
        !excludedPhotos[draft.photoId] &&
        !savedPhotoIdsRef.current.has(draft.photoId) &&
        filesRef.current.has(draft.photoId)
    )

    // 1. All blobs into the local-only photo store in one transaction —
    // all-or-nothing, so a failure here persists nothing and retry is safe.
    const photos: StoredPhoto[] = pending.map(draft => {
      const exifJson: Record<string, string | number> = { takenAt: draft.takenAt }
      if (draft.latitude !== undefined) exifJson.latitude = draft.latitude
      if (draft.longitude !== undefined) exifJson.longitude = draft.longitude
      return {
        id: draft.photoId,
        blob: filesRef.current.get(draft.photoId)!,
        takenAt: draft.takenAt,
        ...(draft.latitude !== undefined ? { latitude: draft.latitude } : {}),
        ...(draft.longitude !== undefined ? { longitude: draft.longitude } : {}),
        bedId,
        exifJson: JSON.stringify(exifJson),
      }
    })
    try {
      await putPhotos(photos)
    } catch {
      setSaveError(
        `Could not save the photos for ${formatGroupDate(group.date)}. Nothing was imported for that day — please try again.`
      )
      setSavingDate(null)
      return
    }

    // 2. …then the observation care-log entries referencing them by id,
    // marking each draft saved so a retry never duplicates an entry.
    try {
      for (const draft of pending) {
        const entry: NewCareLogEntry = {
          type: 'observation',
          date: draft.date,
        }
        const caption = captions[draft.photoId]?.trim()
        if (caption) entry.description = caption
        entry.photoId = draft.photoId
        addCareLog(bedId, entry)
        savedPhotoIdsRef.current.add(draft.photoId)
      }
      const totalSaved = group.drafts.filter(d => savedPhotoIdsRef.current.has(d.photoId)).length
      setConfirmedDates(prev => ({ ...prev, [group.date]: totalSaved }))
    } catch {
      const savedCount = group.drafts.filter(d => savedPhotoIdsRef.current.has(d.photoId)).length
      setSaveError(
        `Could not log every photo for ${formatGroupDate(group.date)}. ${savedCount} saved so far — retry to finish the rest (already-saved photos won't be duplicated).`
      )
    } finally {
      setSavingDate(null)
    }
  }

  const excludedSummary = useMemo(() => {
    if (!result || result.excluded.length === 0) return null
    const counts = new Map<string, number>()
    for (const ex of result.excluded) {
      counts.set(ex.reason, (counts.get(ex.reason) ?? 0) + 1)
    }
    return [...counts.entries()]
      .map(([reason, count]) => `${count} ${EXCLUSION_LABELS[reason] ?? reason}`)
      .join(', ')
  }, [result])

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
            <Camera className="w-6 h-6 text-zen-moss-600" />
            <h1 className="text-zen-ink-900">Import from photos</h1>
          </div>
          <p className="text-zen-stone-500">
            Rebuild your {selectedYear} log from your camera roll. Photos are read on this
            device only — nothing is uploaded, and every entry needs your confirmation.
          </p>
        </header>

        {/* Geofence status */}
        <div
          role="note"
          className={`mb-6 flex items-start gap-2 rounded-zen border px-3 py-2 text-sm ${
            plotCoordinates
              ? 'bg-zen-moss-50 border-zen-moss-200 text-zen-moss-800'
              : 'bg-zen-kitsune-50 border-zen-kitsune-200 text-zen-kitsune-800'
          }`}
        >
          {plotCoordinates ? (
            <>
              <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Only photos taken within about 100m of your plot will be suggested.
              </span>
            </>
          ) : (
            <>
              <MapPinOff className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Your plot location isn&apos;t set, so photos can&apos;t be filtered by place —
                every dated photo will be suggested. Untick any that aren&apos;t from the plot.
              </span>
            </>
          )}
        </div>

        {/* Step 1 — pick photos */}
        <section className="zen-card p-4 mb-6" aria-label="Choose photos">
          <label
            htmlFor="photo-import-input"
            className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-zen-stone-300 rounded-zen px-4 py-8 cursor-pointer hover:border-zen-moss-400 hover:bg-zen-stone-50 transition"
          >
            <Images className="w-8 h-8 text-zen-moss-600" />
            <span className="font-medium text-zen-ink-800">Choose photos from your library</span>
            <span className="text-sm text-zen-stone-500">
              JPEG photos with date &amp; location work best
            </span>
          </label>
          <input
            id="photo-import-input"
            type="file"
            multiple
            accept="image/*"
            className="sr-only"
            onChange={e => {
              void handleFiles(e.target.files)
              // Allow re-selecting the same files after a reset.
              e.target.value = ''
            }}
          />
        </section>

        {parsing && (
          <div className="flex items-center gap-2 text-zen-stone-600 mb-6" role="status">
            <Loader2 className="w-5 h-5 animate-spin" />
            Reading photo dates and locations…
          </div>
        )}

        {saveError && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2 rounded-zen bg-zen-kitsune-50 border border-zen-kitsune-200 px-3 py-2 text-sm text-zen-kitsune-800"
          >
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{saveError}</span>
          </div>
        )}

        {/* Step 2 — review drafts */}
        {result && !parsing && (
          <section aria-label="Review draft observations">
            <div className="mb-4 text-sm text-zen-stone-600">
              <p>
                <strong>{result.draftCount}</strong> photo{result.draftCount === 1 ? '' : 's'} matched
                across <strong>{result.groups.length}</strong> day{result.groups.length === 1 ? '' : 's'}.
                {excludedSummary && <> Skipped: {excludedSummary}.</>}
              </p>
            </div>

            {result.groups.length === 0 && (
              <div className="zen-card p-6 text-center text-zen-stone-600">
                No usable photos found. Photos need an EXIF date
                {plotCoordinates ? ' and a location near your plot' : ''} to be suggested.
              </div>
            )}

            {result.groups.map(group => {
              const importable = isDateImportable(group.date)
              const confirmedCount = confirmedDates[group.date]
              const isConfirmed = confirmedCount !== undefined
              const includedCount = group.drafts.filter(d => !excludedPhotos[d.photoId]).length
              const bedId = bedByDate[group.date] ?? ''
              return (
                <div key={group.date} className="zen-card p-4 mb-4">
                  <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                    <h2 className="font-medium text-zen-ink-800">
                      {formatGroupDate(group.date)}
                      <span className="text-zen-stone-400 font-normal text-sm ml-2">
                        {group.drafts.length} photo{group.drafts.length === 1 ? '' : 's'}
                      </span>
                    </h2>
                    {isConfirmed && (
                      <span className="inline-flex items-center gap-1 text-sm text-zen-moss-700 font-medium">
                        <Check className="w-4 h-4" />
                        {confirmedCount} saved
                      </span>
                    )}
                  </div>

                  {!importable && (
                    <p className="text-sm text-zen-kitsune-800 bg-zen-kitsune-50 border border-zen-kitsune-200 rounded-zen px-3 py-2 mb-3">
                      This date is outside the active {selectedYear} season, so it can&apos;t be
                      imported right now. Switch the active year on the Allotment page to file it.
                    </p>
                  )}

                  {/* Photo thumbnails */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
                    {group.drafts.map(draft => {
                      const url = previewUrlsRef.current.get(draft.photoId)
                      const excluded = !!excludedPhotos[draft.photoId]
                      return (
                        <div key={draft.photoId} className="space-y-1">
                          <button
                            type="button"
                            onClick={() =>
                              !isConfirmed &&
                              setExcludedPhotos(prev => ({
                                ...prev,
                                [draft.photoId]: !prev[draft.photoId],
                              }))
                            }
                            aria-pressed={!excluded}
                            aria-label={`${excluded ? 'Include' : 'Exclude'} photo ${draft.fileName}`}
                            className={`relative block w-full aspect-square overflow-hidden rounded-zen border-2 transition ${
                              excluded
                                ? 'border-zen-stone-200 opacity-40'
                                : 'border-zen-moss-400'
                            }`}
                          >
                            {url ? (
                              // eslint-disable-next-line @next/next/no-img-element -- local object URL, next/image can't optimise it
                              <img
                                src={url}
                                alt={`Photo taken ${draft.takenAt.replace('T', ' at ')}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="flex items-center justify-center w-full h-full bg-zen-stone-100 text-zen-stone-400">
                                <Camera className="w-6 h-6" />
                              </span>
                            )}
                            {!excluded && (
                              <span className="absolute top-1 right-1 bg-zen-moss-600 text-white rounded-full p-0.5">
                                <Check className="w-3 h-3" />
                              </span>
                            )}
                          </button>
                          {!isConfirmed && !excluded && (
                            <input
                              type="text"
                              placeholder="Note (optional)"
                              value={captions[draft.photoId] ?? ''}
                              onChange={e =>
                                setCaptions(prev => ({ ...prev, [draft.photoId]: e.target.value }))
                              }
                              className="w-full text-xs px-2 py-1 border border-zen-stone-200 rounded-zen"
                              aria-label={`Note for photo ${draft.fileName}`}
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Bed + confirm */}
                  {importable && !isConfirmed && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={bedId}
                        onChange={e =>
                          setBedByDate(prev => ({ ...prev, [group.date]: e.target.value }))
                        }
                        className="min-h-[44px] px-3 border border-zen-stone-200 rounded-zen bg-white text-sm"
                        aria-label={`Bed for ${group.date}`}
                      >
                        <option value="">Which bed?</option>
                        {beds.map(bed => (
                          <option key={bed.id} value={bed.id}>
                            {bed.icon ? `${bed.icon} ` : ''}{bed.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => void handleConfirmGroup(group)}
                        disabled={!bedId || includedCount === 0 || savingDate !== null}
                        className="min-h-[44px] px-4 rounded-zen bg-zen-moss-600 text-white text-sm font-medium inline-flex items-center gap-2 disabled:opacity-40 hover:bg-zen-moss-700 transition"
                      >
                        {savingDate === group.date ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        Save {includedCount} observation{includedCount === 1 ? '' : 's'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </section>
        )}

        <div className="mt-8 flex items-center justify-between text-sm">
          <Link
            href="/log"
            className="inline-flex items-center gap-1 text-zen-stone-500 hover:text-zen-moss-700"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Quick Log
          </Link>
          <span className="text-zen-stone-400">Photos stay on this device</span>
        </div>
      </div>
    </div>
  )
}

/** "2026-04-12" -> "Saturday 12 April 2026" (locale-aware, UTC-safe). */
function formatGroupDate(date: string): string {
  const dt = new Date(`${date}T00:00:00`)
  if (Number.isNaN(dt.getTime())) return date
  return dt.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
