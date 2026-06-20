import { describe, it, expect } from 'vitest'
import {
  HOMEMADE_FEEDS,
  getHomemadeFeedsForType,
  getOwnFeedResourcesForType,
  type OwnFeedContext,
} from '@/lib/feeds/homemade-feeds'
import type { FeedType } from '@/types/garden-planner'

const NO_OWN_RESOURCES: OwnFeedContext = {
  growsComfrey: false,
  hasReadyCompost: false,
  hasCompost: false,
}

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

describe('own feed resources (B2)', () => {
  it('returns nothing when the user grows/has nothing', () => {
    const types: FeedType[] = ['high-potash', 'high-nitrogen', 'balanced', 'comfrey', 'compost']
    for (const type of types) {
      expect(getOwnFeedResourcesForType(type, NO_OWN_RESOURCES)).toEqual([])
    }
  })

  it('prefers the comfrey bed for high-potash when the user grows comfrey', () => {
    const ctx: OwnFeedContext = { ...NO_OWN_RESOURCES, growsComfrey: true }
    const resources = getOwnFeedResourcesForType('high-potash', ctx)
    expect(resources.map((r) => r.id)).toContain('own-comfrey')
    expect(resources[0].title).toBe('Use your comfrey bed')
  })

  it('offers the comfrey bed for the comfrey feed type too', () => {
    const ctx: OwnFeedContext = { ...NO_OWN_RESOURCES, growsComfrey: true }
    expect(getOwnFeedResourcesForType('comfrey', ctx).map((r) => r.id)).toContain('own-comfrey')
  })

  it('does not suggest comfrey for a high-nitrogen feed', () => {
    const ctx: OwnFeedContext = { ...NO_OWN_RESOURCES, growsComfrey: true }
    expect(getOwnFeedResourcesForType('high-nitrogen', ctx)).toEqual([])
  })

  it('says the compost is ready for balanced feeds when a pile is ready', () => {
    const ctx: OwnFeedContext = { ...NO_OWN_RESOURCES, hasReadyCompost: true, hasCompost: true }
    const resources = getOwnFeedResourcesForType('balanced', ctx)
    expect(resources.map((r) => r.id)).toContain('own-compost-ready')
    expect(resources.find((r) => r.id === 'own-compost-ready')?.title).toBe('Your compost is ready')
  })

  it('falls back to a "making compost" nudge when piles exist but none are ready', () => {
    const ctx: OwnFeedContext = { ...NO_OWN_RESOURCES, hasCompost: true }
    const resources = getOwnFeedResourcesForType('compost', ctx)
    expect(resources.map((r) => r.id)).toContain('own-compost')
    expect(resources.map((r) => r.id)).not.toContain('own-compost-ready')
  })

  it('does not suggest compost for a high-potash feed', () => {
    const ctx: OwnFeedContext = { ...NO_OWN_RESOURCES, hasReadyCompost: true, hasCompost: true }
    expect(getOwnFeedResourcesForType('high-potash', ctx).map((r) => r.id)).not.toContain(
      'own-compost-ready'
    )
  })

  it('can surface both comfrey and compost when relevant', () => {
    const ctx: OwnFeedContext = { growsComfrey: true, hasReadyCompost: true, hasCompost: true }
    // high-potash relevant for comfrey only; balanced relevant for compost only.
    expect(getOwnFeedResourcesForType('high-potash', ctx).map((r) => r.id)).toEqual(['own-comfrey'])
    expect(getOwnFeedResourcesForType('balanced', ctx).map((r) => r.id)).toEqual(['own-compost-ready'])
  })
})
