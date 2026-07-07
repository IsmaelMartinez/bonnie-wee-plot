# ADR 027: Revisit Sync Engine — Yjs over a Non-WebRTC Transport

## Status

Accepted. Step 1 ADR + Step 2 PoC merged in PR #364 (2026-05-13); Step 3 integration behind `USE_YJS_STORAGE` shipped in PRs #382–#388, defaulted on 2026-05-19; Step 5 cleanup retired the legacy chain. Step 4 (Yjs binary as the cloud transport) is now implemented — the cloud copy is exchanged as Yjs binary CRDT state and merged server-side-equivalently, and the LWW machinery is retired (see the Step 4 note below). Supersedes the cloud-sync portion of ADR 024; the share/receive flow described there remains.

## Date

2026-05-09

## Context

The current cloud-sync architecture is local-first JSONB in Supabase plus last-write-wins (LWW) reconciliation on `meta.updatedAt`, implemented in `src/hooks/useSyncedStorage.ts`. It served the app for several months but produced a serious incident on 2026-05-08: signing in on a second window silently overwrote several days of cloud activity because `saveAllotmentData` bumped `meta.updatedAt` on every save (including load-time side effects), which fooled LWW into pushing a stale-content / now-stamped local up to Supabase. PRs #331 and #332 closed that hole with a content-equality short-circuit, a structurally-smaller safety net, and server-side history with restore UI. PR #338 then added a 30 s push debounce to dampen history-row noise. Each of those is a patch on top of a sync model that fundamentally cannot detect concurrent edits — it can only notice that two snapshots differ and ask the user to choose.

ADR 024 documented that the original sync attempt was Yjs CRDTs over PeerJS / WebRTC, abandoned in early 2026 because WebRTC connectivity was unreliable across mobile networks and corporate firewalls. Crucially, ADR 024 did not abandon Yjs itself — it abandoned the WebRTC transport and the P2P pairing UX. With a websocket relay instead of WebRTC, Yjs becomes viable again, and the LWW machinery (and the entire class of incidents it produces) goes away. The "shareable by ID, auto-sync, conflict-free" library the user has repeatedly mentioned wanting is exactly Yjs (or its modern cousin AutomergeRepo).

## Decision

Spike Yjs as the cloud-sync engine, transported over a non-WebRTC websocket relay. The spike must answer two questions before it becomes a full migration: does the data shape map cleanly to Yjs types without contortions, and does the chosen transport meet our latency and cost targets at low traffic.

### Transport survey

Four transports were considered. The analysis below ranks them on the dimensions that matter for a single-developer, low-traffic, hobby-budget project that nonetheless wants single-binary deployment ergonomics and zero ongoing ops.

`y-websocket` self-hosted on Fly or Render is the reference y-websocket server (a small Node process). Cheapest at zero traffic if the host has a free tier, but it needs a long-running process per app instance and adds an ops surface (deploy, logs, restarts, scaling) that the rest of this stack does not have — Vercel + Supabase are both serverless from the user's perspective.

Cloudflare Durable Objects can host the y-websocket protocol with one Durable Object instance per document. This is the closest match to Yjs's coordination model: y-websocket needs an in-memory `Y.Doc` shared across all clients connected to the same document, which stateless Workers cannot hold but Durable Objects are designed for exactly. Durable Objects require the Workers Paid plan (entry at $5/mo) — there is no functional free tier, unlike standard Workers. At our scale the included compute/storage in the $5/mo plan covers us comfortably; the real cost comparison is against Fly's free allowance below. No long-running process to babysit, and it composes with the existing Vercel deploy.

Supabase Realtime offers a websocket channel API but is presence-and-broadcast oriented, not built for the y-websocket protocol. Adapting it would mean writing a Realtime-to-Yjs translation layer; doable but defeats the "just use the standard transport" win.

Liveblocks is a hosted Yjs provider with the right shape out of the box, but it adds a third paid SaaS dependency (Clerk + Supabase + Liveblocks) and the pricing model assumes commercial use.

### Decision

The spike will target **Cloudflare Durable Objects** hosting the y-websocket protocol, one Durable Object per allotment document. If the spike fails for cost or complexity reasons, the fallback is `y-websocket` self-hosted on Fly. Liveblocks and Supabase Realtime are explicitly off the table.

