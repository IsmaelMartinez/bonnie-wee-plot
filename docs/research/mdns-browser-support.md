# mDNS Browser Support Research

Date: 2026-01-29

## Summary

Browsers do not natively support mDNS/Bonjour for service discovery due to security and privacy concerns. Local network scanning capabilities would enable fingerprinting of devices and network topology, which browsers explicitly prevent. For P2P sync in a web application, alternative approaches are required that either avoid device discovery entirely (manual pairing) or work within the constraints of browser APIs.

## Browser Capabilities

### Native mDNS

No browser provides native mDNS or Bonjour discovery capabilities. This is an intentional security boundary. Web applications cannot scan the local network for devices or services without explicit user interaction. The Web NFC API and Web Bluetooth API require user gestures for similar reasons, and even those are limited to specific device types.

### Workarounds

#### BroadcastChannel API

The BroadcastChannel API enables communication between browsing contexts (tabs, windows, iframes) that share the same origin. This is useful for same-device multi-tab synchronization but does not cross network boundaries.

**Capabilities:**
- Send messages between tabs on the same device
- No network involvement, purely in-browser communication
- Works reliably across all modern browsers (Chrome 54+, Firefox 38+, Safari 15.4+)
- Does not require Service Worker
- Synchronous message delivery

**Limitations:**
- Same-origin only (cannot communicate with other devices)
- Not suitable for P2P device discovery
- Tabs must be open simultaneously

**Use case for our app:** Excellent for keeping multiple open tabs of Bonnie Wee Plot synchronized on the same device without polling localStorage.

#### WebRTC Local Discovery

WebRTC's ICE (Interactive Connectivity Establishment) process reveals local network IP addresses through ICE candidates. However, this is not a discovery mechanism for finding other devices.

**Capabilities:**
- Can establish P2P connections between browsers
- Works across NAT with STUN/TURN servers
- Can reveal local network IPs during connection establishment

**Limitations:**
- No built-in discovery mechanism for finding peers
- Requires signaling server or out-of-band pairing method
- Privacy concerns: browsers increasingly restrict local IP exposure
- mDNS candidates (`.local` addresses) are filtered by most browsers for privacy

**Modern browser restrictions:**
- Chrome/Edge: Local IPs hidden by default unless explicitly allowed via mDNS permission
- Firefox: `media.peerconnection.ice.default_address_only` preference restricts IPs
- Safari: Similar privacy restrictions

**Use case for our app:** After manual pairing (QR code, pairing code), WebRTC can establish the actual data channel for sync. Cannot be used for automatic device discovery.

#### Service Workers with Background Sync

Service Workers can run in the background and use the Background Sync API, but this does not provide local network discovery capabilities.

**Capabilities:**
- Can defer network requests until connectivity is available
- Can run periodic background sync (with Periodic Background Sync API)
- Can intercept fetch requests

**Limitations:**
- No access to local network discovery
- Still requires known peer addresses
- Subject to browser suspension policies
- Periodic sync requires user engagement and is throttled

**Use case for our app:** Could potentially maintain WebRTC connections in background, but unreliable due to suspension policies.

### PWA Limitations

#### iOS

iOS has the most restrictive PWA background execution policies:

- Service Workers are aggressively suspended when the app is not in the foreground
- Background Sync and Periodic Background Sync are not supported
- WebRTC connections are terminated when app is backgrounded
- No push notifications for web apps (as of iOS 17, push notifications are available but still limited)
- Apps removed from memory quickly under pressure

**Impact on P2P sync:** Sync only works reliably when the app is open and foregrounded. Background sync is not practical on iOS.

#### Android

Android is more permissive but still has limitations:

- Service Workers can run in background with periodic sync
- WebRTC connections may be maintained briefly in background
- Better support for Background Sync API
- Push notifications work via FCM
- Still subject to battery optimization and app suspension

**Impact on P2P sync:** Background sync is more feasible but not guaranteed. Android's Doze mode and app standby can still suspend PWAs.

## Additional Considerations

### WebSocket Limitations

WebSockets require a known server address and cannot be used for peer discovery. They also cannot bind to local ports to listen for incoming connections. Web applications cannot act as servers in the traditional sense.

### WebTransport

WebTransport (successor to WebRTC data channels) requires a known server address supporting HTTP/3 and QUIC. It does not provide local network discovery and cannot be used for serverless P2P without a signaling mechanism.

### Local Network Access API

There is a proposal for a "Local Network Access" API that would require explicit user permission for web apps to access local network resources. This is still in early stages and not implemented in any browser. Even if implemented, it would likely require per-device user permission rather than automatic discovery.

## Recommendation

For P2P sync on local network without a central server, the following approach is recommended:

### Phase 1: Manual Pairing

Use explicit pairing to establish initial connection between devices:

1. **QR Code Pairing**: One device generates a QR code containing:
   - Temporary pairing code or session ID
   - Optional: WebRTC offer SDP
   - Expiry timestamp

2. **Pairing Code Entry**: Alternative to QR for accessibility:
   - Generate short numeric or alphanumeric code
   - Display on one device, enter on another
   - Codes expire after short timeout (5 minutes)

3. **Initial Handshake**: After pairing:
   - Exchange device identifiers (UUIDs)
   - Exchange WebRTC connection info
   - Store peer information in localStorage

### Phase 2: WebRTC Data Channel

After pairing, use WebRTC for actual data sync:

1. **Connection Establishment**: Use stored peer info to reconnect on app launch
2. **Data Channel**: Send sync messages over WebRTC data channel
3. **Fallback**: If WebRTC fails, can use shared cloud sync (future enhancement)

### Phase 3: Multi-Tab Coordination

Use BroadcastChannel for same-device coordination:

1. **Tab Leader Election**: One tab maintains WebRTC connections
2. **Broadcast Updates**: Leader broadcasts received updates to other tabs
3. **Handoff**: Leader role transfers if tab closes

### Constraints Accepted

This approach requires:
- App must be open on both devices for sync to occur
- Users must manually pair devices initially
- No automatic discovery of nearby devices
- iOS devices require app to be foregrounded

These constraints are acceptable for a gardening PWA where:
- Users typically interact with app deliberately (not expecting background sync)
- Manual pairing is one-time setup (acceptable UX cost)
- Real-time sync while planning is valuable even if not automatic
- Can show clear "Connected" / "Not connected" status

### Alternative: Hybrid Approach

For users who want automatic sync without keeping apps open:

1. **Optional Cloud Relay**: Users can opt-in to a simple relay server
2. **End-to-End Encryption**: Data encrypted client-side before relay
3. **Relay Only Forwards**: Server cannot read data, only routes messages
4. **Fallback Only**: Direct P2P preferred when both devices online

This hybrid approach gives users choice between:
- Pure P2P (privacy-first, requires manual pairing and simultaneous usage)
- Relay-assisted (convenience, still encrypted, works with delayed sync)

## Conclusion

mDNS browser support is not available and unlikely to become available due to legitimate privacy concerns. The recommended approach avoids discovery entirely by using explicit pairing followed by WebRTC data channels. BroadcastChannel handles same-device multi-tab sync. This provides a practical P2P sync solution within browser constraints while maintaining user privacy and security.
