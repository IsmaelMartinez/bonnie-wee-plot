# ADR 027 Yjs Spike — Step 3: Integrate the SyncedStore into useAllotment

Date: 2026-05-13 (revised 2026-05-14 after subagent review)
Status: Draft, awaiting user review

## Context

Step 2 of ADR 027 landed on `main` in PR #364. The result is an isolated module at `src/lib/yjs-spike/allotment-yjs.ts` that maps `AllotmentData` onto a Yjs document via SyncedStore, with `hydrateFromJson`, `serializeToJson`, and binary encode/decode helpers. 13 unit tests confirm the shape, round-trip, CRDT-merge semantics, and the two correctness gotchas (re-hydrate must clear the meta Y.Map; optional-array undefinedness is normalised). The module is not wired into the rest of the app yet.

Step 3 is the integration cut. The goal is to make the SyncedStore the actual data engine behind `useAllotment` while preserving the read API (`data: AllotmentData | null`) that ~50 components and several utility modules currently consume. Local persistence moves from raw localStorage to `y-indexeddb`. Cloud sync (Cloudflare Durable Object transport) is deferred to Step 4 of the ADR; Step 3 ships local-only Yjs storage with the existing Supabase JSONB chain running in parallel as the cloud backup throughout the soak.

The existing chain is `useAllotment` → `useAllotmentData` → `useSyncedStorage` → `usePersistedStorage` (localStorage). Each layer holds a snapshot of `AllotmentData` in React state and emits a new top-level object reference on every mutation. The domain hooks (`useAllotmentAreas`, `useAllotmentPlantings`, `useAllotmentVarieties`, `useAllotmentCustomTasks`, `useAllotmentMaintenance`, `useAllotmentNotes`, `useAllotmentCareLogs`) each receive `data` and `setData` props and call `setData(newImmutableSnapshot)` to apply mutations. The total inventory is 99 `setData` call sites across 7 domain-hook files.

## What changed in this revision

A first draft of this spec was reviewed by three subagents (architecture, data integrity, test strategy) on 2026-05-14. Their findings reshaped this draft in three substantive ways. First, the original "unified `mutate(fn)` API on both paths via a reshape-and-unreshape bijection" was abandoned: the bijection between `AllotmentData` and `AllotmentStoreShape` was found to be a silent-corruption hazard on the legacy path during the entire soak, exactly when the legacy path needs to be trustworthy. The two paths now use explicit different APIs and domain-hook methods branch at the top. Second, the dual-local-write design was found to be ordering-broken: `useYjsDoc` writing directly to localStorage from outside the `usePersistedStorage` debounce cycle would not trigger `useSyncedStorage`'s push effect, so the cloud copy would stagnate silently. The bridge is now an explicit adapter that drives `usePersistedStorage.setData()` whenever the Yjs doc publishes a new snapshot. Third, the "parametrise existing domain-hook tests over both paths" plan turned out to be vacuous because the domain-hook tests do not exist yet.

A second calibration pass on 2026-05-14, prompted by the user pointing out that the actual cohort is two real users rather than the multi-user audience the first revision assumed, cut three more pieces of overhead. The `USE_YJS_SHADOW_WRITE` flag and its production Sentry divergence instrumentation are gone — at two users, divergence "measurement" is qualitative, not statistical, so the instrumentation can't pay for its complexity. The rollout collapses from three phases to two: cutover and cleanup. The test surface drops from seven per-domain test files to a single `allotment-path-parity` integration test that exercises a scripted mutation sequence through `useAllotment` end-to-end under both flag states and asserts snapshot equality at each step. Per-domain test coverage is tracked as a follow-up rather than a Step 3 prerequisite.

## Goals

Replace the local persistence layer with a Yjs document backed by `y-indexeddb`. Preserve the existing read shape so consumers of `useAllotment` see no API change. Route every write through the SyncedStore on the Yjs path so the resulting Yjs operations are fine-grained — adding a planting emits a single Y.Array insert, not a full-array replace. Keep the existing Supabase cloud sync running on the legacy chain so a rollback is a feature-flag flip rather than a code revert. Land the change behind a feature flag that defaults off; promote to default-on only after a soak period whose success criterion is concrete and measurable.

## Non-goals

