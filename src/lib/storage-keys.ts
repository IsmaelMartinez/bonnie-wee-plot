/**
 * Centralized Storage Keys
 *
 * All localStorage keys used by the application.
 * Centralizing these prevents typos and makes it easy to see all persisted data.
 */

/** Main allotment data (plantings, areas, seasons, varieties) */
export const STORAGE_KEY_ALLOTMENT = 'allotment-unified-data'

/** User engagement tracking for progressive disclosure */
export const STORAGE_KEY_ENGAGEMENT = 'allotment-engagement'

/** Analytics events (local-only usage tracking) */
export const STORAGE_KEY_ANALYTICS = 'allotment-analytics'

/** Celebration modals already shown to user */
export const STORAGE_KEY_CELEBRATIONS = 'allotment-celebrations-shown'
