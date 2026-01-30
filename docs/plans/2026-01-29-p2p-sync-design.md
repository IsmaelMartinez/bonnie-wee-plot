# P2P Sync Design

Date: 2026-01-29
Updated: 2026-01-30
Status: Implemented

## Overview

This document describes the design for peer-to-peer synchronization between devices running Bonnie Wee Plot. The feature enables users to sync their allotment data across multiple personal devices (phone, tablet, laptop) without requiring a server.

## Goals

- Sync allotment data between user's own devices
- Work offline-first with automatic sync when devices reconnect
- No server infrastructure required
- Conflict-free merging when both devices edited while apart

## Non-Goals (for this phase)

- Sharing with friends/family (future phase)
- Cloud backup or relay server
- Cross-network sync (devices must be on same WiFi)

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Components                      │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   useAllotment hook                      │
│              (existing API unchanged)                    │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│              useSyncConnection hook (new)                │
│         - Manages peer connections via PeerJS           │
│         - Exposes sync status, peer statuses            │
└─────────────────────────────────────────────────────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │   Yjs    │  │ PeerJS   │  │ WebRTC   │
        │ Y.Doc    │  │ Signaling│  │ DataChan │
        └──────────┘  └──────────┘  └──────────┘
              │             │
              ▼             ▼
        ┌──────────┐  ┌──────────┐
        │IndexedDB │  │ PeerJS   │
        │(persist) │  │ Server   │
        └──────────┘  └──────────┘
                      (free/public)
```

The existing `useAllotment` API remains unchanged. Components don't need to know about sync. The `useSyncConnection` hook manages peer discovery via PeerJS and WebRTC connections. PeerJS server only handles signaling (connection establishment); actual data flows P2P.

## Data Layer

### Yjs Integration

The `AllotmentData` structure maps to Yjs types:

```typescript
const ydoc = new Y.Doc()
const yroot = ydoc.getMap('allotment')

// Structure mirrors AllotmentData
yroot.get('meta')        // Y.Map - allotment metadata
yroot.get('layout')      // Y.Map containing Y.Array of areas
yroot.get('seasons')     // Y.Array of Y.Map (SeasonRecord)
yroot.get('varieties')   // Y.Array of Y.Map (StoredVariety)
yroot.get('currentYear') // number (primitive, last-write-wins)
```

### Persistence

Uses `y-indexeddb` provider for automatic Y.Doc persistence. This replaces localStorage for allotment data. Non-synced settings (feature flags, UI preferences) remain in localStorage.

### Migration

On first load after update:
1. Existing localStorage data imports into Y.Doc
2. Old localStorage key remains as read-only backup for 30 days
3. Backup auto-cleans after 30 days

## Device Identity & Pairing

### Identity

Each device generates an Ed25519 keypair on first launch:

```typescript
interface DeviceIdentity {
  publicKey: string    // Base64-encoded Ed25519 public key
  privateKey: string   // Base64-encoded private key (never leaves device)
  deviceName: string   // User-editable, e.g. "Ismael's iPhone"
  createdAt: string
}

interface PairedDevice {
  publicKey: string
  deviceName: string
  pairedAt: string
  lastSeen?: string
}
```

### Pairing Flow

1. Device A opens "Add Device" in settings, generating a temporary 6-digit code
2. Device A displays QR containing: `{ v: 1, pk: "<public key>", code: "847291", name: "iPhone" }`
3. Device B scans QR, displays the 6-digit code for user verification
4. User confirms codes match (out-of-band verification prevents photo attacks)
5. Device B sends its public key + signed confirmation over WebRTC
6. Both devices store each other in their `pairedDevices` list

The 6-digit code expires after 5 minutes.

### Unpairing

Either device can remove a paired device from settings. This is local-only - the removed device won't be trusted on next connection attempt.

## Connection & Discovery

### PeerJS Signaling

Browsers cannot discover devices on a local network (no mDNS API available). We use PeerJS's free public signaling server for WebRTC connection establishment. The signaling server only facilitates the initial handshake; actual data flows directly P2P.

Each device's peer ID is derived from its public key: `bwp_` + first 32 alphanumeric characters. This provides consistent addressing without exposing the full key.

### WebRTC Connection Flow

When a device comes online:

1. Device connects to PeerJS server with its derived peer ID
2. Device attempts to connect to all paired devices' peer IDs
3. When connection opens, both sides run Ed25519 challenge-response authentication
4. Only after auth succeeds does sync begin
5. Incoming connections from unknown peers are rejected

The PeerJS server sees peer IDs and IP addresses but NOT the sync data or device names.

### Connection Lifecycle

- Connection stays open while both apps are foregrounded
- On PWA background, connection drops and re-establishes on foreground
- "Connected to iPhone" indicator shows active sync status

## Sync Protocol

### Initial Sync

1. Both peers exchange Y.Doc state vectors (compact summary of what each has)
2. Each peer computes missing updates and sends them
3. Y.Doc merges updates automatically (CRDT)
4. Both peers now have identical state

### Ongoing Sync

- Y.Doc emits 'update' events on any local change
- Updates broadcast immediately to all connected peers
- Received updates apply to local Y.Doc automatically

### Message Format

```typescript
type SyncMessage =
  | { type: 'sync-step-1', stateVector: Uint8Array }
  | { type: 'sync-step-2', update: Uint8Array }
  | { type: 'update', update: Uint8Array }
  | { type: 'awareness', state: AwarenessState }
