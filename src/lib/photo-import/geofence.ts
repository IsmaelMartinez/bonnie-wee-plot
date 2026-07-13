/**
 * Geofence maths for the camera-roll importer.
 *
 * Pure and deterministic: given a photo's GPS coordinates and the plot's
 * coordinates (`meta.coordinates`), decide whether the photo was taken at
 * the plot. All computation is local — coordinates never leave the device.
 */

export interface LatLon {
  latitude: number
  longitude: number
}

/** Default geofence radius: "within ~100m of the plot". */
export const DEFAULT_GEOFENCE_RADIUS_METERS = 100

/** Mean Earth radius (IUGG) in metres. */
const EARTH_RADIUS_METERS = 6371008.8

/**
 * Great-circle distance between two coordinates in metres (haversine).
 * Accurate to well under a metre at geofence scales.
 */
export function haversineDistanceMeters(a: LatLon, b: LatLon): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.latitude - a.latitude)
  const dLon = toRad(b.longitude - a.longitude)
  const lat1 = toRad(a.latitude)
  const lat2 = toRad(b.latitude)

  const sinLat = Math.sin(dLat / 2)
  const sinLon = Math.sin(dLon / 2)
  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)))
}

/**
 * Is `point` within `radiusMeters` of `center`? Boundary-inclusive
 * (exactly 100m counts as "at the plot").
 */
export function isWithinGeofence(
  point: LatLon,
  center: LatLon,
  radiusMeters: number = DEFAULT_GEOFENCE_RADIUS_METERS
): boolean {
  return haversineDistanceMeters(point, center) <= radiusMeters
}
