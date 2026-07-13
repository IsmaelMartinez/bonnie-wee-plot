/**
 * Minimal pure EXIF parser for the camera-roll importer (Season Observer
 * Phase 2, ADR-free: no new dependency).
 *
 * Scope is deliberately tiny — the importer only needs two facts per photo:
 * when it was taken (DateTimeOriginal) and where (GPS latitude/longitude).
 * A full EXIF library (exifr ~50KB min) would be the only consumer of 95% of
 * its surface, so we parse the JPEG APP1/TIFF structure by hand instead:
 * deterministic, dependency-free, and fully unit-testable against
 * synthesised byte fixtures.
 *
 * Everything runs client-side over an ArrayBuffer. Nothing here touches the
 * network — EXIF data (including GPS) never leaves the device.
 *
 * Format notes:
 * - JPEG is a sequence of 0xFFxx segments after the 0xFFD8 SOI marker.
 * - EXIF lives in an APP1 (0xFFE1) segment prefixed with "Exif\0\0",
 *   followed by a TIFF block ("II"/"MM" byte order, 0x2A, IFD0 offset).
 * - IFD0 points at the Exif sub-IFD (tag 0x8769, holds DateTimeOriginal)
 *   and the GPS sub-IFD (tag 0x8825, holds latitude/longitude rationals).
 * - HEIC/HEIF (ISO BMFF) is intentionally out of scope; callers surface
 *   those files as "no readable EXIF" and the user can convert or skip.
 */

/** Parsed subset of EXIF the importer cares about. */
export interface ExifData {
  /** DateTimeOriginal as a naive local ISO string, e.g. "2026-04-12T09:30:00". */
  takenAt?: string
  /** Decimal degrees, negative = south. */
  latitude?: number
  /** Decimal degrees, negative = west. */
  longitude?: number
}

// TIFF/EXIF tag ids
const TAG_EXIF_IFD_POINTER = 0x8769
const TAG_GPS_IFD_POINTER = 0x8825
const TAG_DATETIME = 0x0132 // IFD0 fallback
const TAG_DATETIME_ORIGINAL = 0x9003
const TAG_DATETIME_DIGITIZED = 0x9004
const TAG_GPS_LAT_REF = 0x0001
const TAG_GPS_LAT = 0x0002
const TAG_GPS_LON_REF = 0x0003
const TAG_GPS_LON = 0x0004

const IFD_ENTRY_SIZE = 12

interface IfdEntry {
  tag: number
  type: number
  count: number
  /** Absolute offset (within the TIFF block) of the value bytes. */
  valueOffset: number
}

/**
 * Convert an EXIF "YYYY:MM:DD HH:MM:SS" timestamp to a naive local ISO
 * string ("YYYY-MM-DDTHH:MM:SS"), or undefined if malformed. EXIF has no
 * timezone; we keep the camera's local wall-clock time, which is exactly
 * what "what happened on the plot that day" wants.
 */
export function exifDateToIso(raw: string): string | undefined {
  const m = /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/.exec(raw.trim())
  if (!m) return undefined
  const [, y, mo, d, h, mi, s] = m
  const month = Number(mo)
  const day = Number(d)
  if (month < 1 || month > 12 || day < 1 || day > 31) return undefined
  if (Number(h) > 23 || Number(mi) > 59 || Number(s) > 60) return undefined
  return `${y}-${mo}-${d}T${h}:${mi}:${s}`
}

/**
 * Read a single LONG (uint32) value from an IFD entry — used for the
 * Exif/GPS sub-IFD pointer tags. `entry.valueOffset` is the position of the
 * value bytes (inline for 4-byte values), so the pointer itself must be
 * dereferenced from there.
 */
function readLong(
  view: DataView,
  tiffStart: number,
  entry: IfdEntry,
  little: boolean
): number | undefined {
  const start = tiffStart + entry.valueOffset
  if (start + 4 > view.byteLength) return undefined
  return view.getUint32(start, little)
}

