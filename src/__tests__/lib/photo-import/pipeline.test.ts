import { describe, it, expect } from 'vitest'
import { parseExif } from '@/lib/photo-import/exif'
import {
  buildDraftObservations,
  type PhotoMetaRecord,
} from '@/lib/photo-import/pipeline'
import { buildJpegWithExif } from './exif-fixture'

const PLOT = { latitude: 55.9533, longitude: -3.1883 }
const EARTH_RADIUS_METERS = 6371008.8

/** Latitude offset in degrees for a due-north distance in metres. */
function latOffset(meters: number): number {
  return (meters / EARTH_RADIUS_METERS) * (180 / Math.PI)
}

let seq = 0
function record(overrides: Partial<PhotoMetaRecord> = {}): PhotoMetaRecord {
  seq++
  return {
    id: `photo-${seq}`,
    fileName: `IMG_${String(seq).padStart(4, '0')}.jpg`,
    takenAt: '2026-04-12T09:30:00',
    latitude: PLOT.latitude,
    longitude: PLOT.longitude,
    ...overrides,
  }
}

describe('buildDraftObservations — date grouping', () => {
  it('groups drafts by calendar date, oldest date first, time-ordered within a day', () => {
    const records = [
      record({ takenAt: '2026-05-02T17:00:00' }),
      record({ takenAt: '2026-05-01T09:00:00' }),
      record({ takenAt: '2026-05-02T08:00:00' }),
      record({ takenAt: '2026-05-01T12:30:00' }),
    ]
    const result = buildDraftObservations(records, { plotCoordinates: PLOT })

    expect(result.groups.map(g => g.date)).toEqual(['2026-05-01', '2026-05-02'])
    expect(result.groups[0].drafts.map(d => d.takenAt)).toEqual([
      '2026-05-01T09:00:00',
      '2026-05-01T12:30:00',
    ])
    expect(result.groups[1].drafts.map(d => d.takenAt)).toEqual([
      '2026-05-02T08:00:00',
      '2026-05-02T17:00:00',
    ])
    expect(result.draftCount).toBe(4)
    expect(result.excluded).toEqual([])
  })

  it('excludes photos without a timestamp — a reconstruction never guesses dates', () => {
    const dated = record()
    const undated = record({ takenAt: undefined })
    const result = buildDraftObservations([dated, undated], { plotCoordinates: PLOT })
    expect(result.draftCount).toBe(1)
    expect(result.excluded).toEqual([{ record: undated, reason: 'no-date' }])
  })
})

describe('buildDraftObservations — geofence', () => {
  it('keeps 99m, drops 101m, drops missing-GPS when plot coordinates are set', () => {
    const inside = record({ latitude: PLOT.latitude + latOffset(99) })
    const outside = record({ latitude: PLOT.latitude + latOffset(101) })
    const noGps = record({ latitude: undefined, longitude: undefined })

    const result = buildDraftObservations([inside, outside, noGps], {
      plotCoordinates: PLOT,
    })

    expect(result.geofenceApplied).toBe(true)
    expect(result.draftCount).toBe(1)
    expect(result.groups[0].drafts[0].photoId).toBe(inside.id)
    expect(result.excluded).toEqual([
      { record: outside, reason: 'outside-geofence' },
      { record: noGps, reason: 'no-gps' },
    ])
  })

  it('skips the geofence gracefully when plot coordinates are missing', () => {
    const farAway = record({ latitude: 40.4168, longitude: -3.7038 }) // Madrid
    const noGps = record({ latitude: undefined, longitude: undefined })

    const result = buildDraftObservations([farAway, noGps], {})

    expect(result.geofenceApplied).toBe(false)
    // Without a plot to measure from, all dated photos pass — the UI warns
    // the user and lets them deselect strays.
    expect(result.draftCount).toBe(2)
    expect(result.excluded).toEqual([])
  })

  it('honours a custom radius', () => {
    const at150 = record({ latitude: PLOT.latitude + latOffset(150) })
    const wide = buildDraftObservations([at150], { plotCoordinates: PLOT, radiusMeters: 200 })
    const tight = buildDraftObservations([at150], { plotCoordinates: PLOT, radiusMeters: 100 })
    expect(wide.draftCount).toBe(1)
    expect(tight.draftCount).toBe(0)
  })
})

