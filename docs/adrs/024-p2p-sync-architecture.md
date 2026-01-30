# ADR 024: P2P Sync Architecture

Date: 2026-01-29
Status: Accepted
Updated: 2026-01-30

## Context

Users want to access their allotment data across multiple devices (phone while in the garden, laptop for planning). Currently all data lives in localStorage on a single device with manual export/import as the only sync mechanism.

We evaluated several approaches: cloud sync (requires server infrastructure and accounts), manual export/import (current state, poor UX), and peer-to-peer sync (minimal server, automatic merging).

## Decision

We implement peer-to-peer synchronization using PeerJS for signaling with WebRTC DataChannels for the actual data transport. Key architectural choices:

### Data Layer: Yjs CRDT

Replace direct localStorage writes with Yjs Y.Doc operations. Yjs provides conflict-free replicated data types that automatically merge concurrent edits without data loss. The Y.Doc persists to IndexedDB via y-indexeddb provider.

Rationale: Yjs is the most mature CRDT implementation (900k+ weekly npm downloads), used by Figma and other production apps. The Y.Map/Y.Array types map naturally to our AllotmentData schema.

### Discovery & Signaling: PeerJS

We use PeerJS's free public signaling server for WebRTC connection establishment. Browsers cannot discover other devices on a local network (no mDNS API), so a signaling server is required to exchange WebRTC connection info.

PeerJS only handles the initial "find each other" phase. It sees peer IDs (derived from public keys) and IP addresses, but NOT the actual sync data. After connection establishment, all data flows directly between devices via encrypted WebRTC DataChannels.

Rationale: PeerJS is a well-maintained, lightweight solution. The free public server eliminates infrastructure costs. If needed, peerjs-server can be self-hosted. The security impact is minimal since we authenticate peers with Ed25519 signatures after connection.

### Transport: WebRTC DataChannel

Peer connections use WebRTC with DTLS encryption. Data flows directly between devices after PeerJS facilitates the initial handshake.

Rationale: WebRTC is battle-tested for browser P2P, provides built-in encryption, and works in all modern browsers including mobile Safari.

### Device Identity: Ed25519 Keypairs

Each device generates a persistent Ed25519 keypair. Public key serves as device identity. Pairing uses QR codes with 6-digit out-of-band verification.

Rationale: Cryptographic identity prevents impersonation. QR + confirmation code prevents attacks from photographed QR codes. Ed25519 is fast and well-supported via tweetnacl.

### Peer Model: Equal Peers

All devices are equal peers with full local copies. Any device can initiate sync. No primary/secondary distinction.

Rationale: More resilient than primary-server model. Matches CRDT semantics where all replicas are equally valid. Either device can work offline indefinitely.

## Consequences

### Positive

- Minimal server dependency (PeerJS signaling only, no data storage)
- Data flows directly P2P after connection - signaling server never sees user data
- Works across any network (not limited to same WiFi)
- Conflict-free merging means no manual conflict resolution
- Multi-tab sync comes free with IndexedDB persistence
- Future-proof: same CRDT foundation supports friend sharing
- Can self-host peerjs-server if needed for independence

### Negative

- Depends on PeerJS public server availability (can self-host as fallback)
- PWA background execution limits mean sync only happens when app is foregrounded
- IndexedDB storage limits may require pruning strategy for large histories
- PeerJS server sees connection metadata (peer IDs, IPs, when devices connect)

### Migration

Existing localStorage data migrates to Y.Doc on first load. Old localStorage kept as backup for 30 days. No user action required.

## Alternatives Considered

### Cloud Sync (Firebase, Supabase)

Rejected: Requires server infrastructure, user accounts, ongoing costs. Conflicts with local-first philosophy.

### mDNS Discovery (Local Network Only)

Rejected: Browsers don't have mDNS/Bonjour APIs. BroadcastChannel only works between tabs in the same browser, not across physical devices. Would require a native app wrapper.

### Gun.js

Rejected: Higher complexity, less mature than Yjs, harder to reason about consistency guarantees.

### Automerge

Considered: Excellent CRDT with audit trail capabilities. Rejected for MVP due to larger bundle size and less mature browser ecosystem. Could revisit if compliance/audit requirements emerge.

### libp2p for Discovery

Deferred: Adds ~200KB bundle size and DHT complexity. PeerJS is simpler for initial implementation. Can migrate to libp2p later if decentralization becomes priority.

## Security Analysis

PeerJS signaling server exposure:
- Sees: Peer IDs (derived from public keys), IP addresses, connection timing
- Does NOT see: Device names, user data, sync content

Mitigations:
- Ed25519 challenge-response authentication after WebRTC connects
- Only paired devices (verified via QR code) are trusted
- All data encrypted in transit via WebRTC DTLS
- Peer IDs are hashes, not raw public keys

## References

- [P2P Sync Design](../plans/2026-01-29-p2p-sync-design.md)
- [Yjs Documentation](https://docs.yjs.dev/)
- [PeerJS Documentation](https://peerjs.com/docs/)
- [Local-First Software](https://www.inkandswitch.com/essay/local-first/)