```

### Conflict Resolution

Yjs CRDTs merge automatically without data loss. For concurrent edits:
- Array items (plantings, areas): both additions kept
- Text fields: character-level merge
- Scalar fields: last-write-wins by Lamport timestamp

After sync, toast notification: "Synced with iPhone - 3 changes"

## Security Model

### MVP Security (Phase 1-2)

- Ed25519 keypairs for device identity
- QR pairing with 6-digit out-of-band verification
- WebRTC DTLS encryption for data in transit
- Same-network requirement adds physical security layer

### Deferred to Future Phases

- Application-layer encryption (XSalsa20-Poly1305)
- Session rekeying (24h / 1000 messages)
- Device revocation broadcast
- Cross-network sync

## UI Components

### Settings > Devices

- Current device name (editable)
- Paired devices list with last-seen timestamps
- "Add Device" button
- Remove action per device

### Pairing Modal

- Tab 1: "Show QR Code" - displays QR + 6-digit code
- Tab 2: "Scan QR Code" - camera viewfinder
- Success confirmation state

### Sync Status Indicator

Small icon in header/footer:
- Gray dot: No peers nearby
- Pulsing blue: Connecting...
- Green dot: Connected to [device]
- Green check (momentary): Just synced

### Sync Toast

- "Synced with iPhone · 3 changes"
- Auto-dismisses after 3 seconds
- Bottom of screen, non-blocking

## Dependencies

```
yjs: ^13.6.0           # CRDT core
y-indexeddb: ^9.0.0    # Persistence provider
tweetnacl: ^1.0.3      # Ed25519 keypairs
tweetnacl-util: ^0.15  # Base64 encoding for keys
qrcode.react: ^4.2.0   # QR code display
html5-qrcode: ^2.3.8   # QR code scanning (cross-browser)
peerjs: ^1.5.4         # WebRTC signaling
```

## Testing Strategy

### Unit Tests (Vitest)

- Yjs ↔ AllotmentData conversion
- Device identity generation
- QR code encoding/decoding
- Sync message serialization

### Integration Tests (Vitest)

- Y.Doc persistence to IndexedDB
- Migration from localStorage to Y.Doc
- Multi-tab sync via BroadcastChannel
- useSync hook state transitions

### E2E Tests (Playwright)

- Pairing flow UI (mocked camera)
- Sync status indicator states
- Toast notifications
- Device management

### Manual Testing

- Two physical devices on same WiFi
- iPhone↔MacBook, Android↔Windows combinations
- Offline edit → reconnect → merge scenarios

## Implementation Phases

### Phase 1: CRDT Foundation (Week 1)

1. Add Yjs and y-indexeddb dependencies
2. Create Y.Doc schema matching AllotmentData
3. Build conversion functions (AllotmentData ↔ Y.Doc)
4. Implement migration from localStorage
5. Update useAllotment to read/write via Y.Doc
6. Multi-tab sync via BroadcastChannel (free with y-indexeddb)

### Phase 2: Device Identity (Week 2)

1. Add tweetnacl dependency
2. Generate and store device keypair
3. Build device settings UI (name, identity)
4. Create paired devices storage
5. Implement QR generation and scanning
6. Build pairing flow modal

### Phase 3: P2P Connection (Week 3)

1. Research and select mDNS library
2. Implement service announcement and discovery
3. Build WebRTC connection manager
4. Add challenge-response authentication
5. Wire Yjs sync over DataChannel

### Phase 4: Polish (Week 4)

1. Sync status indicator
2. Toast notifications
3. Error handling and edge cases
4. Manual testing on physical devices
5. Documentation and ADR

## Resolved Questions

1. **mDNS browser support**: RESOLVED - Browsers don't have mDNS APIs. We use PeerJS signaling server instead, which works across all browsers and networks.

2. **QR scanning on iOS Safari**: RESOLVED - Switched from @yudiel/react-qr-scanner (uses BarcodeDetector API, not supported on iOS) to html5-qrcode (JavaScript-based decoding, works everywhere).

## Open Questions

1. **PWA background limits**: iOS aggressively suspends PWA WebRTC. Acceptable for MVP but document the limitation.

2. **IndexedDB quotas**: Large allotment histories could hit storage limits. May need pruning strategy for old Yjs updates.

3. **PeerJS server availability**: Currently using free public server. May want to self-host peerjs-server for reliability.

## Future Enhancements

- Self-hosted peerjs-server for independence
- libp2p DHT for fully decentralized discovery
- Relay server for offline message queuing
- Friend sharing with separate Yjs documents
- Selective sync (share only specific beds/seasons)