Step 3 does not introduce Yjs as the cloud-sync transport. The Supabase JSONB + LWW chain stays as the cloud canonical until Step 5. Step 3 also does not change the AllotmentData type, the schema version, or any user-facing behaviour. The schema migration story (v22 → vNext) is untouched in this step; the existing migrations run as before against the localStorage snapshot before it is hydrated into the Yjs doc. Step 3 does not deliver the headline CRDT-merge property end-to-end — that benefit lands at the Step 4 cutover, not at Step 3. During soak, cross-device conflicts behave exactly like legacy LWW.

## Strategy

The integration strategy is **A — in-place mutation rewrite** of the seven domain-hook files. Each method has two implementations selected at the top of its body by the feature flag: the legacy implementation is the unchanged `setData(prev => ...)` call; the Yjs implementation calls `mutate(store => { ... in-place mutations on the SyncedStore proxy ... })`. The two implementations are explicit and side-by-side. The cost is per-method code duplication during the soak window (deleted in Step 5 when the legacy implementation goes); the benefit is no reshape bijection, no silent-corruption hazard, and a per-method diff that a reviewer can verify line-by-line.

The fallback if the breadth of A turns out to hide more gnarly cross-collection methods than the inventory suggests is strategy B (an Immer-style `withDraft(store, fn)` wrapper). The B option is escape-valve, not the plan. The cross-collection methods that the architecture review flagged — `addPlanting` and `addPlantings` in `useAllotmentPlantings.ts`, which touch both plantings and varieties in one atomic update — are the canary: if the in-place rewrite of those two becomes unreadable, switch the entire rewrite to B.

Strategy C (a diff-and-replay adapter at the `setData` boundary) is off the table. It would ship the wiring without the CRDT-merge property that is the headline win of the migration.

The whole feature is gated by a single new constant `USE_YJS_STORAGE` in `src/config/release-visibility.ts`. While the flag is off, the existing chain is canonical. While the flag is on, the Yjs path is canonical and the legacy chain runs in parallel as the cloud-sync source via the mirror adapter described below. An earlier draft of this spec proposed a second `USE_YJS_SHADOW_WRITE` flag with production divergence instrumentation in Sentry, on the assumption that statistical evidence from a multi-user cohort would gate the cutover. The actual cohort at this point is two users (the author plus one collaborator), so statistical evidence is not available regardless of the instrumentation; the second flag is dropped in favour of personal dogfooding as the soak.

## Architecture

A new hook `useYjsDoc` (in `src/hooks/useYjsDoc.ts`) is the Yjs-path data layer. It owns the Y.Doc, the SyncedStore instance, the `IndexeddbPersistence` provider, and the React state that exposes the derived `data: AllotmentData | null` snapshot to consumers. On mount, it constructs the doc, attaches the IndexeddbPersistence provider, awaits the `synced` event so the in-memory doc reflects the on-disk state, then either hydrates the doc from the legacy localStorage on first run (if the doc is empty after IndexedDB load and legacy localStorage has data) or proceeds with the existing doc state.

The hook publishes the derived snapshot through `useState` and subscribes to Y.Doc updates via `doc.on('update', ...)`. On every update, it calls `serializeToJson(store)` and pushes the result through `setState`. React's reference equality on the returned object is preserved because `serializeToJson` returns a fresh object each time.

`useAllotmentData` becomes the strategy switch. When `USE_YJS_STORAGE` is true, it composes `useYjsDoc` with `usePersistedStorage` via a thin adapter (`useYjsToLegacyMirror`) and exposes the same return shape as the legacy path. When the flag is off, it routes to `useSyncedStorage` exactly as it does today.

### The mirror adapter

The original dual-write idea — `useYjsDoc` writes directly to localStorage on every Yjs update — was found in review to break the cloud-sync push effect, because the push effect listens for `local.saveStatus === 'saved'` transitions from `usePersistedStorage`'s debounce cycle and direct-localStorage writes don't trip that state. The corrected design is `useYjsToLegacyMirror`: it takes a Yjs-path snapshot (live React state from `useYjsDoc`) and a `usePersistedStorage` instance, and runs an effect that calls `local.setData(snapshot)` whenever the Yjs snapshot changes. This drives the existing debounce + save cycle exactly as a domain-hook `setData` call would, and `useSyncedStorage`'s push effect fires normally. The mirror is one-way (Yjs → legacy); the legacy chain is read-only during the soak window when the flag is on, which means the legacy state is always a derived view of the Yjs state and the two cannot diverge by design.

