# ADR 027: Revisit Sync Engine — Yjs over a Non-WebRTC Transport

## Status

Accepted, spike in flight (Step 1 ADR + Step 2 PoC merged in PR #364 on 2026-05-13; Steps 3–5 outstanding). Supersedes the cloud-sync portion of ADR 024 once Step 5 retires the LWW machinery; the share/receive flow described there remains.

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

Step three replaces `useSyncedStorage` with a `useYjsDoc` hook. The `usePersistedStorage` semantics stay (local cache via `y-indexeddb` instead of raw localStorage) so the offline-first guarantee is preserved.

Step four migrates live users. A one-shot import reads each user's current `allotments.data` JSONB row, hydrates a Yjs doc from it, and snapshots the binary state into a new `BYTEA` column (e.g. `allotments.yjs_state`) or a dedicated `allotment_yjs` table — `JSONB` cannot hold raw binary, so reusing `allotments.data` directly is not an option. The migration should run as a dual-write phase: keep updating both the legacy JSONB and the new Yjs binary for a short window so the cut-over is reversible per user if a decoding bug surfaces. The `allotment_history` table from #332 is the safety net during the migration — every user has at least one recovery point predating the migration.

Step five retires the LWW machinery: `useSyncedStorage`, `contentSnapshot`, `isLocalStructurallySmaller`, the conflict dialog, the BEFORE-UPDATE history trigger (the history table itself stays as a defensive backup). The share / receive flow described in ADR 024 stays — it serves a different purpose (one-shot transfer to a new device without sign-in) that Yjs does not replace.

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
