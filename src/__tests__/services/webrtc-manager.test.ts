import { describe, it, expect, vi, beforeEach } from 'vitest'

class MockRTCPeerConnection {
  localDescription: RTCSessionDescription | null = null
  onicecandidate: ((event: { candidate: RTCIceCandidate | null }) => void) | null = null
  ondatachannel: ((event: { channel: RTCDataChannel }) => void) | null = null

  createDataChannel = vi.fn().mockReturnValue({
    onopen: null,
    onmessage: null,
    send: vi.fn(),
    close: vi.fn(),
    readyState: 'open'
  })

  createOffer = vi.fn().mockResolvedValue({ type: 'offer', sdp: 'mock-offer' })
  createAnswer = vi.fn().mockResolvedValue({ type: 'answer', sdp: 'mock-answer' })
  setLocalDescription = vi.fn().mockResolvedValue(undefined)
  setRemoteDescription = vi.fn().mockResolvedValue(undefined)
  addIceCandidate = vi.fn().mockResolvedValue(undefined)
  close = vi.fn()
}

vi.stubGlobal('RTCPeerConnection', MockRTCPeerConnection)

describe('WebRTC Manager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates offer for initiating connection', async () => {
    const { WebRTCManager } = await import('@/services/webrtc-manager')
    const manager = new WebRTCManager()
    const offer = await manager.createOffer()

    expect(offer.type).toBe('offer')
    expect(offer.sdp).toBeDefined()
  })

  it('creates answer in response to offer', async () => {
    const { WebRTCManager } = await import('@/services/webrtc-manager')
    const manager = new WebRTCManager()
    const answer = await manager.createAnswer({ type: 'offer', sdp: 'remote-offer' })

    expect(answer.type).toBe('answer')
  })

  it('establishes data channel', async () => {
    const { WebRTCManager } = await import('@/services/webrtc-manager')
    const manager = new WebRTCManager()
    await manager.createOffer()

    expect(manager.hasDataChannel()).toBe(true)
  })
})
