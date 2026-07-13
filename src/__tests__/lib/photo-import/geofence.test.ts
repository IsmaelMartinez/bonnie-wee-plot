import { describe, it, expect } from 'vitest'
import {
  haversineDistanceMeters,
  isWithinGeofence,
  DEFAULT_GEOFENCE_RADIUS_METERS,
} from '@/lib/photo-import/geofence'

const PLOT = { latitude: 55.9533, longitude: -3.1883 } // Edinburgh

/**
 * A point exactly `meters` due north of `origin`. For a pure latitude
 * offset the haversine distance is exactly R * dLat, so this constructs
 * boundary cases without circular reasoning about longitude scaling.
 */
const EARTH_RADIUS_METERS = 6371008.8
function metersNorth(origin: typeof PLOT, meters: number) {
  const dLatDeg = (meters / EARTH_RADIUS_METERS) * (180 / Math.PI)
  return { latitude: origin.latitude + dLatDeg, longitude: origin.longitude }
}

describe('haversineDistanceMeters', () => {
  it('is zero for identical points', () => {
    expect(haversineDistanceMeters(PLOT, PLOT)).toBe(0)
  })

  it('is symmetric', () => {
    const other = { latitude: 55.96, longitude: -3.2 }
    expect(haversineDistanceMeters(PLOT, other)).toBeCloseTo(
      haversineDistanceMeters(other, PLOT),
      9
    )
  })

  it('matches the known scale of one degree of latitude (~111.2km)', () => {
    const oneDegNorth = { latitude: PLOT.latitude + 1, longitude: PLOT.longitude }
    const distance = haversineDistanceMeters(PLOT, oneDegNorth)
    expect(distance).toBeGreaterThan(111_000)
    expect(distance).toBeLessThan(111_400)
  })

  it('measures Edinburgh to Glasgow at roughly 67km', () => {
    const glasgow = { latitude: 55.8642, longitude: -4.2518 }
    const distance = haversineDistanceMeters(PLOT, glasgow)
    expect(distance).toBeGreaterThan(60_000)
    expect(distance).toBeLessThan(75_000)
  })

  it('handles points across the antimeridian without blowing up', () => {
    const a = { latitude: 0, longitude: 179.9995 }
    const b = { latitude: 0, longitude: -179.9995 }
    // 0.001 deg of longitude at the equator ≈ 111.2m, not ~40,000km.
    expect(haversineDistanceMeters(a, b)).toBeLessThan(200)
  })
})

describe('isWithinGeofence (100m default)', () => {
  it('accepts a photo 99m from the plot', () => {
    expect(isWithinGeofence(metersNorth(PLOT, 99), PLOT)).toBe(true)
  })

  it('rejects a photo 101m from the plot', () => {
    expect(isWithinGeofence(metersNorth(PLOT, 101), PLOT)).toBe(false)
  })

  it('is boundary-inclusive at exactly 100m', () => {
    const boundary = metersNorth(PLOT, DEFAULT_GEOFENCE_RADIUS_METERS)
    expect(haversineDistanceMeters(boundary, PLOT)).toBeCloseTo(100, 6)
    expect(isWithinGeofence(boundary, PLOT)).toBe(true)
  })

  it('accepts the plot itself', () => {
    expect(isWithinGeofence(PLOT, PLOT)).toBe(true)
  })

  it('honours a custom radius', () => {
    const at250 = metersNorth(PLOT, 250)
    expect(isWithinGeofence(at250, PLOT, 300)).toBe(true)
    expect(isWithinGeofence(at250, PLOT, 200)).toBe(false)
  })
})