On the Yjs path with the flag on, domain hooks never call `setData` directly. The seam that catches a missed-port site during development is: legacy `setData` is rebound to a no-op-with-warning when the Yjs flag is on, so any unported call site logs a warning the first time it runs.

### The mutate API

On the Yjs path, the domain hooks gain a new function prop: `mutate: (fn: (store: AllotmentStoreShape) => void) => void`. The helper wraps `doc.transact(fn)` and runs `fn` against the live SyncedStore proxy. Each domain-hook method has two implementations side-by-side, branching at the top:

```ts
if (USE_YJS_STORAGE) {
  mutate(store => {
    store.seasons[i].areas[j].plantings.push(newPlanting)
  })
} else {
  setData(prev => ({ ...prev, seasons: replaceAt(prev.seasons, i, ...) }))
}
```

The legacy branch is the existing code, unmodified. The Yjs branch is new. No bijection between `AllotmentData` and `AllotmentStoreShape` is needed at runtime — the legacy code reads and writes `AllotmentData`, the Yjs code reads and writes `AllotmentStoreShape`, and the mirror adapter handles translation in exactly one place via the well-tested `serializeToJson`.

### Cross-collection methods

The two methods the architecture review specifically flagged are `addPlanting` and `addPlantings` in `useAllotmentPlantings.ts`. Both touch plantings *and* varieties in a single atomic update. The Yjs branch for these is:

```ts
mutate(store => {
  store.seasons[i].areas[j].plantings.push(newPlanting)
  const existingVariety = store.varieties.find(v => v.name === newPlanting.varietyName)
  if (existingVariety) {
    existingVariety.seedsByYear[year] = 'have'
  } else {
    store.varieties.push({ /* ... */ })
  }
})
```

This is ~8-10 lines, not 3. The estimate in the original spec was wrong. Updated inventory: 99 sites total, but ~10 of them are cross-collection or otherwise non-trivial; budget those at ~10 lines each and the rest at ~3-5 lines each. Total Yjs-branch surface area is closer to 600 lines than 300.

### Public API surfaces that need Yjs-path semantics

`useAllotmentData` exposes `flushSave`, `flushPush`, `cancelPendingSave`, and `isSyncedFromOtherTab` as part of its public contract. On the legacy path these come from `usePersistedStorage` and `useSyncedStorage`. On the Yjs path:

- `flushSave` calls `IndexeddbPersistence.whenSynced` and the mirror adapter's flush combined — guarantees that the latest in-memory snapshot has been written to IndexedDB and mirrored to legacy localStorage.
- `flushPush` continues to come from `useSyncedStorage` unchanged, because cloud push remains on the legacy chain throughout Step 3.
- `cancelPendingSave` cancels both the mirror adapter's pending mirror-write and `usePersistedStorage`'s pending debounced save.
- `isSyncedFromOtherTab` comes from listening for `y-indexeddb`'s cross-tab broadcast and translating it into the same boolean flag consumers expect. Also fires on `USE_YJS_STORAGE` flag transitions detected via a separate cross-tab BroadcastChannel — see the rollout section.

### First-run migration

`useYjsDoc` on mount runs this sequence: await `IndexeddbPersistence.synced`. If the doc state has any top-level content (areas, seasons, varieties non-empty, or meta has any keys), proceed. Otherwise read the legacy `allotment-unified-data` localStorage key. If that key has content, run the existing `migrateData` function from `storage-migrations.ts` against it to bring the JSON up to the current schema version, then call `hydrateFromJson(store, migratedData)`. If the legacy key is also empty (fresh device), the doc stays empty and `useAllotmentData` exposes `data: null` exactly as it does today on first run.

The "fresh device with cloud data" scenario the data-integrity review surfaced works as follows. Bob signs in on a new device with `USE_YJS_STORAGE=true`. IndexedDB empty, legacy localStorage empty. `useYjsDoc` produces an empty `data: null`. The mirror adapter is a no-op because there is no snapshot to mirror. `useSyncedStorage` runs its initial-load reconciliation against the legacy localStorage (still empty) and the cloud copy (47 plantings). `isLocalStructurallySmaller` from PR #331 fires and routes to the conflict dialog. Alice picks "use cloud". On the legacy path this would call `setData(remoteData)`; on the Yjs path the conflict-resolution callback calls a new `useYjsDoc.replaceFromJson(remoteData)` method that re-hydrates the doc from scratch (the existing `hydrateFromJson` is already idempotent for this), then the mirror adapter writes the snapshot to legacy localStorage so subsequent reloads see consistent state.

