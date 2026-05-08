import type { Hardiness } from '@/types/garden-planner'

const TENDER_RATINGS: ReadonlySet<Hardiness> = new Set(['H1a', 'H1b', 'H1c', 'H2', 'H3'])

/**
 * Default rating when none is set. H4 (hardy) under-warns rather than
 * over-warns — a missing rating won't fire a "frost tender" alert.
 */
export const DEFAULT_HARDINESS: Hardiness = 'H4'

export function hardinessOrDefault(rating: Hardiness | undefined): Hardiness {
  return rating ?? DEFAULT_HARDINESS
}

export function isFrostTender(rating: Hardiness | undefined): boolean {
  return TENDER_RATINGS.has(hardinessOrDefault(rating))
}
