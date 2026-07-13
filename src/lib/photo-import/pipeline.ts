/**
 * Draft-observation pipeline for the camera-roll importer:
 * photo metadata -> geofence -> group by calendar date -> draft observations.
 *
 * Pure and deterministic (no I/O, no Date.now) so the whole reconstruction
 * path is unit-testable with fixture metadata. Drafts are exactly that —
 * drafts. Nothing here writes to AllotmentData or the photo store; only a
 * human confirming a draft in the review UI persists anything, and
 * unconfirmed drafts are simply discarded.
 */

import {
  DEFAULT_GEOFENCE_RADIUS_METERS,
  isWithinGeofence,
  type LatLon,
} from './geofence'

/** Metadata extracted from one photo file (EXIF already parsed). */
export interface PhotoMetaRecord {
  /** Stable id for this candidate photo; becomes the stored photo id on confirm. */
  id: string
  fileName: string
  /** Naive local ISO timestamp from EXIF DateTimeOriginal, if present. */
  takenAt?: string
  latitude?: number
  longitude?: number
}

/**
 * One reviewable draft observation, derived from one photo.
 *
 * Vision seam: `suggestedCaption` is where a future local image annotator
 * (see `DraftAnnotator`) would put a machine-suggested description for the
 * user to accept or edit. v1 never sets it — drafts stay caption-less until
 * the human types one.
 */
export interface DraftObservation {
  photoId: string
  fileName: string
  /** Grouping key, local calendar date YYYY-MM-DD. */
  date: string
  takenAt: string
  latitude?: number
  longitude?: number
  suggestedCaption?: string
}

/**
 * Seam for a future local (on-device, human-confirmed) vision captioner.
 * Implementations must be pure over their inputs and must not perform
 * network calls — the importer's privacy contract is "nothing leaves the
 * device". v1 ships no implementation.
 */
export interface DraftAnnotator {
  annotate(
    photo: Blob,
    draft: DraftObservation
  ): Promise<Pick<DraftObservation, 'suggestedCaption'>>
}

/** Drafts for one calendar date, oldest photo first. */
export interface DraftGroup {
  date: string
  drafts: DraftObservation[]
}

/** Why a photo was left out of the drafts, for honest UI reporting. */
export interface ExcludedPhoto {
  record: PhotoMetaRecord
  reason: 'no-date' | 'no-gps' | 'outside-geofence'
}

export interface DraftPipelineResult {
  /** Date groups, oldest date first. */
  groups: DraftGroup[]
  /** Total drafts across all groups. */
  draftCount: number
  excluded: ExcludedPhoto[]
  /** False when plot coordinates were missing and the geofence was skipped. */
  geofenceApplied: boolean
}

export interface DraftPipelineOptions {
  /** Plot coordinates (`meta.coordinates`). Undefined disables the geofence. */
  plotCoordinates?: LatLon
  radiusMeters?: number
}

/**
 * Run parsed photo metadata through geofence + date grouping and emit
 * reviewable draft observations.
 *
 * Rules:
 * - No EXIF timestamp -> excluded ('no-date'): a season reconstruction is
 *   useless without a date, and guessing one would fabricate history.
 * - Geofence on (plot coordinates known): photos without GPS are excluded
 *   ('no-gps'), photos beyond the radius are excluded ('outside-geofence').
 * - Geofence off (no plot coordinates): every dated photo passes; the UI
 *   tells the user filtering was skipped so they can deselect strays.
 */
export function buildDraftObservations(
  records: PhotoMetaRecord[],
  options: DraftPipelineOptions = {}
): DraftPipelineResult {
  const { plotCoordinates, radiusMeters = DEFAULT_GEOFENCE_RADIUS_METERS } = options
  const excluded: ExcludedPhoto[] = []
  const drafts: DraftObservation[] = []

  for (const record of records) {
    if (!record.takenAt) {
      excluded.push({ record, reason: 'no-date' })
      continue
    }
    if (plotCoordinates) {
      if (record.latitude === undefined || record.longitude === undefined) {
        excluded.push({ record, reason: 'no-gps' })
        continue
      }
      const point = { latitude: record.latitude, longitude: record.longitude }
      if (!isWithinGeofence(point, plotCoordinates, radiusMeters)) {
        excluded.push({ record, reason: 'outside-geofence' })
        continue
      }
    }
    const draft: DraftObservation = {
      photoId: record.id,
      fileName: record.fileName,
      date: record.takenAt.slice(0, 10),
      takenAt: record.takenAt,
    }
    if (record.latitude !== undefined) draft.latitude = record.latitude
    if (record.longitude !== undefined) draft.longitude = record.longitude
    drafts.push(draft)
  }

  // Group by calendar date; groups oldest-first, photos within a group in
  // time order — the natural way to relive a season.
  const byDate = new Map<string, DraftObservation[]>()
  for (const draft of drafts) {
    const group = byDate.get(draft.date)
    if (group) group.push(draft)
    else byDate.set(draft.date, [draft])
  }
  const groups: DraftGroup[] = [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, groupDrafts]) => ({
      date,
      drafts: [...groupDrafts].sort((a, b) => a.takenAt.localeCompare(b.takenAt)),
    }))

  return {
    groups,
    draftCount: drafts.length,
    excluded,
    geofenceApplied: plotCoordinates !== undefined,
  }
}
