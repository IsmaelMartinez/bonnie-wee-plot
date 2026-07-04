/**
 * Preserving guide types (Preserving section)
 *
 * Rich per-plant preservation guidance that builds on the lightweight
 * `Vegetable.storage` field (Milestone C). Where `storage` answers
 * "which methods work?", a PreservationGuide answers "how do I actually
 * do it, how long does it keep, and where can I read more?".
 */

import { StorageMethod } from './garden-planner'

/** A free online resource (guide or recipe) — no paywalls, no sign-up walls */
export interface PreservationResource {
  title: string
  url: string
  /** Publisher, e.g. 'NCHFP', 'BBC Good Food', 'RHS' */
  source: string
}

/** How to apply one preservation method to one crop */
export interface PreservationMethodGuide {
  method: StorageMethod
  /** Short practical instructions (1-3 sentences) */
  how: string
  /** How long it keeps this way, e.g. '10-12 months in the freezer' */
  storageLife?: string
  resources?: PreservationResource[]
}

/** Full preserving guide for one crop */
export interface PreservationGuide {
  /** Matches a `vegetableIndex` id */
  plantId: string
  /** One-line orientation, e.g. glut warning or best-use advice */
  summary?: string
  methods: PreservationMethodGuide[]
  /** Ways to eat it up — cakes, bakes, soups, cordials, glut recipes */
  recipeIdeas?: PreservationResource[]
}
