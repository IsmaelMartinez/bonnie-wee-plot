import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Local Discovery Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('announces device presence', async () => {
    const { LocalDiscovery } = await import('@/services/local-discovery')
    const discovery = new LocalDiscovery('test-public-key', 'Test Device')

    expect(discovery.isAnnouncing()).toBe(false)
    discovery.startAnnouncing()
    expect(discovery.isAnnouncing()).toBe(true)
    discovery.stopAnnouncing()
    expect(discovery.isAnnouncing()).toBe(false)
  })

  it('emits event when peer discovered', async () => {
    const { LocalDiscovery } = await import('@/services/local-discovery')
    const discovery = new LocalDiscovery('my-key', 'My Device')
    const onDiscover = vi.fn()

    discovery.on('peer-discovered', onDiscover)
    discovery.simulatePeerDiscovery({
      truncatedKey: 'peer-key-truncat',
      deviceName: 'Peer Device'
    })

    expect(onDiscover).toHaveBeenCalledWith(expect.objectContaining({
      truncatedKey: 'peer-key-truncat',
      deviceName: 'Peer Device'
    }))
  })
})
