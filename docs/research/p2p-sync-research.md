# P2P Data Synchronization Research

Date: 2026-01-19

## Objective

Evaluate peer-to-peer synchronization technologies for browser-only localStorage data sharing between friends. Initial implementation will be serverless (no signaling server), with a lightweight relay server planned for future phases to support offline sync.

## Technology Evaluation

### CRDTs (Conflict-Free Replicated Data Types)

CRDTs are the foundational technology enabling automatic conflict resolution without central authority.

**Yjs** (Recommended)
- Most mature implementation with 900k+ weekly npm downloads
- Exposes Y.Map, Y.Array, Y.Text for automatic sync
- Fastest CRDT implementation for browser environments
- Built-in awareness protocol for presence
- Mature ecosystem with excellent documentation

**Automerge 3.0**
- Revolutionary memory improvements (10x reduction vs 2.0)
- Rust/WASM core with JavaScript bindings
- Full editing history for audit trails
- Better for compliance requirements

**Loro**
- Newer, based on Replayable Event Graph
- Snapshot feature for faster loading
- Best for advanced data structures

### WebRTC for Peer-to-Peer Transfer

WebRTC enables direct browser-to-browser connections with encrypted data channels (DTLS-based).

**Challenge**: Traditional WebRTC requires a signaling server for SDP/ICE exchange.

**Serverless Solutions**:
- Manual peer ID exchange (QR codes, text sharing)
- Browser BroadcastChannel for same-device multi-tab sync

**PeerJS**: Simplifies WebRTC with plug-and-play API, but relies on their signaling server by default.

### Local-First Libraries

**TinyBase** (Recommended for lightweight approach)
- 5.4-12.1kB reactive data store
- Native CRDT support
- Works with localStorage, IndexedDB, SQLite
- Custom sync protocols over WebSockets or BroadcastChannel

**ElectricSQL**
- Bi-directional sync between PostgreSQL and browser SQLite
- Requires backend Sync Service (not serverless)

**Gun.js**
- Fully decentralized graph database
- Offline-first with eventual consistency
- No central discovery needed
- Higher complexity

## Recommended Approach

### Phase 1: CRDT Foundation
Integrate Yjs Y.Map into `useAllotment` hook:
- Replace localStorage writes with Yjs persistence
- Y.Map structure mirrors AllotmentData schema naturally
- Automatic conflict resolution on sync
- This foundation works identically whether updates arrive in real-time or hours later

### Phase 2: Direct P2P (Serverless)
Pure peer-to-peer with no server dependency:

1. **Cryptographic Identity**
   - Each user generates keypair (stored locally)
   - Public key serves as peer ID

2. **Manual Peer Discovery**
   - Share peer IDs via QR codes, text, email
   - Out-of-band exchange required

3. **Direct WebRTC Connection**
   - Once both peers have each other's ID, connect directly
   - No central discovery needed

**Limitation**: Both peers must be online simultaneously. Good for real-time collaboration (e.g., both in your plots on a Sunday morning).

### Phase 3: Enhanced Export/Import
- QR code generation for data sharing
- Encrypted data bundles
- Selective sync (share only specific beds/seasons)

### Phase 4: Relay Server (Future)
Add a lightweight relay server to support offline sync:

1. **Store-and-Forward**
   - Server holds encrypted CRDT update messages temporarily
   - Forwards them when the recipient comes online
   - Server sees only opaque encrypted blobs, zero knowledge of garden data

2. **Simplified Signaling**
   - No more manual QR code exchange for peer discovery
   - Server facilitates WebRTC connection setup
   - Still end-to-end encrypted for actual data

3. **Implementation**
   - Tiny server (few hundred lines of code)
   - Can run on free tier (Fly.io, Railway, Cloudflare Workers)
   - Optional - direct P2P still works without it

**Why wait for Phase 4?**
- Start simple, validate CRDT sync works correctly
- Add server when "both online" limitation becomes painful
- CRDTs handle both scenarios identically - merging works the same way

