import { EventEmitter } from 'events'
import { LocalDiscovery, DiscoveredPeer } from './local-discovery'
import { WebRTCManager } from './webrtc-manager'
import { signChallenge, verifySignature, getTruncatedPublicKey, updateDeviceLastSeen } from './device-identity'
import type { PairedDevice } from '@/types/sync'
import { logger } from '@/lib/logger'

interface CoordinatorConfig {
  publicKey: string
  privateKey: string
  deviceName: string
  pairedDevices: PairedDevice[]
}

export class SignalingCoordinator extends EventEmitter {
  private config: CoordinatorConfig
  private discovery: LocalDiscovery | null = null
  private connections = new Map<string, WebRTCManager>()

  constructor(config: CoordinatorConfig) {
    super()
    this.config = config
  }

  start(): void {
    this.discovery = new LocalDiscovery(this.config.publicKey, this.config.deviceName)

    this.discovery.on('peer-discovered', (peer: DiscoveredPeer) => {
      this.handlePeerDiscovered(peer)
    })

    this.discovery.on('peer-lost', (peer: DiscoveredPeer) => {
      this.handlePeerLost(peer)
    })

    this.discovery.startAnnouncing()
    logger.info('Signaling coordinator started')
  }

  stop(): void {
    this.discovery?.stopAnnouncing()
    this.connections.forEach(conn => conn.close())
    this.connections.clear()
    logger.info('Signaling coordinator stopped')
  }

  handlePeerDiscovered(peer: DiscoveredPeer): void {
    // Check if this is a paired device
    const pairedDevice = this.config.pairedDevices.find(
      d => getTruncatedPublicKey(d.publicKey) === peer.truncatedKey
    )

    if (!pairedDevice) {
      logger.debug('Ignoring unpaired peer', { truncatedKey: peer.truncatedKey })
      return
    }

    // Already connected?
    if (this.connections.has(pairedDevice.publicKey)) {
      return
    }

    this.emit('peer-connecting', pairedDevice)
    this.initiateConnection(pairedDevice)
  }

  private handlePeerLost(peer: DiscoveredPeer): void {
    const pairedDevice = this.config.pairedDevices.find(
      d => getTruncatedPublicKey(d.publicKey) === peer.truncatedKey
    )

    if (pairedDevice) {
      const connection = this.connections.get(pairedDevice.publicKey)
      if (connection) {
        connection.close()
        this.connections.delete(pairedDevice.publicKey)
        this.emit('peer-disconnected', pairedDevice)
      }
    }
  }

  private async initiateConnection(peer: PairedDevice): Promise<void> {
    const manager = new WebRTCManager()
    this.connections.set(peer.publicKey, manager)

    manager.on('channel-open', () => {
      this.authenticatePeer(peer, manager)
    })

    manager.on('message', (data: string) => {
      this.handleMessage(peer, data)
    })

    manager.on('channel-close', () => {
      this.connections.delete(peer.publicKey)
      this.emit('peer-disconnected', peer)
    })

    try {
      const offer = await manager.createOffer()
      // In BroadcastChannel-based discovery, we can send the offer via broadcast
      this.emit('signaling-offer', { toPeer: peer, offer })
    } catch (error) {
      logger.error('Failed to create offer', { error })
      this.connections.delete(peer.publicKey)
    }
  }

  private authenticatePeer(_peer: PairedDevice, manager: WebRTCManager): void {
    const challenge = crypto.randomUUID()
    manager.send(JSON.stringify({ type: 'auth-challenge', challenge }))
  }

  private handleMessage(peer: PairedDevice, data: string): void {
    try {
      const message = JSON.parse(data)

      switch (message.type) {
        case 'auth-challenge':
          this.handleAuthChallenge(peer, message.challenge)
          break
        case 'auth-response':
          this.handleAuthResponse(peer, message)
          break
        case 'sync':
          this.emit('sync-message', { peer, data: message.data })
          break
        default:
          logger.warn('Unknown message type', { type: message.type })
      }
    } catch (error) {
      logger.error('Failed to handle message', { error })
    }
  }

  private handleAuthChallenge(peer: PairedDevice, challenge: string): void {
    const signature = signChallenge(challenge, this.config.privateKey)
    const manager = this.connections.get(peer.publicKey)
    manager?.send(JSON.stringify({
      type: 'auth-response',
      challenge,
      signature,
      publicKey: this.config.publicKey
    }))
  }

  private handleAuthResponse(peer: PairedDevice, message: { challenge: string; signature: string; publicKey: string }): void {
    const valid = verifySignature(message.challenge, message.signature, peer.publicKey)

    if (valid) {
      updateDeviceLastSeen(peer.publicKey)
      this.emit('peer-authenticated', peer)
      logger.info('Peer authenticated', { deviceName: peer.deviceName })
    } else {
      logger.warn('Peer authentication failed', { deviceName: peer.deviceName })
      const manager = this.connections.get(peer.publicKey)
      manager?.close()
      this.connections.delete(peer.publicKey)
    }
  }

  sendSyncMessage(peerPublicKey: string, data: Uint8Array): void {
    const manager = this.connections.get(peerPublicKey)
    if (!manager?.isConnected()) {
      logger.warn('Cannot send - peer not connected')
      return
    }
    manager.send(JSON.stringify({ type: 'sync', data: Array.from(data) }))
  }

  getConnectedPeers(): PairedDevice[] {
    return this.config.pairedDevices.filter(
      d => this.connections.get(d.publicKey)?.isConnected()
    )
  }
}
