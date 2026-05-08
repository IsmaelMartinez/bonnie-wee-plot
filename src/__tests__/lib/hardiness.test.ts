import { describe, it, expect } from 'vitest'
import { isFrostTender, hardinessOrDefault } from '@/lib/hardiness'

describe('isFrostTender', () => {
  it('returns true for H1a, H1b, H1c, H2 and H3', () => {
    expect(isFrostTender('H1a')).toBe(true)
    expect(isFrostTender('H1b')).toBe(true)
    expect(isFrostTender('H1c')).toBe(true)
    expect(isFrostTender('H2')).toBe(true)
    expect(isFrostTender('H3')).toBe(true)
  })

  it('returns false for H4 and warmer-rated hardy ratings', () => {
    expect(isFrostTender('H4')).toBe(false)
    expect(isFrostTender('H5')).toBe(false)
    expect(isFrostTender('H6')).toBe(false)
    expect(isFrostTender('H7')).toBe(false)
  })

  it('treats undefined as H4 (not tender)', () => {
    expect(isFrostTender(undefined)).toBe(false)
  })
})

describe('hardinessOrDefault', () => {
  it('returns the rating when defined', () => {
    expect(hardinessOrDefault('H2')).toBe('H2')
  })

  it('returns H4 when undefined', () => {
    expect(hardinessOrDefault(undefined)).toBe('H4')
  })
})