/** Read a NUL-terminated ASCII value from an IFD entry. */
function readAscii(view: DataView, tiffStart: number, entry: IfdEntry): string | undefined {
  const start = tiffStart + entry.valueOffset
  if (start + entry.count > view.byteLength) return undefined
  let out = ''
  for (let i = 0; i < entry.count; i++) {
    const c = view.getUint8(start + i)
    if (c === 0) break
    out += String.fromCharCode(c)
  }
  return out
}

/** Read `count` unsigned rationals (numerator/denominator uint32 pairs). */
function readRationals(
  view: DataView,
  tiffStart: number,
  entry: IfdEntry,
  little: boolean
): number[] | undefined {
  const start = tiffStart + entry.valueOffset
  if (start + entry.count * 8 > view.byteLength) return undefined
  const out: number[] = []
  for (let i = 0; i < entry.count; i++) {
    const num = view.getUint32(start + i * 8, little)
    const den = view.getUint32(start + i * 8 + 4, little)
    if (den === 0) return undefined
    out.push(num / den)
  }
  return out
}

/** Degrees/minutes/seconds rationals -> signed decimal degrees. */
function dmsToDecimal(dms: number[], ref: string | undefined, negativeRef: string): number | undefined {
  const [deg = 0, min = 0, sec = 0] = dms
  if (!Number.isFinite(deg) || !Number.isFinite(min) || !Number.isFinite(sec)) return undefined
  const decimal = deg + min / 60 + sec / 3600
  const sign = ref?.toUpperCase() === negativeRef ? -1 : 1
  return sign * decimal
}

/**
 * Parse one IFD into its entries. Returns entries plus the raw value word so
 * pointer tags (type LONG stored inline) resolve without re-reading.
 */
function readIfd(
  view: DataView,
  tiffStart: number,
  ifdOffset: number,
  little: boolean
): IfdEntry[] {
  const base = tiffStart + ifdOffset
  if (base + 2 > view.byteLength) return []
  const count = view.getUint16(base, little)
  const entries: IfdEntry[] = []
  for (let i = 0; i < count; i++) {
    const at = base + 2 + i * IFD_ENTRY_SIZE
    if (at + IFD_ENTRY_SIZE > view.byteLength) break
    const tag = view.getUint16(at, little)
    const type = view.getUint16(at + 2, little)
    const cnt = view.getUint32(at + 4, little)
    // Types: 1=BYTE 2=ASCII 3=SHORT 4=LONG 5=RATIONAL — sizes in bytes:
    const typeSize = type === 1 || type === 2 ? 1 : type === 3 ? 2 : type === 4 ? 4 : type === 5 ? 8 : 0
    if (typeSize === 0) continue
    const byteLen = typeSize * cnt
    // Values <= 4 bytes are stored inline in the value word; larger values
    // store an offset (relative to the TIFF header) there instead.
    const valueOffset = byteLen <= 4 ? at + 8 - tiffStart : view.getUint32(at + 8, little)
    entries.push({ tag, type, count: cnt, valueOffset })
  }
  return entries
}

/** Locate the TIFF block inside a JPEG's APP1 Exif segment. */
function findTiffStart(view: DataView): number | null {
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return null
  let offset = 2
  // Walk JPEG segments looking for APP1 "Exif\0\0".
  while (offset + 4 <= view.byteLength) {
    if (view.getUint8(offset) !== 0xff) return null
    const marker = view.getUint8(offset + 1)
    // Standalone markers without a length (RSTn, TEM) shouldn't appear before
    // scan data; stop at SOS (0xDA) — EXIF always precedes it.
    if (marker === 0xda) return null
    const length = view.getUint16(offset + 2)
    if (length < 2) return null
    if (marker === 0xe1 && offset + 4 + 6 <= view.byteLength) {
      const isExif =
        view.getUint8(offset + 4) === 0x45 && // E
        view.getUint8(offset + 5) === 0x78 && // x
        view.getUint8(offset + 6) === 0x69 && // i
        view.getUint8(offset + 7) === 0x66 && // f
        view.getUint8(offset + 8) === 0x00 &&
        view.getUint8(offset + 9) === 0x00
      if (isExif) return offset + 10
    }
    offset += 2 + length
  }
  return null
}

