import { describe, it, expect, vi } from 'vitest'

describe('Signaling Coordinator', () => {
  it('initiates connection when paired peer discovered', async () => {
    const { SignalingCoordinator } = await import('@/services/signaling-coordinator')

    const coordinator = new SignalingCoordinator({
      publicKey: 'my-public-key-full-length',
      privateKey: 'my-private-key',
      deviceName: 'My Device',
      pairedDevices: [{
        publicKey: 'peer-public-key-full-length-base64',
        deviceName: 'Peer',
        pairedAt: new Date().toISOString()
      }]
    })

    const onConnect = vi.fn()
    coordinator.on('peer-connecting', onConnect)

    // Simulate discovering a paired peer (truncated key matches first 16 chars)
    coordinator.handlePeerDiscovered({
      truncatedKey: 'peer-public-key-',  // First 16 chars of full key above
      deviceName: 'Peer',
      timestamp: Date.now()
    })

    expect(onConnect).toHaveBeenCalled()
  })

  it('ignores unpaired peers', async () => {
    const { SignalingCoordinator } = await import('@/services/signaling-coordinator')

    const coordinator = new SignalingCoordinator({
      publicKey: 'my-public-key',
      privateKey: 'my-private-key',
      deviceName: 'My Device',
      pairedDevices: []
    })

    const onConnect = vi.fn()
    coordinator.on('peer-connecting', onConnect)

    coordinator.handlePeerDiscovered({
      truncatedKey: 'unknown-peer',
      deviceName: 'Unknown',
      timestamp: Date.now()
    })

    expect(onConnect).not.toHaveBeenCalled()
  })
})
