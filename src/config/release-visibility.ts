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
 * When `false`, `useAllotmentData` uses the legacy `useSyncedStorage`
 * chain (`usePersistedStorage` → localStorage → Supabase JSONB). When
 * `true`, `useYjsDoc` becomes the canonical data engine, IndexedDB is
 * the local store, and the legacy chain runs in parallel as the
 * cloud-sync mirror via `useYjsToLegacyMirror`.
 *
 * Default-on as of PR-C (Phase 1 cutover). PR-B and PR-B.2 ported all
 * eight domain hooks (the seven core hooks plus `useCompost`) to
 * two-branch methods, so writes on this path go through SyncedStore's
 * proxy. The legacy chain stays in tree as the rollback floor until
 * Step 5 cleanup retires it.
 *
 * Pre-cutover history rows are seeded by the deployment runbook
 * running a no-op `UPDATE allotments SET data = data` so each active
 * user gets one pre-cutover snapshot in `allotment_history`.
 *
 * Rollback: flip back to `false`, redeploy, no data migration needed
 * (the legacy chain has been mirroring throughout).
 */
export const USE_YJS_STORAGE = true
