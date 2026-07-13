import { describe, it, expect } from 'vitest'
import { parseExif, exifDateToIso } from '@/lib/photo-import/exif'
import { buildJpegWithExif, buildJpegWithoutExif } from './exif-fixture'

// Real-world-ish plot coordinates (Edinburgh allotment).
const LAT = 55.9533
const LON = -3.1883

describe('exifDateToIso', () => {
  it('converts EXIF timestamps to naive ISO', () => {
    expect(exifDateToIso('2026:04:12 09:30:00')).toBe('2026-04-12T09:30:00')
  })

  it('rejects malformed values', () => {
    expect(exifDateToIso('')).toBeUndefined()
    expect(exifDateToIso('not a date')).toBeUndefined()
    expect(exifDateToIso('2026-04-12 09:30:00')).toBeUndefined() // wrong separator
    expect(exifDateToIso('2026:13:12 09:30:00')).toBeUndefined() // month 13
    expect(exifDateToIso('2026:04:12 25:30:00')).toBeUndefined() // hour 25
  })

  it('rejects impossible calendar dates instead of letting them roll over', () => {
    expect(exifDateToIso('2026:02:31 10:00:00')).toBeUndefined() // Feb 31 (would roll to Mar 3)
    expect(exifDateToIso('2026:04:31 10:00:00')).toBeUndefined() // April has 30 days
    expect(exifDateToIso('2026:02:29 10:00:00')).toBeUndefined() // 2026 is not a leap year
    expect(exifDateToIso('2026:06:00 10:00:00')).toBeUndefined() // day 0
    expect(exifDateToIso('2024:02:29 10:00:00')).toBe('2024-02-29T10:00:00') // real leap day
  })
})

describe('parseExif', () => {
  it('reads DateTimeOriginal and GPS from a little-endian EXIF block', () => {
    const buffer = buildJpegWithExif({
      dateTimeOriginal: '2026:04:12 09:30:00',
      latitude: LAT,
      longitude: LON,
      littleEndian: true,
    })
    const result = parseExif(buffer)
    expect(result.takenAt).toBe('2026-04-12T09:30:00')
    expect(result.latitude).toBeCloseTo(LAT, 5)
    expect(result.longitude).toBeCloseTo(LON, 5)
  })

  it('reads big-endian ("MM") EXIF blocks too', () => {
    const buffer = buildJpegWithExif({
      dateTimeOriginal: '2026:07:01 18:05:59',
      latitude: LAT,
      longitude: LON,
      littleEndian: false,
    })
    const result = parseExif(buffer)
    expect(result.takenAt).toBe('2026-07-01T18:05:59')
    expect(result.latitude).toBeCloseTo(LAT, 5)
    expect(result.longitude).toBeCloseTo(LON, 5)
  })

  it('applies hemisphere refs: south and west are negative, north and east positive', () => {
    const southWest = parseExif(
      buildJpegWithExif({ latitude: -33.8688, longitude: -70.6693 })
    )
    expect(southWest.latitude).toBeCloseTo(-33.8688, 5)
    expect(southWest.longitude).toBeCloseTo(-70.6693, 5)

    const northEast = parseExif(
      buildJpegWithExif({ latitude: 55.9533, longitude: 12.5683 })
    )
    expect(northEast.latitude).toBeCloseTo(55.9533, 5)
    expect(northEast.longitude).toBeCloseTo(12.5683, 5)
  })

  it('returns date without GPS when GPS is absent', () => {
    const result = parseExif(buildJpegWithExif({ dateTimeOriginal: '2026:01:15 11:00:00' }))
    expect(result.takenAt).toBe('2026-01-15T11:00:00')
    expect(result.latitude).toBeUndefined()
    expect(result.longitude).toBeUndefined()
  })

  it('returns GPS without date when DateTimeOriginal is absent', () => {
    const result = parseExif(buildJpegWithExif({ latitude: LAT, longitude: LON }))
    expect(result.takenAt).toBeUndefined()
    expect(result.latitude).toBeCloseTo(LAT, 5)
  })

  it('returns empty for a JPEG with no EXIF segment', () => {
    expect(parseExif(buildJpegWithoutExif())).toEqual({})
  })

  it('returns empty for non-JPEG data', () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0])
    expect(parseExif(png.buffer)).toEqual({})
    expect(parseExif(new ArrayBuffer(0))).toEqual({})
  })

  it('survives truncated EXIF data without throwing', () => {
    const full = new Uint8Array(
      buildJpegWithExif({ dateTimeOriginal: '2026:04:12 09:30:00', latitude: LAT, longitude: LON })
    )
    // Chop the buffer at various points — parser must never throw.
    for (const len of [3, 8, 20, 40, full.length - 10]) {
      const truncated = full.slice(0, len)
      expect(() => parseExif(truncated.buffer)).not.toThrow()
    }
  })

  it('ignores a malformed EXIF date but still reads GPS', () => {
    const result = parseExif(
      buildJpegWithExif({ dateTimeOriginal: 'garbage garbage abc', latitude: LAT, longitude: LON })
    )
    expect(result.takenAt).toBeUndefined()
    expect(result.latitude).toBeCloseTo(LAT, 5)
  })
})