### Spike outline

The spike runs in five steps, each independently revertable.

The first step is this ADR (in flight). Subsequent steps live on a feature branch and do not touch `main` until the migration step.

Step two converts `AllotmentData` to a Yjs document on a spike branch. The 192-entry vegetable database is static and stays as TypeScript modules — only mutable user state (`meta`, `seasons`, `varieties`, `customTasks`, `maintenanceTasks`, `gardenEvents`, `compost`) moves into the `Y.Doc`. The top-level shape maps to a `Y.Map` for `meta`, `Y.Array` for `seasons`, and so on. Rough sizing: a few days of work, not hours, mostly because every consumer of `setData` needs to learn to write through the Yjs APIs instead of replacing the root object. The spike should also evaluate a proxy wrapper such as `valtio/yjs` or `synced-store`, which let callers keep the existing immutable-style read/write idiom on top of Yjs and could cut the consumer refactor surface significantly if the developer experience holds up.

### Step 2 shipped (2026-05-13, PR #364 `8b28818`)

A proof-of-concept landed on `main` in `src/lib/yjs-spike/allotment-yjs.ts` with 13 passing unit tests in `src/__tests__/lib/yjs-spike/`. Key decisions out of the cut:

The proxy-wrapper question is resolved in favour of **SyncedStore** (`@syncedstore/core@^0.6`). The valtio-yjs alternative is explicitly self-described as alpha ("the experiment is finished, now it's in alpha") and would not be acceptable for a migration that touches every user's data. SyncedStore is production-tested via BlockNote, has a clean shape API, and its `getYjsDoc()` escape hatch keeps the raw Yjs surface available where needed.

SyncedStore's shape validator imposes one constraint worth documenting up front: top-level entries must be exactly `{}`, `[]`, `"xml"`, or `"text"` — nested initializers throw `Root Object initializer must always be {}`. The legacy `AllotmentData.layout.areas` wrapper is therefore collapsed away in the Yjs shape (`areas` lifts to the top level) and reconstructed at the serialization boundary. The same constraint forces top-level primitives (`version`, `currentYear`) into a nested `state` Y.Map. Neither change is user-visible — the legacy JSON shape is preserved across the hydrate / serialize round-trip.

`undefined` values must be dropped before assignment — Yjs cannot represent `undefined` and SyncedStore is inconsistent about whether it throws or silently drops. The `assignDefined` helper in the PoC walks the source object and skips undefined fields; the same discipline will apply to every write site in the Step 3 hook.

Two correctness gotchas were found during review and now have tests. First, re-hydration has to clear *every* mutable container, not just the top-level Y.Arrays: the `meta` Y.Map needs an explicit key-by-key delete pass before `assignDefined` runs, otherwise a hydrate from a backup with fewer fields silently keeps the previous run's `aiAdvisorEnabled` / `coordinates` / etc. Second, SyncedStore cannot distinguish "field never set" from "empty array" once hydrate has run — both leave a zero-length Y.Array — so the canonical `serializeToJson` output normalises optional top-level arrays (`customTasks`, `maintenanceTasks`, `gardenEvents`, `compost`) to `[]` regardless of which shape the input had. Both behaviours are documented inline in `allotment-yjs.ts` and asserted by tests; Step 3 will need to thread the same discipline through every domain-hook write site.

Concurrent-edit semantics are confirmed in tests: two doc instances editing different plantings in the same bed merge cleanly; two doc instances editing the same field (an area name) converge to a deterministic single value. This is the headline win that the LWW machinery in `useSyncedStorage` cannot deliver.

First binary-size measurement on a small fixture (one bed with 2 plantings, one tree, 2 varieties, one compost pile): JSON 2146B, Yjs binary 2594B, ratio 1.21. The Yjs payload is *larger* than the JSON at this size — CRDT metadata is a fixed overhead that only amortises away on bigger documents. The cost-line risk the ADR enumerates remains open until measured on a realistic multi-season fixture; the small-doc data point is a cautionary one for users who are barely past the onboarding wizard.

