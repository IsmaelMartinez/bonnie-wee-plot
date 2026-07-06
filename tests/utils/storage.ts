import { Page } from '@playwright/test'

/**
 * The IndexedDB database name `y-indexeddb` uses for the allotment doc.
 * Matches `YJS_DOC_NAME` in `src/hooks/useYjsDoc.ts` — keep in sync if
 * that constant ever changes.
 */
export const YJS_DOC_NAME = 'bwp-allotment-yjs'

/**
 * Clears every persistent store the app might write to.
 *
 * `localStorage.clear()` alone is not sufficient: the Yjs storage engine
 * persists to IndexedDB via `y-indexeddb`, and that store survives
 * between Playwright tests unless explicitly deleted. Without this, a
 * test that seeds legacy localStorage runs after one that wrote to Yjs
 * IDB, and the stale Yjs state silently shadows the seed.
 *
 * Use this in the `goto → clearAllStorage → evaluate(seed) → reload`
 * pattern where the seed runs after the page already has an origin.
 */
export async function clearAllStorage(page: Page): Promise<void> {
  await page.evaluate(async (dbName) => {
    localStorage.clear()
    if (typeof indexedDB !== 'undefined') {
      await new Promise<void>((resolve) => {
        const req = indexedDB.deleteDatabase(dbName)
        req.onsuccess = () => resolve()
        req.onerror = () => resolve()
        req.onblocked = () => resolve()
      })
    }
  }, YJS_DOC_NAME)
}

/**
 * Deletes the Yjs IndexedDB store exactly once, on a test's first page
 * load, via an `addInitScript` that runs before any app code.
 *
 * This is the companion to `clearAllStorage` for the `addInitScript`
 * seeding pattern (homepage / onboarding), where the localStorage seed
 * must be present before the app boots and a post-`goto` clear would
 * come too late. Registering this first (e.g. in a file-level
 * `test.beforeEach`) guarantees the Yjs doc starts empty on the first
 * load, so the app hydrates from the freshly-seeded legacy localStorage
 * instead of stale IDB left by a prior test in the same worker.
 *
 * The delete is gated on a `sessionStorage` sentinel so it fires only on
 * the first load and NOT on subsequent in-test reloads — reloads must
 * keep the IndexedDB the app has since written, otherwise a test that
 * reloads to assert persistence would wipe the very state it is checking.
 */
export async function clearYjsIdbOnFirstLoad(page: Page): Promise<void> {
  await page.addInitScript((dbName) => {
    try {
      if (!sessionStorage.getItem('__bwp_yjs_idb_cleared')) {
        sessionStorage.setItem('__bwp_yjs_idb_cleared', '1')
        indexedDB.deleteDatabase(dbName)
      }
    } catch {
      // Storage may be unavailable in some contexts — best effort.
    }
  }, YJS_DOC_NAME)
}