/**
 * Extract DateTimeOriginal + GPS coordinates from a JPEG buffer.
 * Returns an empty object for anything unreadable (non-JPEG, no EXIF,
 * truncated data) — the importer treats those photos as "no metadata"
 * rather than erroring.
 */
export function parseExif(buffer: ArrayBuffer): ExifData {
  const view = new DataView(buffer)
  const tiffStart = findTiffStart(view)
  if (tiffStart === null) return {}
  if (tiffStart + 8 > view.byteLength) return {}

  const byteOrder = view.getUint16(tiffStart)
  const little = byteOrder === 0x4949 // "II"
  if (!little && byteOrder !== 0x4d4d) return {} // not "MM" either
  if (view.getUint16(tiffStart + 2, little) !== 0x002a) return {}

  const ifd0Offset = view.getUint32(tiffStart + 4, little)
  const ifd0 = readIfd(view, tiffStart, ifd0Offset, little)

  const result: ExifData = {}

  // Date: prefer DateTimeOriginal, then DateTimeDigitized, then IFD0 DateTime.
  const exifPointer = ifd0.find(e => e.tag === TAG_EXIF_IFD_POINTER)
  const exifIfdOffset = exifPointer ? readLong(view, tiffStart, exifPointer, little) : undefined
  let dateRaw: string | undefined
  if (exifIfdOffset !== undefined) {
    const exifIfd = readIfd(view, tiffStart, exifIfdOffset, little)
    const original = exifIfd.find(e => e.tag === TAG_DATETIME_ORIGINAL)
    const digitized = exifIfd.find(e => e.tag === TAG_DATETIME_DIGITIZED)
    const entry = original ?? digitized
    if (entry) dateRaw = readAscii(view, tiffStart, entry)
  }
  if (!dateRaw) {
    const fallback = ifd0.find(e => e.tag === TAG_DATETIME)
    if (fallback) dateRaw = readAscii(view, tiffStart, fallback)
  }
  if (dateRaw) {
    const iso = exifDateToIso(dateRaw)
    if (iso) result.takenAt = iso
  }

  // GPS
  const gpsPointer = ifd0.find(e => e.tag === TAG_GPS_IFD_POINTER)
  const gpsIfdOffset = gpsPointer ? readLong(view, tiffStart, gpsPointer, little) : undefined
  if (gpsIfdOffset !== undefined) {
    const gpsIfd = readIfd(view, tiffStart, gpsIfdOffset, little)
    const latEntry = gpsIfd.find(e => e.tag === TAG_GPS_LAT)
    const lonEntry = gpsIfd.find(e => e.tag === TAG_GPS_LON)
    const latRefEntry = gpsIfd.find(e => e.tag === TAG_GPS_LAT_REF)
    const lonRefEntry = gpsIfd.find(e => e.tag === TAG_GPS_LON_REF)
    if (latEntry && lonEntry) {
      const latDms = readRationals(view, tiffStart, latEntry, little)
      const lonDms = readRationals(view, tiffStart, lonEntry, little)
      const latRef = latRefEntry ? readAscii(view, tiffStart, latRefEntry) : undefined
      const lonRef = lonRefEntry ? readAscii(view, tiffStart, lonRefEntry) : undefined
      if (latDms && lonDms) {
        const lat = dmsToDecimal(latDms, latRef, 'S')
        const lon = dmsToDecimal(lonDms, lonRef, 'W')
        if (
          lat !== undefined && lon !== undefined &&
          Math.abs(lat) <= 90 && Math.abs(lon) <= 180
        ) {
          result.latitude = lat
          result.longitude = lon
        }
      }
    }
  }

  return result
}
