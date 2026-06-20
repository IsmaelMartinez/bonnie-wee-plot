import { describe, it, expect } from 'vitest'
import { HOMEMADE_FEEDS, getHomemadeFeedsForType } from '@/lib/feeds/homemade-feeds'
import type { FeedType } from '@/types/garden-planner'

describe('homemade feeds', () => {
  it('suggests comfrey tea (and only high-potash feeds) for a high-potash request', () => {
    const feeds = getHomemadeFeedsForType('high-potash')
    expect(feeds.length).toBeGreaterThan(0)
    expect(feeds.map((f) => f.id)).toContain('comfrey-tea')
    expect(feeds.every((f) => f.satisfies.includes('high-potash'))).toBe(true)
  })

  it('suggests nettle feed for a high-nitrogen request', () => {
    const feeds = getHomemadeFeedsForType('high-nitrogen')
    expect(feeds.map((f) => f.id)).toContain('nettle-feed')
  })

  it('leads with the feed whose NPK lean matches the request', () => {
    const feeds = getHomemadeFeedsForType('high-potash')
    expect(feeds[0].npkLean).toBe('high-potash')
  })

  it('maps the comfrey feedType to comfrey tea', () => {
    const feeds = getHomemadeFeedsForType('comfrey')
    expect(feeds.map((f) => f.id)).toContain('comfrey-tea')
  })

  it('returns nothing meaningless — every entry satisfies the requested type', () => {
    const types: FeedType[] = ['high-potash', 'high-nitrogen', 'balanced', 'comfrey', 'compost']
    for (const type of types) {
      for (const feed of getHomemadeFeedsForType(type)) {
        expect(feed.satisfies).toContain(type)
      }
    }
  })

  it('has well-formed data for every feed', () => {
    for (const feed of HOMEMADE_FEEDS) {
      expect(feed.id).toBeTruthy()
      expect(feed.name).toBeTruthy()
      expect(feed.goodFor).toBeTruthy()
      expect(feed.howTo).toBeTruthy()
      expect(feed.dilution).toBeTruthy()
      expect(feed.satisfies.length).toBeGreaterThan(0)
    }
  })
})
