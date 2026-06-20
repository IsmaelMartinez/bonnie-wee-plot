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
 * What the user actually grows / has on the plot, used to prefer their own
 * resources over the generic make-your-own feeds (Milestone B2).
 */
export interface OwnFeedContext {
  /** User grows comfrey (a planting or primary plant with plantId 'comfrey'). */
  growsComfrey: boolean
  /** User has at least one compost pile that is ready to use. */
  hasReadyCompost: boolean
  /** User has at least one compost pile (any status). */
  hasCompost: boolean
}

/** A resource the user already has, surfaced in place of generic advice. */
export interface OwnFeedResource {
  /** Stable id for React keys / dedupe. */
  id: string
  /** Short, action-led headline, e.g. "Use your comfrey bed". */
  title: string
  /** One supporting line on how to use it. */
  detail: string
}

/**
 * Given the feed type wanted and what the user actually grows/has, return the
 * user's own resources to prefer over the generic make-your-own feeds. Each
 * resource is gated by the same feedType relevance the homemade feeds use
 * (comfrey → high-potash/comfrey, compost → balanced/compost).
 */
export function getOwnFeedResourcesForType(
  feedType: FeedType,
  ctx?: OwnFeedContext
): OwnFeedResource[] {
  if (!ctx) return []
  const resources: OwnFeedResource[] = []

  // Comfrey leaves steep into a high-potash tea — relevant to potash feeds.
  if (ctx.growsComfrey && (feedType === 'high-potash' || feedType === 'comfrey')) {
    resources.push({
      id: 'own-comfrey',
      title: 'Use your comfrey bed',
      detail: 'Cut your own comfrey leaves to steep into a high-potash tea.',
    })
  }

  // Finished compost is a balanced top-dress — relevant to balanced/compost feeds.
  if (feedType === 'balanced' || feedType === 'compost') {
    if (ctx.hasReadyCompost) {
      resources.push({
        id: 'own-compost-ready',
        title: 'Your compost is ready',
        detail: 'Top-dress your finished compost around hungry plants.',
      })
    } else if (ctx.hasCompost) {
      resources.push({
        id: 'own-compost',
        title: 'Use your own compost',
        detail: 'Once a pile is dark and crumbly, top-dress it around hungry plants.',
      })
    }
  }

  return resources
}

/**
 * Return the homemade feeds that can stand in for a given bought-feed type,
 * best match first (entries whose own lean matches the requested type lead).
 */
export function getHomemadeFeedsForType(feedType: FeedType): HomemadeFeed[] {
  // filter() returns a fresh array, so it is safe to sort in place.
  // Prefer feeds whose NPK lean matches the request (e.g. comfrey for
  // high-potash). npkLean is only ever a lean ('high-*'/'balanced'), so for the
  // 'comfrey'/'compost' types — which each have a single match — this is a no-op.
  return HOMEMADE_FEEDS.filter((feed) => feed.satisfies.includes(feedType)).sort((a, b) => {
    const aMatch = a.npkLean === feedType ? 0 : 1
    const bMatch = b.npkLean === feedType ? 0 : 1
    return aMatch - bMatch
  })
}