describe('acceptance — season reconstruction from a 30+ photo camera roll', () => {
  it('feeds 38 photos through parse → geofence → group → draft and yields 30+ drafts grouped correctly', () => {
    // A believable Jan–Jul 2026 season: 10 plot visits, 3 photos each,
    // all geotagged within 100m of the plot (spread up to ~80m from it).
    const visitDates = [
      '2026:01:18', '2026:02:07', '2026:03:01', '2026:03:22', '2026:04:12',
      '2026:05:03', '2026:05:24', '2026:06:14', '2026:06:28', '2026:07:12',
    ]
    const files: Array<{ name: string; buffer: ArrayBuffer }> = []
    let n = 0
    for (const date of visitDates) {
      for (let shot = 0; shot < 3; shot++) {
        n++
        files.push({
          name: `IMG_${String(n).padStart(4, '0')}.jpg`,
          buffer: buildJpegWithExif({
            dateTimeOriginal: `${date} ${String(9 + shot * 2).padStart(2, '0')}:15:00`,
            latitude: PLOT.latitude + latOffset(shot * 40), // 0m, 40m, 80m north
            longitude: PLOT.longitude,
            littleEndian: n % 2 === 0, // exercise both byte orders
          }),
        })
      }
    }
    // Camera-roll noise that must be filtered out, not imported:
    files.push({
      name: 'holiday.jpg', // 5km away
      buffer: buildJpegWithExif({
        dateTimeOriginal: '2026:06:20 14:00:00',
        latitude: PLOT.latitude + latOffset(5000),
        longitude: PLOT.longitude,
      }),
    })
    files.push({
      name: 'screenshot.jpg', // no GPS
      buffer: buildJpegWithExif({ dateTimeOriginal: '2026:03:15 20:00:00' }),
    })
    files.push({
      name: 'no-exif.jpg', // no metadata at all
      buffer: buildJpegWithExif({}),
    })
    ;[...Array(5)].forEach((_, i) => {
      files.push({
        name: `walk-${i}.jpg`, // 101m — just outside the fence
        buffer: buildJpegWithExif({
          dateTimeOriginal: '2026:04:12 19:00:00',
          latitude: PLOT.latitude + latOffset(101),
          longitude: PLOT.longitude,
        }),
      })
    })

    expect(files.length).toBeGreaterThanOrEqual(30)

    // parse (real EXIF byte parsing) → metadata records
    const records: PhotoMetaRecord[] = files.map((file, i) => {
      const exif = parseExif(file.buffer)
      const rec: PhotoMetaRecord = { id: `p${i}`, fileName: file.name }
      if (exif.takenAt) rec.takenAt = exif.takenAt
      if (exif.latitude !== undefined) rec.latitude = exif.latitude
      if (exif.longitude !== undefined) rec.longitude = exif.longitude
      return rec
    })

    // geofence → group → draft
    const result = buildDraftObservations(records, { plotCoordinates: PLOT })

    // ≥30 draft observations out, one per genuine plot photo.
    expect(result.draftCount).toBeGreaterThanOrEqual(30)
    expect(result.draftCount).toBe(30)

    // Grouped correctly: one group per visit date, 3 drafts each, sorted.
    expect(result.groups).toHaveLength(10)
    expect(result.groups.map(g => g.date)).toEqual([
      '2026-01-18', '2026-02-07', '2026-03-01', '2026-03-22', '2026-04-12',
      '2026-05-03', '2026-05-24', '2026-06-14', '2026-06-28', '2026-07-12',
    ])
    for (const group of result.groups) {
      expect(group.drafts).toHaveLength(3)
      const times = group.drafts.map(d => d.takenAt)
      expect(times).toEqual([...times].sort())
      for (const draft of group.drafts) {
        expect(draft.date).toBe(group.date)
        expect(draft.takenAt.slice(0, 10)).toBe(group.date)
      }
    }

    // The noise was excluded for the right reasons.
    const reasons = result.excluded.map(e => e.reason)
    expect(reasons.filter(r => r === 'outside-geofence')).toHaveLength(6) // holiday + 5 walk shots
    expect(reasons.filter(r => r === 'no-gps')).toHaveLength(1)
    expect(reasons.filter(r => r === 'no-date')).toHaveLength(1)

    // Drafts are drafts: nothing here persisted anything (pure function),
    // and every draft still needs a human to assign a bed and confirm.
    for (const group of result.groups) {
      for (const draft of group.drafts) {
        expect(draft.suggestedCaption).toBeUndefined() // vision seam unused in v1
      }
    }
  })
})