The legacy `allotment-unified-data` localStorage key is **not** deleted in Step 3. It is the rollback floor for the entire soak period.

### Cross-tab safety on flag transition

The data-integrity review surfaced a scenario where the `USE_YJS_STORAGE` flag flips while one tab is already loaded with the old value. On the next deploy, tab A continues running with `USE_YJS_STORAGE=true` (the value captured at its load time) while tab B opens with `USE_YJS_STORAGE=false`. Both tabs write to localStorage; tab A's writes come through the mirror and tab B's come through the legacy chain. They can clobber each other.

Mitigation: on app load, `useAllotmentData` posts the current value of `USE_YJS_STORAGE` to a BroadcastChannel named `bwp-storage-flag`. Other tabs subscribe; if they receive a value different from their own captured one, they show a "reload required" banner and stop accepting mutations. This is a small new piece of UI infrastructure but it's the minimum safety net to prevent the 2026-05-08 shape from reappearing during a flag transition.

### Cloud sync continuity and the conflict-replace path

While `USE_YJS_STORAGE` is on, the cloud-sync push and pull paths continue to run on the legacy chain. The mirror adapter ensures every Yjs mutation eventually reaches Supabase via the existing `useSyncedStorage` push effect. Conflict resolution from the cloud side calls back into `useYjsDoc.replaceFromJson(remoteData)` for "use cloud" and into a new `useYjsDoc.serializeAndPush()` for "use mine". `serializeAndPush()` is implemented as: read the current Yjs snapshot, write it to legacy localStorage through the mirror, await `useSyncedStorage.flushPush()`. This makes the "use mine" branch concrete and explicit on the Yjs path.

The data-integrity review correctly noted that during the soak window the CRDT-merge benefit is not active — cross-device conflicts behave exactly as they do under legacy LWW. This is acknowledged and documented: the merge benefit lands at the Step 4 cutover, not at Step 3.

### Recovery floor and `allotment_history`

The `allotment_history` table from PR #332 is the migration safety net. Step 3's deployment runbook is: on the day `USE_YJS_STORAGE` flips to default-on (the second post-merge follow-up), the deployment script runs a one-shot `UPDATE allotments SET data = data` on each active row. This is a no-op at the SQL level but triggers the `BEFORE UPDATE` history trigger, creating one pre-cutover history row per user. Every active user therefore has a pre-cutover recovery point.

After cutover, the Yjs → legacy mirror keeps pushing snapshots through the existing chain, so history rows continue to accrete naturally per the rules documented in `current-plan.md`.

### `serializeToJson` and `decodeDocState` are load-bearing forever

The data-integrity review correctly identified that `src/lib/yjs-spike/allotment-yjs.ts` (the home of `serializeToJson` and `decodeDocState`) is not deletable, ever. Three load-bearing roles: rollback path after Step 5 deletes the legacy chain (decode binary → JSON → restore); GDPR `/api/account` export once Step 4 makes Supabase store Yjs binary (the export endpoint needs JSON back); migration debugging when an individual user's Yjs binary needs to be inspected. The eventual home of this code is no longer `src/lib/yjs-spike/` (the "spike" prefix is wrong for permanent infrastructure); a follow-up PR renames the directory to `src/lib/yjs/` once Step 3 lands. The rename is purely cosmetic and tracked separately to keep this PR focused.

## y-indexeddb fallback

Browsers without IndexedDB (Safari private mode in some versions, restrictive enterprise environments) fall through to a memory-only Yjs doc and the warning banner that the existing app already shows for storage-unavailable states. The session is local-only and dies on page reload — same behaviour as the existing app today when localStorage is unavailable. No new fallback path; the existing legacy chain still runs as the mirror target.

## Reactivity model

Components consuming `useAllotment` see the same `data: AllotmentData | null` shape they see today and re-render on object identity changes. Internally, the publish-on-every-Yjs-update model serialises the whole AllotmentData on each change. For our scale (a few KB per user) this is sub-millisecond. If profiling under realistic data shows this on the critical path, the optimization is to switch to selector-based re-renders via SyncedStore's React hooks; that work stays out of Step 3 and is tracked as a follow-up.

## Testing strategy

