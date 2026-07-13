/**
 * Synthesised JPEG/EXIF byte fixtures for the photo-import tests.
 *
 * Builds a minimal but structurally valid JPEG containing an APP1 Exif
 * segment (TIFF header, IFD0 with Exif/GPS sub-IFD pointers,
 * DateTimeOriginal, GPS DMS rationals) so the parser is exercised against
 * real byte layouts — no real photos, no binary files in the repo.
 */

export interface ExifFixtureOptions {
  /** EXIF-format timestamp, e.g. "2026:04:12 09:30:00". */
  dateTimeOriginal?: string
  /** Decimal degrees; sign selects the N/S / E/W ref. */
  latitude?: number
  longitude?: number
  /** TIFF byte order. Defaults to little-endian ("II"). */
  littleEndian?: boolean
}

const RATIONAL_DEN = 1_000_000

/** Decimal degrees -> [deg, min, sec] as [num, den] rational pairs. */
function toDmsRationals(decimal: number): Array<[number, number]> {
  const abs = Math.abs(decimal)
  const deg = Math.floor(abs)
  const minFloat = (abs - deg) * 60
  const min = Math.floor(minFloat)
  const sec = (minFloat - min) * 60
  return [
    [deg, 1],
    [min, 1],
    [Math.round(sec * RATIONAL_DEN), RATIONAL_DEN],
  ]
}

/** Build the TIFF block (starts with the byte-order mark). */
function buildTiff(options: ExifFixtureOptions): Uint8Array {
  const little = options.littleEndian ?? true
  const hasDate = options.dateTimeOriginal !== undefined
  const hasGps = options.latitude !== undefined && options.longitude !== undefined

  const ifd0EntryCount = (hasDate ? 1 : 0) + (hasGps ? 1 : 0)
  const HEADER = 8
  const ifd0Start = HEADER
  const ifd0Size = 2 + ifd0EntryCount * 12 + 4
  const exifIfdStart = ifd0Start + ifd0Size
  const exifIfdSize = hasDate ? 2 + 1 * 12 + 4 : 0
  const dtDataStart = exifIfdStart + exifIfdSize
  const dtDataSize = hasDate ? 20 : 0
  const gpsIfdStart = dtDataStart + dtDataSize
  const gpsIfdSize = hasGps ? 2 + 4 * 12 + 4 : 0
  const latDataStart = gpsIfdStart + gpsIfdSize
  const lonDataStart = latDataStart + (hasGps ? 24 : 0)
  const total = lonDataStart + (hasGps ? 24 : 0)

  const bytes = new Uint8Array(total)
  const view = new DataView(bytes.buffer)
  const u16 = (at: number, v: number) => view.setUint16(at, v, little)
  const u32 = (at: number, v: number) => view.setUint32(at, v, little)
  const ascii = (at: number, s: string) => {
    for (let i = 0; i < s.length; i++) bytes[at + i] = s.charCodeAt(i)
  }

  // TIFF header
  ascii(0, little ? 'II' : 'MM')
  u16(2, 0x002a)
  u32(4, ifd0Start)

  // IFD0
  u16(ifd0Start, ifd0EntryCount)
  let entryAt = ifd0Start + 2
  if (hasDate) {
    u16(entryAt, 0x8769) // ExifIFDPointer
    u16(entryAt + 2, 4) // LONG
    u32(entryAt + 4, 1)
    u32(entryAt + 8, exifIfdStart)
    entryAt += 12
  }
  if (hasGps) {
    u16(entryAt, 0x8825) // GPSIFDPointer
    u16(entryAt + 2, 4)
    u32(entryAt + 4, 1)
    u32(entryAt + 8, gpsIfdStart)
    entryAt += 12
  }
  u32(entryAt, 0) // next IFD

  // Exif IFD: one entry, DateTimeOriginal (ASCII, 20 bytes incl. NUL)
  if (hasDate) {
    u16(exifIfdStart, 1)
    const at = exifIfdStart + 2
    u16(at, 0x9003)
    u16(at + 2, 2) // ASCII
    u32(at + 4, 20)
    u32(at + 8, dtDataStart)
    u32(at + 12, 0) // next IFD
    ascii(dtDataStart, options.dateTimeOriginal!.slice(0, 19))
    bytes[dtDataStart + 19] = 0
  }

  // GPS IFD: LatRef, Lat, LonRef, Lon
  if (hasGps) {
    const latRef = options.latitude! < 0 ? 'S' : 'N'
    const lonRef = options.longitude! < 0 ? 'W' : 'E'
    u16(gpsIfdStart, 4)
    let at = gpsIfdStart + 2

    // 0x0001 GPSLatitudeRef — ASCII count 2, inline value
    u16(at, 0x0001)
    u16(at + 2, 2)
    u32(at + 4, 2)
    ascii(at + 8, latRef)
    bytes[at + 9] = 0
    at += 12

    // 0x0002 GPSLatitude — 3 RATIONALs at latDataStart
    u16(at, 0x0002)
    u16(at + 2, 5)
    u32(at + 4, 3)
    u32(at + 8, latDataStart)
    at += 12

    // 0x0003 GPSLongitudeRef
    u16(at, 0x0003)
    u16(at + 2, 2)
    u32(at + 4, 2)
    ascii(at + 8, lonRef)
    bytes[at + 9] = 0
    at += 12

    // 0x0004 GPSLongitude
    u16(at, 0x0004)
    u16(at + 2, 5)
    u32(at + 4, 3)
    u32(at + 8, lonDataStart)
    at += 12

    u32(at, 0) // next IFD

    const writeRationals = (start: number, rats: Array<[number, number]>) => {
      rats.forEach(([num, den], i) => {
        u32(start + i * 8, num)
        u32(start + i * 8 + 4, den)
      })
    }
    writeRationals(latDataStart, toDmsRationals(options.latitude!))
    writeRationals(lonDataStart, toDmsRationals(options.longitude!))
  }

  return bytes
}

/** Wrap a TIFF block in SOI + APP1("Exif\0\0") + EOI. */
export function buildJpegWithExif(options: ExifFixtureOptions = {}): ArrayBuffer {
  const tiff = buildTiff(options)
  const app1PayloadLen = 2 + 6 + tiff.length // length field itself + "Exif\0\0" + tiff
  const total = 2 + 2 + app1PayloadLen + 2 // SOI + APP1 marker + payload + EOI
  const bytes = new Uint8Array(total)
  const view = new DataView(bytes.buffer)

  let at = 0
  view.setUint16(at, 0xffd8) // SOI
  at += 2
  view.setUint16(at, 0xffe1) // APP1 marker
  at += 2
  view.setUint16(at, app1PayloadLen) // segment length (big-endian, always)
  at += 2
  for (const c of 'Exif') bytes[at++] = c.charCodeAt(0)
  bytes[at++] = 0
  bytes[at++] = 0
  bytes.set(tiff, at)
  at += tiff.length
  view.setUint16(at, 0xffd9) // EOI

  return bytes.buffer
}

/** A JPEG with no APP1/EXIF segment at all. */
export function buildJpegWithoutExif(): ArrayBuffer {
  const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xd9])
  return bytes.buffer
}
