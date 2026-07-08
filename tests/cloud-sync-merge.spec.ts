import { test, expect, type Page } from '@playwright/test'
import { SupabaseStub } from './utils/supabase-stub'

/**
 * ADR 027 Step 4 — real cross-device binary-CRDT merge (the e2e deferred in the
 * PR). Two independent browser contexts ("devices") sign in as the SAME user
 * against an in-memory Supabase REST stub (shared `yjs_state` + `yjs_updated_at`
 * row). Each makes a DIFFERENT edit while offline; after both reconnect and
 * sync, both converge to the union of the edits — no duplicated areas, no lost
 * `meta` — exercising the actual browser stack: Yjs doc, y-indexeddb, the
 * binary transport (`sync-binary.ts`), and the adopt/merge reconciliation in
 * `useCloudSync`.
 *
 * Requires a test-mode build with Supabase env configured:
 *   NEXT_PUBLIC_PLAYWRIGHT_TEST_MODE=true
 *   NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY   (any values —
 *     the REST calls are intercepted by the stub, never sent over the network).
 * The test skips (rather than fails) if the build lacks that config, so the
 * rest of the suite is unaffected when cloud env is absent.
 */

const USER = 'shared-user'
// A route that mounts exactly one cloud-sync consumer (Navigation) — no
// TodayDashboard — so the sync sequence is deterministic.
const ROUTE = '/preserving'

async function boot(page: Page): Promise<void> {
  await page.addInitScript((user) => {
    localStorage.setItem('bwp-e2e-auth', user)
  }, USER)
  await page.goto(ROUTE)
  await expect
    .poll(() => page.evaluate(() => !!window.__bwpTest && window.__bwpTest.ready()), {
      timeout: 20_000,
    })
    .toBe(true)
}

function snapshot(page: Page) {
  return page.evaluate(() => window.__bwpTest!.snapshot())
}

function areaIds(snap: { layout: { areas: { id: string }[] } } | null): string[] {
  return (snap?.layout.areas ?? []).map((a) => a.id).sort()
}

test('two devices merge different offline edits with no duplicates or lost meta', async ({
  browser,
}) => {
  const stub = new SupabaseStub()

  const ctxA = await browser.newContext()
  const ctxB = await browser.newContext()
  await stub.attach(ctxA)
  await stub.attach(ctxB)

  const pageA = await ctxA.newPage()
  const pageB = await ctxB.newPage()

  // ---- Device A: first sync seeds the canonical cloud lineage --------------
  await boot(pageA)

  const cloudCapable = await pageA.evaluate(() => window.__bwpTest!.cloudConfigured)
  test.skip(!cloudCapable, 'Supabase env not configured in this build — cloud sync disabled')

  // A pushes its local doc as the canonical document (no row existed).
  await expect.poll(() => stub.getRow(USER)?.yjs_state, { timeout: 20_000 }).toBeTruthy()

  const snapA0 = await snapshot(pageA)

  // ---- Device B: first sync ADOPTS A's lineage ----------------------------
  await boot(pageB)
  // B discards its independent local seed and converges to A's exact content.
  await expect
    .poll(async () => JSON.stringify(await snapshot(pageB)), { timeout: 20_000 })
    .toBe(JSON.stringify(snapA0))

  // ---- Both go offline and make DIFFERENT edits ---------------------------
  await ctxA.setOffline(true)
  await ctxB.setOffline(true)

  await pageA.evaluate(() => window.__bwpTest!.setMetaName('From Device A'))
  await pageB.evaluate(() => window.__bwpTest!.addArea('e2e-bed-b', 'Bed B (from B)'))

  // Edits are local only while offline.
  expect((await snapshot(pageA))!.meta.name).toBe('From Device A')
  expect(areaIds(await snapshot(pageB))).toContain('e2e-bed-b')

  // ---- Reconnect A → pushes its rename ------------------------------------
  const writesBeforeA = stub.writes
  await ctxA.setOffline(false)
  await expect.poll(() => stub.writes, { timeout: 20_000 }).toBeGreaterThan(writesBeforeA)
  await expect.poll(() => stub.getRow(USER)?.data as { meta?: { name?: string } })
    .toHaveProperty('meta.name', 'From Device A')

  // ---- Reconnect B → merges A's rename, pushes B's new bed -----------------
  const writesBeforeB = stub.writes
  await ctxB.setOffline(false)
  await expect.poll(() => stub.writes, { timeout: 20_000 }).toBeGreaterThan(writesBeforeB)

  // B now holds BOTH edits.
  await expect
    .poll(async () => {
      const s = await snapshot(pageB)
      return s?.meta.name === 'From Device A' && areaIds(s).includes('e2e-bed-b')
    }, { timeout: 20_000 })
    .toBe(true)

  // ---- Nudge A to pull B's bed (toggle offline→online = re-sync) -----------
  await ctxA.setOffline(true)
  await ctxA.setOffline(false)
  await expect
    .poll(async () => {
      const s = await snapshot(pageA)
      return s?.meta.name === 'From Device A' && areaIds(s).includes('e2e-bed-b')
    }, { timeout: 20_000 })
    .toBe(true)

  // ---- Convergence assertions ---------------------------------------------
  const finalA = await snapshot(pageA)
  const finalB = await snapshot(pageB)

  // Both devices agree exactly (full-doc convergence).
  expect(JSON.stringify(finalA)).toBe(JSON.stringify(finalB))

  // The rename survived on both (no lost meta).
  expect(finalA!.meta.name).toBe('From Device A')
  // B's new bed is present on both.
  expect(areaIds(finalA)).toContain('e2e-bed-b')

  // No duplicated areas: ids are unique, and A's original seed areas are still
  // present exactly once alongside B's addition.
  const ids = areaIds(finalA)
  expect(new Set(ids).size).toBe(ids.length)
  expect(ids).toEqual([...areaIds(snapA0), 'e2e-bed-b'].sort())

  await ctxA.close()
  await ctxB.close()
})
