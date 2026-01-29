# ADR 024: P2P Sync Architecture

Date: 2026-01-29
Status: Accepted

## Context

Users want to access their allotment data across multiple devices (phone while in the garden, laptop for planning). Currently all data lives in localStorage on a single device with manual export/import as the only sync mechanism.

We evaluated several approaches: cloud sync (requires server infrastructure and accounts), manual export/import (current state, poor UX), and peer-to-peer sync (no server, automatic merging).

## Decision

We will implement peer-to-peer synchronization using Yjs CRDTs with WebRTC transport and mDNS discovery. Key architectural choices:

### Data Layer: Yjs CRDT

Replace direct localStorage writes with Yjs Y.Doc operations. Yjs provides conflict-free replicated data types that automatically merge concurrent edits without data loss. The Y.Doc persists to IndexedDB via y-indexeddb provider.

Rationale: Yjs is the most mature CRDT implementation (900k+ weekly npm downloads), used by Figma and other production apps. The Y.Map/Y.Array types map naturally to our AllotmentData schema.

### Discovery: mDNS (Local Network Only)

Devices discover each other via mDNS/Bonjour on the local network. This limits sync to same-WiFi scenarios but eliminates the need for any server infrastructure.

Rationale: Same-network requirement is acceptable for primary use case (home/allotment WiFi). Adds implicit security layer - attackers need physical network access. Cross-network sync can be added later via libp2p DHT or relay server.

### Transport: WebRTC DataChannel

Peer connections use WebRTC with DTLS encryption. Public STUN servers handle NAT traversal for local network connections.

Rationale: WebRTC is battle-tested for browser P2P, provides built-in encryption, and works in all modern browsers including mobile Safari.

### Device Identity: Ed25519 Keypairs

Each device generates a persistent Ed25519 keypair. Public key serves as device identity. Pairing uses QR codes with 6-digit out-of-band verification.

Rationale: Cryptographic identity prevents impersonation. QR + confirmation code prevents attacks from photographed QR codes. Ed25519 is fast and well-supported via tweetnacl.

### Peer Model: Equal Peers

All devices are equal peers with full local copies. Any device can initiate sync. No primary/secondary distinction.

Rationale: More resilient than primary-server model. Matches CRDT semantics where all replicas are equally valid. Either device can work offline indefinitely.

## Consequences

### Positive

- No server infrastructure to maintain or pay for
- Works offline - sync happens opportunistically
- Conflict-free merging means no manual conflict resolution
- Multi-tab sync comes free with IndexedDB persistence
- Future-proof: same CRDT foundation supports friend sharing, relay servers

### Negative

- Same-network limitation requires users to be on same WiFi
- mDNS browser support varies - may need fallback mechanisms
- PWA background execution limits mean sync only happens when app is foregrounded
- IndexedDB storage limits may require pruning strategy for large histories
- Cannot sync while traveling (no cross-network support in MVP)

### Migration

Existing localStorage data migrates to Y.Doc on first load. Old localStorage kept as backup for 30 days. No user action required.

## Alternatives Considered

### Cloud Sync (Firebase, Supabase)

Rejected: Requires server infrastructure, user accounts, ongoing costs. Conflicts with local-first philosophy.

### Gun.js

Rejected: Higher complexity, less mature than Yjs, harder to reason about consistency guarantees.

### Automerge

Considered: Excellent CRDT with audit trail capabilities. Rejected for MVP due to larger bundle size and less mature browser ecosystem. Could revisit if compliance/audit requirements emerge.

### libp2p for Discovery

Deferred: Adds ~200KB bundle size and DHT lookups can be slow. mDNS is simpler for local-network MVP. Can add libp2p later for cross-network sync.

## References

- [P2P Sync Research](../research/p2p-sync-research.md)
- [P2P Sync Design](../plans/2026-01-29-p2p-sync-design.md)
- [Yjs Documentation](https://docs.yjs.dev/)
- [Local-First Software](https://www.inkandswitch.com/essay/local-first/)
