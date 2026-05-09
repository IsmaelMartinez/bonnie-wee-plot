# ADR 027: Revisit Sync Engine — Yjs over a Non-WebRTC Transport

## Status

Proposed (spike not yet started). Supersedes the cloud-sync portion of ADR 024 once accepted; the share/receive flow described there remains.

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

Cloudflare Durable Objects can host the y-websocket protocol with one Durable Object instance per document. This is the closest match to Yjs's coordination model: y-websocket needs an in-memory `Y.Doc` shared across all clients connected to the same document, which stateless Workers cannot hold but Durable Objects are designed for exactly. Pricing scales with active document-seconds and is free at our scale. No long-running process to babysit, and it composes with the existing Vercel deploy.

Supabase Realtime offers a websocket channel API but is presence-and-broadcast oriented, not built for the y-websocket protocol. Adapting it would mean writing a Realtime-to-Yjs translation layer; doable but defeats the "just use the standard transport" win.

Liveblocks is a hosted Yjs provider with the right shape out of the box, but it adds a third paid SaaS dependency (Clerk + Supabase + Liveblocks) and the pricing model assumes commercial use.

### Decision

The spike will target **Cloudflare Durable Objects** hosting the y-websocket protocol, one Durable Object per allotment document. If the spike fails for cost or complexity reasons, the fallback is `y-websocket` self-hosted on Fly. Liveblocks and Supabase Realtime are explicitly off the table.

### Spike outline

The spike runs in five steps, each independently revertable.

The first step is this ADR (in flight). Subsequent steps live on a feature branch and do not touch `main` until the migration step.

Step two converts `AllotmentData` to a Yjs document on a spike branch. The 192-entry vegetable database is static and stays as TypeScript modules — only mutable user state (`meta`, `seasons`, `varieties`, `customTasks`, `maintenanceTasks`, `gardenEvents`, `compost`) moves into the `Y.Doc`. The top-level shape maps to a `Y.Map` for `meta`, `Y.Array` for `seasons`, and so on. Rough sizing: a few days of work, not hours, mostly because every consumer of `setData` needs to learn to write through the Yjs APIs instead of replacing the root object.

Step three replaces `useSyncedStorage` with a `useYjsDoc` hook. The `usePersistedStorage` semantics stay (local cache via `y-indexeddb` instead of raw localStorage) so the offline-first guarantee is preserved.

Step four migrates live users. A one-shot import reads each user's current `allotments.data` JSONB row, hydrates a Yjs doc from it, snapshots the binary state, and stores it in either a new `allotment_yjs` table or the existing `allotments.data` column reinterpreted as a Yjs binary update. The `allotment_history` table from #332 is the safety net during the migration — every user has at least one recovery point predating the migration.

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

The spike must produce concrete numbers for: average update bytes per editing minute on a typical session, latency of a Durable Object cold-start versus warm, monthly cost projection at the current user count (low single digits) and at a hypothetical 1k-user steady state, and total persistent state per user (the Yjs binary is generally smaller than the equivalent JSONB but this needs measurement on real data).

If the spike reveals that any of the above is materially worse than the current architecture, the decision reverts to "stay on JSONB + LWW + the patches landed in #331/#332/#338" and this ADR moves to status `Rejected`.

## References

- ADR 024 — Data Sharing Architecture (covers why Yjs over WebRTC was abandoned; the share/receive flow it describes is unaffected by this ADR).
- PRs #331, #332, #338 — the patches on top of the current sync architecture, all of which Yjs would render unnecessary.
- `src/hooks/useSyncedStorage.ts` — the current sync entry point that this ADR ultimately replaces.
- `sql/002-allotment-history.sql` — the history table that doubles as the migration safety net.
