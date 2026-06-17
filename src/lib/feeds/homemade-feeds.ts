/**
 * Homemade plant feeds (Milestone B1)
 *
 * A small static reference of feeds a gardener can make from things they
 * grow or already have on the plot. Each entry records what it's good for,
 * its NPK lean, how to make it, a dilution ratio, and which `feedType`(s) it
 * can stand in for — so a feed task that wants "high-potash feed" can offer
 * "comfrey tea" as a make-your-own alternative.
 *
 * Informational only (Simplicity First) — no tracking, no schema.
 */

import type { FeedType } from '@/types/garden-planner'

export interface HomemadeFeed {
  id: string
  name: string
  /** One line on what it's best used for. */
  goodFor: string
  /** Whether it leans nitrogen, potash, or roughly balanced. */
  npkLean: 'high-nitrogen' | 'high-potash' | 'balanced'
  /** How to make it, in a sentence or two. */
  howTo: string
  /** Dilution ratio for application (or "Apply neat"/"Top dress"). */
  dilution: string
  /** Which bought-feed types this can replace. */
  satisfies: FeedType[]
}

export const HOMEMADE_FEEDS: HomemadeFeed[] = [
  {
    id: 'comfrey-tea',
    name: 'Comfrey tea',
    goodFor: 'Fruiting crops — tomatoes, courgettes, squash, beans, peppers',
    npkLean: 'high-potash',
    howTo: 'Pack a bucket with comfrey leaves, weigh down, cover with water and leave 4–6 weeks until it turns dark and smelly. Strain off the liquid.',
    dilution: 'Dilute 1:10 with water (until weak-tea colour) before watering on.',
    satisfies: ['high-potash', 'comfrey'],
  },
  {
    id: 'nettle-feed',
    name: 'Nettle feed',
    goodFor: 'Leafy growth — brassicas, leeks, sweetcorn, young transplants',
    npkLean: 'high-nitrogen',
    howTo: 'Steep young nettle tops in water for 2–4 weeks, weighed down and covered. Strain off the liquid.',
    dilution: 'Dilute 1:10 with water before watering on.',
    satisfies: ['high-nitrogen'],
  },
  {
    id: 'wood-ash',
    name: 'Wood ash',
    goodFor: 'A potash boost for fruiting and root crops',
    npkLean: 'high-potash',
    howTo: 'Save ash from untreated wood fires. Keep it dry until use.',
    dilution: 'Sprinkle a thin dusting around plants and rake in; use sparingly as it raises soil pH.',
    satisfies: ['high-potash'],
  },
  {
    id: 'worm-leachate',
    name: 'Worm-bin leachate',
    goodFor: 'A gentle all-rounder for most crops and seedlings',
    npkLean: 'balanced',
    howTo: 'Drain the liquid that collects in the base of a wormery.',
    dilution: 'Dilute 1:10 with water until it looks like weak tea.',
    satisfies: ['balanced'],
  },
  {
    id: 'compost-mulch',
    name: 'Garden compost or well-rotted manure',
    goodFor: 'Slow-release feeding and soil improvement for hungry beds',
    npkLean: 'balanced',
    howTo: 'Use your own finished compost or a well-rotted manure pile.',
    dilution: 'Top-dress a 2–3cm layer around plants, or fork in before planting.',
    satisfies: ['balanced', 'compost'],
  },
]

/**
 * Return the homemade feeds that can stand in for a given bought-feed type,
 * best match first (entries whose own lean matches the requested type lead).
 */
export function getHomemadeFeedsForType(feedType: FeedType): HomemadeFeed[] {
  const matches = HOMEMADE_FEEDS.filter((feed) => feed.satisfies.includes(feedType))
  // Prefer feeds whose NPK lean matches the request (e.g. comfrey for high-potash).
  return [...matches].sort((a, b) => {
    const aMatch = a.npkLean === feedType ? 0 : 1
    const bMatch = b.npkLean === feedType ? 0 : 1
    return aMatch - bMatch
  })
}
