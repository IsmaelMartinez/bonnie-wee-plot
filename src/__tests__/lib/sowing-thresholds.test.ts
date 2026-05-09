import { describe, it, expect } from 'vitest'
import {
  getMinOutdoorSowSoilTempC,
  shouldSuppressOutdoorSow,
} from '@/lib/sowing-thresholds'

describe('getMinOutdoorSowSoilTempC', () => {
  it('returns 7°C for peas and carrots', () => {
    expect(getMinOutdoorSowSoilTempC('peas')).toBe(7)
    expect(getMinOutdoorSowSoilTempC('sugar-snap-peas')).toBe(7)
    expect(getMinOutdoorSowSoilTempC('carrot')).toBe(7)
  })

  it('returns 12°C for beans', () => {
    expect(getMinOutdoorSowSoilTempC('runner-beans')).toBe(12)
    expect(getMinOutdoorSowSoilTempC('french-beans')).toBe(12)
    expect(getMinOutdoorSowSoilTempC('broad-beans')).toBe(12)
    expect(getMinOutdoorSowSoilTempC('climbing-french-beans')).toBe(12)
    expect(getMinOutdoorSowSoilTempC('borlotti-beans')).toBe(12)
  })

  it('returns 13°C for sweetcorn', () => {
    expect(getMinOutdoorSowSoilTempC('sweetcorn')).toBe(13)
  })

  it('returns undefined for plants not in the table', () => {
    expect(getMinOutdoorSowSoilTempC('tomato')).toBeUndefined()
    expect(getMinOutdoorSowSoilTempC('lettuce')).toBeUndefined()
    expect(getMinOutdoorSowSoilTempC('radish')).toBeUndefined()
    expect(getMinOutdoorSowSoilTempC('not-a-real-plant')).toBeUndefined()
  })
})

describe('shouldSuppressOutdoorSow', () => {
  it('suppresses peas at soil 5°C (below 7°C threshold)', () => {
    expect(shouldSuppressOutdoorSow('peas', 5)).toBe(true)
  })

  it('does not suppress peas at exactly the threshold (7°C)', () => {
    expect(shouldSuppressOutdoorSow('peas', 7)).toBe(false)
  })

  it('does not suppress peas at soil 8°C (above threshold)', () => {
    expect(shouldSuppressOutdoorSow('peas', 8)).toBe(false)
  })

  it('suppresses sweetcorn at 12°C (below 13°C threshold)', () => {
    expect(shouldSuppressOutdoorSow('sweetcorn', 12)).toBe(true)
  })

  it('does not suppress untracked plants regardless of soil temp', () => {
    expect(shouldSuppressOutdoorSow('tomato', 0)).toBe(false)
    expect(shouldSuppressOutdoorSow('lettuce', -5)).toBe(false)
  })

  it('does not suppress when soil temp is undefined (fallback)', () => {
    expect(shouldSuppressOutdoorSow('peas', undefined)).toBe(false)
    expect(shouldSuppressOutdoorSow('sweetcorn', undefined)).toBe(false)
  })
})
