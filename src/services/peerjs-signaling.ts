import Peer, { DataConnection } from 'peerjs'
import { EventEmitter } from 'events'
import { getTruncatedPublicKey, isPairedDevice, updateDeviceLastSeen, getPairedDevices } from './device-identity'
import { logger } from '@/lib/logger'

interface PeerJSConfig {
  publicKey: string
  privateKey: string
  deviceName: string
}

interface AuthMessage {
  type: 'auth-challenge' | 'auth-response'
  challenge?: string
  signature?: string
  publicKey?: string
}

interface SyncMessage {
  type: 'sync'
  data: number[]
}

type PeerMessage = AuthMessage | SyncMessage | { type: 'ping' } | { type: 'pong' }

export class PeerJSSignaling extends EventEmitter {
  private peer: Peer | null = null
  private config: PeerJSConfig
  private connections = new Map<string, DataConnection>()
  private authenticatedPeers = new Set<string>()
  private pendingChallenges = new Map<string, string>()
  private reconnectTimeout: NodeJS.Timeout | null = null
  private isDestroyed = false

  constructor(config: PeerJSConfig) {
    super()
    this.config = config
  }

  async start(): Promise<void> {
    if (this.peer) return
    this.isDestroyed = false

    const peerId = this.getPeerId()
    logger.info('Starting PeerJS signaling', { peerId: peerId.substring(0, 16) })

    return new Promise((resolve, reject) => {
      this.peer = new Peer(peerId, {
        debug: 0, // Minimal logging
      })

      this.peer.on('open', (id) => {
        logger.info('Connected to PeerJS server', { peerId: id.substring(0, 16) })
        this.emit('connected')
        this.connectToPairedDevices()
        resolve()
      })

      this.peer.on('connection', (conn) => {
        this.handleIncomingConnection(conn)
      })

      this.peer.on('error', (err) => {
        logger.error('PeerJS error', { error: err.type, message: err.message })
        this.emit('error', err)
        if (err.type === 'unavailable-id') {
          // Our peer ID is taken - this shouldn't happen with public keys
          reject(err)
        } else if (err.type === 'network' || err.type === 'server-error') {
          this.scheduleReconnect()
        }
      })

      this.peer.on('disconnected', () => {
        logger.warn('Disconnected from PeerJS server')
        this.emit('disconnected')
        this.scheduleReconnect()
      })

      this.peer.on('close', () => {
        logger.info('PeerJS connection closed')
        this.emit('closed')
      })

      // Timeout for initial connection
      setTimeout(() => {
        if (!this.peer?.open) {
          reject(new Error('PeerJS connection timeout'))
        }
      }, 10000)
    })
  }

  stop(): void {
    this.isDestroyed = true
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    this.connections.forEach(conn => conn.close())
    this.connections.clear()
    this.authenticatedPeers.clear()
    this.peer?.destroy()
    this.peer = null
    logger.info('PeerJS signaling stopped')
  }

  private getPeerId(): string {
    // Use a hash of the public key as peer ID (PeerJS has character restrictions)
    const key = this.config.publicKey
    // Simple hash - take chunks of the base64 key and create alphanumeric ID
    return 'bwp_' + key.replace(/[^a-zA-Z0-9]/g, '').substring(0, 32)
  }

  private getPeerIdForPublicKey(publicKey: string): string {
    return 'bwp_' + publicKey.replace(/[^a-zA-Z0-9]/g, '').substring(0, 32)
  }

