import { EventEmitter } from 'events'
import { getTruncatedPublicKey } from './device-identity'
import { logger } from '@/lib/logger'

export interface DiscoveredPeer {
  truncatedKey: string
  deviceName: string
  timestamp: number
}

export class LocalDiscovery extends EventEmitter {
  private publicKey: string
  private deviceName: string
  private truncatedKey: string
  private announcing = false
  private broadcastChannel: BroadcastChannel | null = null
  private announceInterval: NodeJS.Timeout | null = null
  private discoveredPeers = new Map<string, DiscoveredPeer>()

  private static readonly CHANNEL_NAME = 'bonnieplot-discovery'
  private static readonly ANNOUNCE_INTERVAL_MS = 5000
  private static readonly PEER_TIMEOUT_MS = 15000

  constructor(publicKey: string, deviceName: string) {
    super()
    this.publicKey = publicKey
    this.deviceName = deviceName
    this.truncatedKey = getTruncatedPublicKey(publicKey)
  }

  isAnnouncing(): boolean {
    return this.announcing
  }

  startAnnouncing(): void {
    if (this.announcing) return
    this.announcing = true

    if (typeof BroadcastChannel !== 'undefined') {
      this.broadcastChannel = new BroadcastChannel(LocalDiscovery.CHANNEL_NAME)
      this.broadcastChannel.onmessage = (event) => this.handleMessage(event.data)
    }

    this.announce()
    this.announceInterval = setInterval(() => this.announce(), LocalDiscovery.ANNOUNCE_INTERVAL_MS)
    setInterval(() => this.cleanupStalePeers(), LocalDiscovery.PEER_TIMEOUT_MS)

    logger.info('Started local discovery')
  }

  stopAnnouncing(): void {
    this.announcing = false
    if (this.announceInterval) {
      clearInterval(this.announceInterval)
      this.announceInterval = null
    }
    if (this.broadcastChannel) {
      this.broadcastChannel.close()
      this.broadcastChannel = null
    }
    logger.info('Stopped local discovery')
  }

  private announce(): void {
    const message = {
      type: 'announce',
      truncatedKey: this.truncatedKey,
      deviceName: this.deviceName,
      timestamp: Date.now()
    }
    this.broadcastChannel?.postMessage(message)
  }

  private handleMessage(data: unknown): void {
    if (!data || typeof data !== 'object') return
    const message = data as { type: string; truncatedKey: string; deviceName: string; timestamp: number }

    if (message.type !== 'announce') return
    if (message.truncatedKey === this.truncatedKey) return

    const peer: DiscoveredPeer = {
      truncatedKey: message.truncatedKey,
      deviceName: message.deviceName,
      timestamp: message.timestamp
    }

    const isNew = !this.discoveredPeers.has(peer.truncatedKey)
    this.discoveredPeers.set(peer.truncatedKey, peer)

    if (isNew) {
      this.emit('peer-discovered', peer)
      logger.info('Discovered peer', { deviceName: peer.deviceName })
    }
  }

  private cleanupStalePeers(): void {
    const now = Date.now()
    for (const [key, peer] of this.discoveredPeers) {
      if (now - peer.timestamp > LocalDiscovery.PEER_TIMEOUT_MS) {
        this.discoveredPeers.delete(key)
        this.emit('peer-lost', peer)
        logger.info('Lost peer', { deviceName: peer.deviceName })
      }
    }
  }

  getDiscoveredPeers(): DiscoveredPeer[] {
    return Array.from(this.discoveredPeers.values())
  }

  simulatePeerDiscovery(peer: Omit<DiscoveredPeer, 'timestamp'>): void {
    this.handleMessage({ type: 'announce', ...peer, timestamp: Date.now() })
  }
}