Not addressed in this cut: integration with `useAllotment`, `y-indexeddb` persistence, Cloudflare Durable Object transport, Clerk JWT verification inside a Worker, and the dual-write migration. Step 3 picks up the integration; Steps 4–5 unchanged from the original outline.

### Step 3 design constraints (2026-05-14, spec drafted)

The Step 3 design spec at `docs/superpowers/specs/2026-05-13-yjs-step-3-integration-design.md` is drafted and under user review before the implementation plan. Three load-bearing decisions in that spec are worth surfacing here so they survive future PRs that might be tempted to "simplify".

`serializeToJson` and `decodeDocState` are not deletable, ever. They have three load-bearing roles: the rollback path after Step 5 deletes the legacy chain (decode binary → JSON → restore), the GDPR `/api/account` export endpoint once Step 4 makes Supabase store Yjs binary (the export needs JSON back), and migration debugging when an individual user's Yjs binary needs to be inspected. Step 3's rollout includes a rename from `src/lib/yjs-spike/` to `src/lib/yjs/` to reflect that the directory is permanent infrastructure rather than exploratory code.

The legacy → Yjs mapping is *not* a runtime bijection. An earlier spec draft proposed a unified `mutate(fn)` API on both paths via a reshape-and-unreshape between `AllotmentData` and `AllotmentStoreShape`; subagent review of that draft found the bijection to be a silent-corruption hazard on the legacy path during the entire soak. The final design uses explicit two-branch domain-hook methods: legacy code reads and writes `AllotmentData` unchanged on its branch, Yjs code reads and writes `AllotmentStoreShape` on its branch, and the only translation point is `serializeToJson` running inside the mirror adapter (Yjs → legacy localStorage). Future PRs touching this seam should preserve this property.

The dual-write bridge during the soak drives `usePersistedStorage.setData()`, not localStorage directly. An earlier draft had `useYjsDoc` writing snapshots straight to the legacy `allotment-unified-data` key; review found this would not trigger `useSyncedStorage`'s push effect (which listens for `local.saveStatus === 'saved'` transitions from the debounced save cycle), so the cloud copy would stagnate silently. The corrected design routes Yjs-side updates through `useYjsToLegacyMirror` which calls `local.setData(snapshot)` on the existing `usePersistedStorage` instance, driving the full debounce + save + push cycle as if a domain hook had called `setData` directly.

Step three replaces `useSyncedStorage` with a `useYjsDoc` hook. The `usePersistedStorage` semantics stay (local cache via `y-indexeddb` instead of raw localStorage) so the offline-first guarantee is preserved.

Step four migrates live users. A one-shot import reads each user's current `allotments.data` JSONB row, hydrates a Yjs doc from it, and snapshots the binary state into a new `BYTEA` column (e.g. `allotments.yjs_state`) or a dedicated `allotment_yjs` table — `JSONB` cannot hold raw binary, so reusing `allotments.data` directly is not an option. The migration should run as a dual-write phase: keep updating both the legacy JSONB and the new Yjs binary for a short window so the cut-over is reversible per user if a decoding bug surfaces. The `allotment_history` table from #332 is the safety net during the migration — every user has at least one recovery point predating the migration.

Step five retires the LWW machinery: `useSyncedStorage`, `contentSnapshot`, `isLocalStructurallySmaller`, the conflict dialog, the BEFORE-UPDATE history trigger (the history table itself stays as a defensive backup). The share / receive flow described in ADR 024 stays — it serves a different purpose (one-shot transfer to a new device without sign-in) that Yjs does not replace.

### Step 5 shipped (cleanup)

With `USE_YJS_STORAGE` default-on since 2026-05-19 and the soak window clear of data anomalies, Step 5 deleted the legacy storage chain and its rollback scaffolding:

