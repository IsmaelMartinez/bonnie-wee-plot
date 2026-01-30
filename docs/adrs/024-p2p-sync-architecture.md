# ADR 024: Data Sharing Architecture

Date: 2026-01-29
Status: Superseded
Updated: 2026-01-30

## Original Context

Users wanted to access their allotment data across multiple devices. We initially implemented peer-to-peer synchronization using PeerJS/WebRTC with Yjs CRDTs for conflict-free merging.

## Original Decision (Now Superseded)

We implemented P2P sync with:
- Yjs CRDTs for data merging
- PeerJS for WebRTC signaling
- Ed25519 keypairs for device identity
- QR code pairing with 6-digit verification

## Why P2P Was Abandoned

The P2P approach added significant complexity without delivering proportional user value:

1. **Complexity vs. Use Case**: P2P sync solves continuous multi-device editing, but our users primarily need one-time data transfer to a new device. The P2P machinery (CRDT merging, keypairs, WebRTC negotiation) was overkill.

2. **Unreliable Connections**: WebRTC P2P connections proved fragile - STUN/TURN negotiation often failed, especially on mobile networks and behind corporate firewalls.

3. **Maintenance Burden**: The P2P codebase added ~2000 lines of sync infrastructure, multiple new dependencies (yjs, y-indexeddb, y-protocols, peerjs, tweetnacl), and complex test scenarios.

4. **User Confusion**: The pairing flow (generate keypair, scan QR, confirm 6-digit code, wait for connection) was too complex for what users actually wanted: "get my data on this other phone."

## New Decision: Simple Share/Receive

Replace P2P sync with a simple share flow:

### Share (Sender)
1. Go to Settings > Share My Allotment
2. Data uploads to Upstash Redis (expires in 5 minutes)
3. Receive a 6-character code and QR code
4. Share code or scan QR on receiving device

### Receive (Receiver)
1. Scan QR or enter code at `/receive`
2. Preview the shared data (allotment name, planting count)
3. Confirm import - data replaces local storage
4. Automatic backup created before import

### Implementation

**API Routes:**
- `POST /api/share` - Upload data, receive 6-char code
- `GET /api/share/[code]` - Retrieve data by code

**UI Components:**
- `src/components/share/ShareDialog.tsx` - QR display and code
- `src/app/receive/page.tsx` - Code entry / QR scanner
- `src/app/receive/[code]/page.tsx` - Preview and import

**Storage:** Upstash Redis with 5-minute TTL for temporary storage.

## Consequences

### Positive
- Drastically simpler codebase (~500 lines vs ~2500 lines for P2P)
- No complex dependencies (removed yjs, peerjs, tweetnacl, etc.)
- Works reliably across all network conditions
- Intuitive user experience matching mental model ("send my data")
- 5-minute expiry provides security without persistent server storage

### Negative
- Requires server-side component (Upstash Redis)
- One-way transfer only (no continuous sync)
- Data temporarily passes through server (encrypted, short-lived)
- Cannot work without internet connection

### Trade-off Rationale

The trade-off is acceptable because:
- Most users only share data occasionally (new device, family member)
- Export/import remains available for offline scenarios
- Server sees encrypted blob, not parsed data
- 5-minute window limits exposure

## Removed Files

Services: `peerjs-signaling.ts`, `device-identity.ts`, `webrtc-manager.ts`, `signaling-coordinator.ts`, `local-discovery.ts`, `ydoc-*.ts`, `yjs-sync-provider.ts`

Hooks: `useSync.ts`, `useSyncConnection.ts`

Components: `src/components/sync/` directory

Types: `sync.ts`

Dependencies: peerjs, yjs, y-indexeddb, y-protocols, tweetnacl, tweetnacl-util
