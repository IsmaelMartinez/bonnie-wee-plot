import { Page } from '@playwright/test'

/**
 * Clears every persistent store the app might write to.
 *
 * `localStorage.clear()` alone is no longer sufficient once
 * `USE_YJS_STORAGE` is on: the Yjs path persists to IndexedDB via
 * `y-indexeddb`, and that store survives between Playwright tests
 * unless explicitly deleted. Without this helper, a test that seeds
 * legacy localStorage runs after one that wrote to Yjs IDB, and the
 * stale Yjs state silently shadows the seed.
 *
 * The IndexedDB database name (`bwp-allotment-yjs`) matches
 * `YJS_DOC_NAME` in `src/hooks/useYjsDoc.ts`. Keep in sync if that
 * constant ever changes.
 */
export async function clearAllStorage(page: Page): Promise<void> {
  await page.evaluate(async () => {
    localStorage.clear()
    if (typeof indexedDB !== 'undefined') {
      await new Promise<void>((resolve) => {
        const req = indexedDB.deleteDatabase('bwp-allotment-yjs')
        req.onsuccess = () => resolve()
        req.onerror = () => resolve()
        req.onblocked = () => resolve()
      })
    }
  })
}
