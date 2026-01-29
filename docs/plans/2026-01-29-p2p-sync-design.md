# P2P Sync Design

Date: 2026-01-29
Status: Draft

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
│                    useSync hook (new)                    │
│         - Manages Yjs doc & peer connections            │
│         - Exposes sync status, paired devices           │
└─────────────────────────────────────────────────────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │   Yjs    │  │  mDNS    │  │ WebRTC   │
        │ Y.Doc    │  │ Discovery│  │ DataChan │
        └──────────┘  └──────────┘  └──────────┘
              │
              ▼
        ┌──────────┐
        │IndexedDB │
        │(persistence)│
        └──────────┘
```

The existing `useAllotment` API remains unchanged. Components don't need to know about sync. The new `useSync` hook manages Yjs documents, peer discovery via mDNS, and WebRTC connections.

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

### mDNS Discovery

Devices announce presence on local network:

```
Service Type: _bonnieplot._tcp.local
TXT Record: { pk: "<first 16 chars of public key>" }
```

The truncated public key lets devices filter to paired peers without exposing full identity.

### WebRTC Connection

When a paired device is discovered:

1. mDNS announces device presence with truncated public key
2. Listening device checks if truncated key matches any paired device
3. If matched, initiator creates WebRTC offer with full public key in metadata
4. Responder verifies full public key against paired list
5. Both sides sign a challenge-nonce to prove key ownership
6. WebRTC DataChannel established, Yjs sync begins

Configuration uses public STUN servers (Google, Cloudflare). No TURN server needed for local-network-only sync.

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
qrcode.react: ^3.1.0   # QR code display
@aspect-dev/mdns: ^x   # mDNS discovery (or alternative)
```

Note: mDNS library selection requires research - browser support varies. May need to evaluate `multicast-dns`, `bonjour-service`, or custom WebRTC-based discovery fallback.

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

## Open Questions

1. **mDNS browser support**: Need to validate mDNS works reliably in Safari/Chrome PWA contexts. May need fallback discovery mechanism.

2. **PWA background limits**: iOS aggressively suspends PWA WebRTC. Acceptable for MVP but document the limitation.

3. **IndexedDB quotas**: Large allotment histories could hit storage limits. May need pruning strategy for old Yjs updates.

## Future Enhancements

- libp2p DHT for cross-network discovery
- Relay server for offline message queuing
- Friend sharing with separate Yjs documents
- Selective sync (share only specific beds/seasons)