- The `USE_YJS_STORAGE` flag is gone; `useAllotmentData` composes `useYjsDoc` (canonical local engine, IndexedDB via `y-indexeddb`) with `useCloudSync` unconditionally. The eight domain hooks (`useAllotmentAreas`, `useAllotmentPlantings`, `useAllotmentVarieties`, `useAllotmentCustomTasks`, `useAllotmentMaintenance`, `useAllotmentNotes`, `useAllotmentCareLogs`, `useCompost`) keep only their `mutate()` branch — the legacy `setData` branch and the `setData` prop are removed.
- Deleted: `useSyncedStorage`, `usePersistedStorage`, `useYjsToLegacyMirror`, `StorageFlagReloadBanner`, the `bwp-storage-flag` BroadcastChannel, the legacy `allotment-unified-data` debounced-save write path, and the same-tab broadcast apparatus from PR #369 (`bonnie:storage-update` CustomEvent, `instanceId` / `sameTabSeq` bookkeeping, `recordSavedState` / `recordAdoptedState`, and the `recentSavesRef` echo dedup). On first run `useYjsDoc` seeds the doc via `initializeStorage()` (read + migrate the `allotment-unified-data` key, or create + persist a fresh default allotment on a brand-new device — the same seed the legacy chain produced); only the mirror/auto-save write path is gone, so mutations persist to IndexedDB rather than that key. Cross-tab sync now rides `y-indexeddb`'s IndexedDB broadcast.
- **Cloud sync preserved via `useCloudSync`** (`src/hooks/useCloudSync.ts`): the Supabase fetch/push/LWW-guard/conflict-dialog layer, the 30s push debounce, and the unload flush (PRs #331/#332/#338) were ported off `usePersistedStorage` to consume the Yjs snapshot directly. On a `'cloud'` conflict resolution it adopts the remote via `useYjsDoc.replaceFromJson`; on `'local'` it pushes the current snapshot. A `normalizedContentSnapshot` round-trips the adopted remote through hydrate/serialize so the republished snapshot isn't pushed straight back.
- `serializeToJson` and `decodeDocState` stay permanently (rollback, GDPR export, debug), per the Step 3 spec.
- Follow-ups folded in: `src/lib/yjs-spike/` → `src/lib/yjs/`; the domain-hook `yjs-helpers.ts` (`withoutUndefined` / `assignDefined`) consolidated into `allotment-yjs.ts`; the `addInitScript` Playwright seeds (homepage / onboarding) now clear the Yjs IndexedDB on first load via `tests/utils/storage.ts`; the path-parity test became a Yjs-path regression test (`allotment-yjs-storage.test.ts`).

### Step 4 shipped (Yjs binary cloud transport)

Step 4 moves the cloud store/exchange from Supabase JSONB + LWW to the Yjs
document as **binary** CRDT state, retiring the LWW machinery the ADR listed.
Two transport-shaped decisions in the original outline were revisited against the
actual two-user reality and settled as follows.

**Transport: keep Vercel/Supabase request/response, not Cloudflare Durable
Objects.** The ADR's decision section targeted Durable Objects hosting
y-websocket for *real-time* sync. Step 4 instead exchanges Yjs *binary
updates/state* over the existing serverless shape: pull remote → `Y.applyUpdate`
(true CRDT merge) → push the merged full-state with optimistic-concurrency (CAS)
retry. This delivers the headline win the ADR is for — concurrent edits merge,
LWW is gone — without the new infra dependency (Wrangler, Workers Paid, Clerk JWT
verification inside a Worker) and bus-factor increase that the "Negative"
consequences below flag. The cost is that propagation is not real-time (a device
sees another's edits on its next pull, as with the prior 30s-debounced model).
Durable Objects remain the documented path if real-time is ever required.

**Storage: new BYTEA columns, JSONB kept as a derived mirror.** `allotments`
gains `yjs_state BYTEA` (the authoritative encoded doc) and `yjs_updated_at
TIMESTAMPTZ` (the CAS token); RLS is unchanged (the existing per-row policies
cover the new columns). `allotments.data` JSONB is retained and rewritten on
every push from the merged doc, so the `allotment_history` trigger, the GDPR
`/api/account` export, and Supabase Studio inspection all keep working unchanged,
and per-user rollback stays trivial. This means LWW *reconciliation* is retired
(merge replaces it) even though the JSONB column persists as a read-only view.

**The lineage constraint (the load-bearing subtlety).** CRDT merge is only
duplicate-free when all devices share one document lineage. The per-device local
docs were hydrated independently in Step 3/5 and do **not** share history, so a
naive binary merge would union — and duplicate — all pre-existing shared content.
Step 4 therefore forces a one-time **adoption**: on a device's first Step-4 sync
it clears its local doc and applies the canonical cloud binary on top (via a new
`bwp-yjs-synced-<userId>` flag, distinct from the LWW-era flag so every device
adopts once). The one-shot migration (JSONB → binary) is serialised to a single
canonical lineage by the CAS write: if two devices migrate concurrently, the
loser re-fetches and adopts the winner's binary. After adoption, edits are true
concurrent operations on the shared lineage and merge cleanly.

**Retired.** `useSyncedStorage`'s successor guards are gone: `contentSnapshot`,
`isLocalStructurallySmaller`, the `SyncConflict` type, `SyncConflictDialog`, the
`resolveConflict`/`syncConflict` surface, the `'conflict'` sync status, and the
JSONB `pushToRemote`. `fetchRemote`/`deleteRemote` stay (GDPR export + history).
The `allotment_history` table and its trigger stay as the defensive backup.

Implementation: `sql/004-allotment-yjs.sql`, `src/lib/supabase/sync-binary.ts`,
the binary surface on `useYjsDoc` (`encodeState` / `mergeRemoteUpdate` /
`adoptRemoteUpdate` / `hasUpdatesBeyond`), and the reworked `useCloudSync`.
Deployment steps (including the pre-migration history-row seeding) are in
`docs/runbooks/adr-027-step-4-yjs-binary-migration.md`.

## Consequences

### Positive

The entire LWW failure mode disappears: there is no `meta.updatedAt` to be fooled by, no "structurally smaller" heuristic to maintain, no conflict dialog to design around. Concurrent edits across devices merge automatically because that is what Yjs does. The cloud-history table stops growing on every save because there is no per-save push to trigger it — Yjs sends per-character updates that coalesce server-side.

A second-tab edit becomes a real-time experience instead of a stale-data hazard. Multi-device families (one user the plan repeatedly notes is a target) get a noticeably better story: the wife's phone and the husband's tablet stay in sync without anyone hitting "sync now".

The architecture finally matches the user's stated mental model from ADR 024 ("shareable by ID, auto-sync, conflict-free"). It also unlocks future collaboration features (shared allotments, allotment "co-owners") with no extra sync code.

### Negative

Cloudflare Durable Objects is a new infrastructure dependency that the user must learn to operate. The bus factor goes from "Vercel + Supabase, both well-understood" to "Vercel + Supabase + Cloudflare DOs, the third less so". Deployment requires Wrangler and a `cloudflare/durable-objects` config file.

The migration is one-shot and irreversible per user. If the Yjs encoding has a bug, the user's data is on a format we have to fix forward. The history table is the safety net, but exercising it for many users at once would be painful.

Yjs binary updates are opaque: tools like Supabase Studio cannot inspect a user's data the way they can inspect JSONB. Debugging a real user's data shape becomes "decode the Yjs binary in a script" rather than "click the row".

Per-character updates are chatty. At low traffic this is free; at scale it could add up. The spike should measure update volume on a realistic editing session before commitment.

### Risks the spike must measure

The spike must produce concrete numbers for: average update bytes per editing minute on a typical session, latency of a Durable Object cold-start versus warm, monthly cost projection at the current user count (low single digits) and at a hypothetical 1k-user steady state, total persistent state per user (the Yjs binary is generally smaller than the equivalent JSONB but this needs measurement on real data), and the implementation cost of Clerk JWT verification inside the Worker (JWKS fetch + cache, key rotation handling) — moving sync into a Durable Object means re-implementing the auth check that today lives in Next.js API routes, and that work belongs on the bus-factor side of the ledger.

If the spike reveals that any of the above is materially worse than the current architecture, the decision reverts to "stay on JSONB + LWW + the patches landed in #331/#332/#338" and this ADR moves to status `Rejected`.

## References

- ADR 024 — Data Sharing Architecture (covers why Yjs over WebRTC was abandoned; the share/receive flow it describes is unaffected by this ADR).
- PRs #331, #332, #338 — the patches on top of the current sync architecture, all of which Yjs would render unnecessary.
- `src/hooks/useSyncedStorage.ts` — the current sync entry point that this ADR ultimately replaces.
- `sql/002-allotment-history.sql` — the history table that doubles as the migration safety net.