## Sync Patterns

### Phase 2: Direct P2P (Both Online Required)

```
User A                          User B
  |                               |
  | Generate keypair              | Generate keypair
  |                               |
  | Share public key (QR/text) -->|
  |<-- Share public key (QR/text) |
  |                               |
  | WebRTC direct connection      |
  |<============================>|
  |                               |
  | Yjs sync messages             |
  |<============================>|
```

### Phase 4: Relay Server (Offline Support)

```
User A                    Relay Server                   User B
  |                            |                            |
  | Send encrypted update ---->|                            |
  |                            | Store message              |
  |                            |                            |
  |                            |    (User B comes online)   |
  |                            |                            |
  |                            |<---- Request updates       |
  |                            | Forward encrypted update ->|
  |                            |                            |
  |<========= Direct P2P (when both online) ===============>|
```

The relay server only handles encrypted blobs - it cannot read garden data.

## Implementation Scope

### Phase 1-2 POC (3-4 weeks)
1. Yjs Y.Map integration with useAllotment
2. Keypair generation and storage
3. QR code generation for peer ID sharing
4. WebRTC connector (manual peer ID)
5. Multi-peer concurrent editing test

### Phase 4 Relay Server (Future, 1-2 weeks)
1. Simple WebSocket server for message relay
2. Message queue with TTL (e.g., 7 days)
3. Authentication via public key signatures
4. Optional: signaling endpoint for WebRTC setup

### Required Dependencies (Phase 1-2)
```
yjs: ~13.6.0 (CRDT core)
lib0: ~0.2.x (Yjs utility library)
tweetnacl: ~1.0.x (encryption)
qrcode: ~1.5.x (QR generation)
```

### Additional Dependencies (Phase 4)
```
# Server-side (Node.js or Deno)
ws: ~8.x (WebSocket server)
# Or use Cloudflare Workers/Durable Objects for serverless
```

Note: PeerJS omitted for Phase 2 as it requires their signaling server. Phase 4 relay server could optionally provide signaling.

## Risks and Mitigations

### Technical Risks
- **Both Online Required (Phase 2)**: Direct P2P requires simultaneous online presence. Mitigation: Phase 4 relay server adds store-and-forward capability.
- **NAT Traversal**: Some users may fail to connect behind restrictive firewalls. Mitigation: Document limitations, suggest same-network testing first. Phase 4 server can provide TURN relay.
- **Data Size**: CRDT overhead grows with document size. Mitigation: Archive old seasons, lazy-load history.
- **WebRTC Complexity**: Direct WebRTC without helper library is complex. Mitigation: Start with same-device BroadcastChannel sync.

### Privacy Considerations
- XSS vulnerability exposes all localStorage data
- WebRTC may reveal IP addresses
- Friend trust model means trusting their devices

### Mitigations
- Strict Content Security Policy
- End-to-end encryption with libsodium.js
- Granular sharing controls (share only specific beds)
- Edit history and conflict markers

## Production Examples

- **Yjs**: Figma, Obsidian Sync, collaborative editors
- **WebRTC Data**: PeerChat, P2P collaboration tools
- **Local-First**: Logseq, Obsidian local mode

## Next Steps

### Immediate (Phase 1-2)
1. Create minimal Yjs POC with useAllotment hook
2. Test Y.Map structure with AllotmentData schema
3. Implement BroadcastChannel sync (same-device first)
4. Add keypair generation and QR sharing
5. Implement direct WebRTC connection

### Future (Phase 4)
6. Evaluate relay server hosting options (Cloudflare Workers vs Node.js)
7. Design message queue schema and TTL policies
8. Implement relay server with WebSocket endpoints
9. Add optional signaling for easier peer discovery

## References

- [Yjs Documentation](https://docs.yjs.dev/)
- [Automerge Blog](https://automerge.org/blog/)
- [WebRTC MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [Local-First Software](https://www.inkandswitch.com/essay/local-first/)
- [TinyBase](https://tinybase.org/)