The test-strategy review surfaced a critical miss: there are no existing domain-hook tests. `src/__tests__/hooks/allotment/` does not exist. The "parametrise existing tests over both paths" plan in the original draft was vacuous. A second pass calibrated for a two-user cohort cuts the test surface further: per-domain test files are good engineering but overkill for the actual migration risk at this scale. The corrected test surface for Step 3 is below.

### Layer 1 — one integration test that proves both paths agree

A single new test file `src/__tests__/hooks/allotment-path-parity.test.ts` mounts `useAllotment` end-to-end under both flag states and runs the same scripted sequence of representative mutations through each (add a planting, update a variety's seed status, archive an area, complete a maintenance task, add a custom task, log a care entry, add a garden event, run the cross-collection `addPlanting` that touches plantings and varieties). After each step, the test asserts that the public `data` snapshot from the legacy path equals the public `data` snapshot from the Yjs path. The scripted sequence is the contract; if any step diverges, the migration has a bug.

Non-determinism sources the test-strategy review flagged need explicit handling: `vi.useFakeTimers()` with a frozen `Date` for `createdAt`/`updatedAt`, `vi.mock('@/lib/id')` for `generateId` so both paths produce identical IDs, and `toEqual` (not `toStrictEqual`) for the snapshot comparison since Y.Map key ordering is insertion-order rather than alphabetical.

This is one new test file, not seven. Per-domain test files remain a good long-term investment but are tracked as a follow-up, not a prerequisite for Step 3.

### Layer 2 — `useYjsDoc` in isolation

A new test file `src/__tests__/hooks/useYjsDoc.test.ts` covers the hook's seams: mount with empty IndexedDB, mount with hydrated IndexedDB, hydrate-from-legacy-localStorage path, hydrate-from-legacy across a representative sample of schema versions (the v1 → current path via the existing migration fixtures), mutation through `mutate(fn)`, snapshot publishing, cleanup, `replaceFromJson` path. Adds `fake-indexeddb` as a dev dependency for the jsdom environment.

### Layer 3 — the mirror adapter

A new test file `src/__tests__/hooks/useYjsToLegacyMirror.test.ts` covers the adapter explicitly: Yjs snapshot change triggers `local.setData`, the debounced save cycle fires, `local.saveStatus` transitions correctly, the existing `useSyncedStorage` push effect runs against the mirrored snapshot. This test is the verification that the corrected dual-write design actually works as advertised.

### Layer 4 — existing tests that need updating

`useSyncedStorage.test.ts` currently mocks `usePersistedStorage` completely and asserts `expect(mockSetData).toHaveBeenCalledWith(remoteData)` on the conflict-resolution path. Step 3 changes this to assert that on the Yjs path, `useYjsDoc.replaceFromJson` is the call instead. The existing test is reshaped to cover both paths via `describe.each`.

### E2E and integration

E2E tests are unchanged by Step 3. The flag defaults off, so E2E runs the legacy path. After the dogfooding window, a follow-up PR adds an E2E run with the flag on to cover the full integration. The integration-level behaviours the test-strategy review flagged (React re-render cascade on Yjs update, `y-indexeddb` async behaviour around the `synced` event) are covered by the `useYjsDoc.test.ts` file via `fake-indexeddb` and `renderHook` with a real Y.Doc instance.

## Rollout

The PR for Step 3 ships:

1. The new `useYjsDoc` hook.
2. The new `useYjsToLegacyMirror` adapter.
3. The strategy switch in `useAllotmentData`.
4. The cross-tab `bwp-storage-flag` BroadcastChannel and the "reload required" banner.
5. The seven rewritten domain-hook files with explicit two-branch methods.
6. The `mutate(fn)` API surface on the domain-hook prop bundle.
7. One flag in `src/config/release-visibility.ts` defaulting to `false`: `USE_YJS_STORAGE`.
8. The four test files described above (`allotment-path-parity.test.ts`, `useYjsDoc.test.ts`, `useYjsToLegacyMirror.test.ts`, reshaped `useSyncedStorage.test.ts`).
9. `fake-indexeddb` as a dev dependency.
10. Rename `src/lib/yjs-spike/` to `src/lib/yjs/` (tracked as a separate follow-up commit in the same PR for review clarity).

Post-merge rollout has two explicit phases, calibrated for a cohort of two real users (the author plus one collaborator). Statistical evidence is not available regardless of how the soak is structured, so the gates are qualitative.

**Phase 1: cutover.** Deployment runbook runs the no-op `UPDATE allotments SET data = data` SQL to seed one pre-cutover history row per user. `USE_YJS_STORAGE` flips to default-on via a follow-up PR. Both real users use the app on the flag for ~3-5 days each across normal flows: add plantings, edit areas, run a manual cross-device conflict (edit on phone and laptop, watch the conflict dialog handle it). The legacy chain stays in tree as the mirror target. Success criterion to move to Phase 2 is qualitative: both users report no data anomalies and the conflict-replace path is verified at least once. If anything looks off, flip the flag back off — single-file PR, no data migration, legacy chain resumes as canonical.

**Phase 2: cleanup.** Step 5 of the ADR. Deletes `useSyncedStorage`, `useYjsToLegacyMirror`, the legacy branch of every domain-hook method, the `bwp-storage-flag` BroadcastChannel, and the legacy `allotment-unified-data` localStorage key. Keeps `serializeToJson` and `decodeDocState` (load-bearing for GDPR export and rollback). Triggers a separate PR to migrate Supabase storage from JSONB to BYTEA + Yjs binary, which is the cloud-side payoff of the whole sequence.

Rollback during Phase 1 is a flag flip in `release-visibility.ts`. Rollback during Phase 2 requires the binary export via `serializeToJson`, exactly as covered by Step 2's tests.

## Per-file inventory

`src/hooks/useYjsDoc.ts` — new, ~280 lines. Hook implementation, IndexeddbPersistence wiring, first-run hydration from legacy localStorage with full schema-migration pipeline, snapshot publishing, `mutate(fn)` helper, `replaceFromJson`, `serializeAndPush`, `flushSave` equivalent.

`src/hooks/useYjsToLegacyMirror.ts` — new, ~60 lines. Effect-based adapter that calls `local.setData(snapshot)` on Yjs snapshot change and handles cancel/flush.

`src/hooks/allotment/useAllotmentData.ts` — flag-aware switch between `useSyncedStorage` (legacy) and `useYjsDoc` + `useYjsToLegacyMirror` composition (Yjs). Adds the `bwp-storage-flag` BroadcastChannel handling. Estimated ~50 lines changed.

`src/hooks/allotment/useAllotmentAreas.ts`, `useAllotmentPlantings.ts`, `useAllotmentVarieties.ts`, `useAllotmentCustomTasks.ts`, `useAllotmentMaintenance.ts`, `useAllotmentNotes.ts`, `useAllotmentCareLogs.ts` — each method body grows a top-level `if (USE_YJS_STORAGE)` branch. 99 setData call sites, ~10 of which are cross-collection or otherwise gnarly. Total added surface ~600 lines.

`src/config/release-visibility.ts` — two new constants, both `false`.

`src/__tests__/hooks/useYjsDoc.test.ts` — new, ~350 lines.

`src/__tests__/hooks/useYjsToLegacyMirror.test.ts` — new, ~120 lines.

`src/__tests__/hooks/allotment-path-parity.test.ts` — new, ~250 lines. One integration test mounting `useAllotment` under both flag states and asserting snapshot equality after each of a scripted mutation sequence. Replaces the originally-planned seven per-domain test files; per-domain coverage is tracked as a follow-up.

`src/__tests__/hooks/useSyncedStorage.test.ts` — reshaped to cover both paths via `describe.each` on the conflict-resolution branch.

A new `src/components/StorageFlagReloadBanner.tsx` — new, ~40 lines. UI for the cross-tab flag-transition reload banner.

`package.json` — adds `fake-indexeddb` as a dev dependency.

## Open questions

The `mutate(fn)` vs `withDraft(store, fn)` naming preference is a low-stakes call deferred to the first domain-hook rewrite. Either is fine; pick the one that reads more naturally in `addPlanting`'s Yjs branch and use that consistently across all seven files.

The pre-cutover SQL `UPDATE allotments SET data = data` runbook step assumes the `BEFORE UPDATE` trigger from `sql/002-allotment-history.sql` is still active in production at cutover time. If anything has changed about that trigger in the meantime, the runbook needs adjusting. Verify on the day of the cutover PR.

## Out of scope

Cloud-sync transport changes (Step 4), schema migrations, `AllotmentData` type changes, UI changes beyond the flag-transition reload banner, performance optimizations beyond the snapshot-on-every-update default, selector-based reactivity, and removal of the legacy chain (Step 5) are all out of scope for Step 3.