  private scheduleReconnect(): void {
    if (this.isDestroyed || this.reconnectTimeout) return

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null
      if (!this.isDestroyed && !this.peer?.open) {
        logger.info('Attempting to reconnect to PeerJS')
        this.peer?.destroy()
        this.peer = null
        this.start().catch(err => {
          logger.error('Reconnect failed', { error: err })
        })
      }
    }, 5000)
  }

  private connectToPairedDevices(): void {
    const pairedDevices = getPairedDevices()
    for (const device of pairedDevices) {
      this.connectToPeer(device.publicKey)
    }
  }

  connectToPeer(publicKey: string): void {
    if (!this.peer?.open) {
      logger.warn('Cannot connect - PeerJS not ready')
      return
    }

    const peerId = this.getPeerIdForPublicKey(publicKey)

    if (this.connections.has(publicKey)) {
      logger.debug('Already connected to peer', { peerId: peerId.substring(0, 16) })
      return
    }

    logger.info('Connecting to peer', { peerId: peerId.substring(0, 16) })
    const conn = this.peer.connect(peerId, { reliable: true })
    this.setupConnection(conn, publicKey)
  }

  private handleIncomingConnection(conn: DataConnection): void {
    // Extract public key from peer ID
    const peerPublicKey = this.findPublicKeyForPeerId(conn.peer)

    if (!peerPublicKey || !isPairedDevice(peerPublicKey)) {
      logger.warn('Rejecting connection from unpaired peer', { peerId: conn.peer.substring(0, 16) })
      conn.close()
      return
    }

    logger.info('Incoming connection from paired peer', { peerId: conn.peer.substring(0, 16) })
    this.setupConnection(conn, peerPublicKey)
  }

  private findPublicKeyForPeerId(peerId: string): string | null {
    const pairedDevices = getPairedDevices()
    for (const device of pairedDevices) {
      if (this.getPeerIdForPublicKey(device.publicKey) === peerId) {
        return device.publicKey
      }
    }
    return null
  }

  private setupConnection(conn: DataConnection, publicKey: string): void {
    conn.on('open', () => {
      logger.info('Connection opened', { peer: getTruncatedPublicKey(publicKey) })
      this.connections.set(publicKey, conn)
      this.emit('peer-connected', publicKey)

      // Initiate authentication
      this.sendAuthChallenge(publicKey)
    })

    conn.on('data', (data) => {
      this.handleMessage(publicKey, data as PeerMessage)
    })

    conn.on('close', () => {
      logger.info('Connection closed', { peer: getTruncatedPublicKey(publicKey) })
      this.connections.delete(publicKey)
      this.authenticatedPeers.delete(publicKey)
      this.emit('peer-disconnected', publicKey)
    })

    conn.on('error', (err) => {
      logger.error('Connection error', { peer: getTruncatedPublicKey(publicKey), error: err })
    })
  }

  private sendAuthChallenge(publicKey: string): void {
    const challenge = crypto.randomUUID()
    this.pendingChallenges.set(publicKey, challenge)

    this.sendToPeer(publicKey, {
      type: 'auth-challenge',
      challenge
    })
  }

  private async handleMessage(publicKey: string, message: PeerMessage): Promise<void> {
    switch (message.type) {
      case 'auth-challenge':
        await this.handleAuthChallenge(publicKey, message.challenge!)
        break
      case 'auth-response':
        this.handleAuthResponse(publicKey, message)
        break
      case 'sync':
        if (this.authenticatedPeers.has(publicKey)) {
          this.emit('sync-message', { publicKey, data: new Uint8Array(message.data) })
        } else {
          logger.warn('Ignoring sync from unauthenticated peer')
        }
        break
      case 'ping':
        this.sendToPeer(publicKey, { type: 'pong' })
        break
      case 'pong':
        // Connection is alive
        break
    }
  }

  private async handleAuthChallenge(publicKey: string, challenge: string): Promise<void> {
    // Sign the challenge with our private key
    const { signChallenge } = await import('./device-identity')
    const signature = signChallenge(challenge, this.config.privateKey)

    this.sendToPeer(publicKey, {
      type: 'auth-response',
      challenge,
      signature,
      publicKey: this.config.publicKey
    })
  }

  private handleAuthResponse(peerPublicKey: string, message: AuthMessage): void {
    const expectedChallenge = this.pendingChallenges.get(peerPublicKey)

    if (!expectedChallenge || message.challenge !== expectedChallenge) {
      logger.warn('Invalid auth response - challenge mismatch')
      return
    }

    this.pendingChallenges.delete(peerPublicKey)

    // Verify signature
    import('./device-identity').then(({ verifySignature }) => {
      const valid = verifySignature(message.challenge!, message.signature!, peerPublicKey)

      if (valid) {
        this.authenticatedPeers.add(peerPublicKey)
        updateDeviceLastSeen(peerPublicKey)
        this.emit('peer-authenticated', peerPublicKey)
        logger.info('Peer authenticated', { peer: getTruncatedPublicKey(peerPublicKey) })
      } else {
        logger.warn('Peer authentication failed - invalid signature')
        this.connections.get(peerPublicKey)?.close()
      }
    })
  }

  sendToPeer(publicKey: string, message: PeerMessage): boolean {
    const conn = this.connections.get(publicKey)
    if (!conn?.open) {
      return false
    }
    conn.send(message)
    return true
  }

  sendSyncMessage(publicKey: string, data: Uint8Array): boolean {
    if (!this.authenticatedPeers.has(publicKey)) {
      logger.warn('Cannot send sync - peer not authenticated')
      return false
    }
    return this.sendToPeer(publicKey, { type: 'sync', data: Array.from(data) })
  }

  broadcastSyncMessage(data: Uint8Array): void {
    for (const publicKey of this.authenticatedPeers) {
      this.sendSyncMessage(publicKey, data)
    }
  }

  isConnected(): boolean {
    return this.peer?.open ?? false
  }

  isPeerConnected(publicKey: string): boolean {
    return this.connections.has(publicKey) && this.connections.get(publicKey)?.open === true
  }

  isPeerAuthenticated(publicKey: string): boolean {
    return this.authenticatedPeers.has(publicKey)
  }

  getConnectedPeers(): string[] {
    return Array.from(this.connections.keys())
  }

  getAuthenticatedPeers(): string[] {
    return Array.from(this.authenticatedPeers)
  }
}
