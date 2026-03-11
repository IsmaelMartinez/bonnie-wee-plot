/**
 * Centralized Storage Keys
 *
 * All localStorage keys used by the application.
 * Centralizing these prevents typos and makes it easy to see all persisted data.
 */

/** Main allotment data (plantings, areas, seasons, varieties) */
export const STORAGE_KEY_ALLOTMENT = 'allotment-unified-data'

/** Dismissed dashboard tasks (per-month, auto-clears on month change) */
export const STORAGE_KEY_DISMISSED_TASKS = 'allotment-dismissed-tasks'
