/**
 * Release visibility constants.
 *
 * These gate advanced features that are hidden for the first release
 * to keep the experience focused for new users. Set any constant to
 * `true` to re-enable the feature.
 */

/** Auto-rotate button, auto-rotate dialog, and "X/Y to rotate" in season widget */
export const SHOW_ROTATION_SUGGESTIONS = false

/** Short ID and Built-in-year fields in Add Area form */
export const SHOW_ADVANCED_AREA_FIELDS = false

/** Care log section in permanent area detail panels */
export const SHOW_CARE_LOGS = true

/** Underplantings list in permanent area detail panels */
export const SHOW_UNDERPLANTINGS = false

/**
 * Yjs storage engine (ADR 027 Step 3).
 *
 * When `false` (default), `useAllotmentData` uses the legacy
 * `useSyncedStorage` chain (`usePersistedStorage` → localStorage →
 * Supabase JSONB). When `true`, `useYjsDoc` becomes the canonical data
 * engine, IndexedDB is the local store, and the legacy chain runs in
 * parallel as the cloud-sync mirror.
 *
 * Defaults `false` until PR-B ports the seven domain hooks and PR-C
 * flips the rollout flag.
 */
export const USE_YJS_STORAGE = false
