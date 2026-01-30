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

interface FullStateSyncMessage {
  type: 'full-state-sync'
  data: string  // JSON stringified AllotmentData
  timestamp: number
}

type PeerMessage = AuthMessage | SyncMessage | FullStateSyncMessage | { type: 'ping' } | { type: 'pong' }

export class PeerJSSignaling extends EventEmitter {
  private peer: Peer | null = null
  private config: PeerJSConfig
  private connections = new Map<string, DataConnection>()
  private pendingConnections = new Set<string>() // Track connections being established
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
        debug: 2, // Show all logs including connection info
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun.cloudflare.com:3478' },
          ]
        }
      })

      logger.info('PeerJS instance created', { peerId, peerIdFull: peerId })

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
        } else if (err.type === 'peer-unavailable') {
          // The peer we tried to connect to isn't online yet
          // Extract peer ID from error message and clean up pendingConnections
          const match = err.message.match(/peer (\S+)/)
          if (match) {
            const failedPeerId = match[1]
            // Find and clean up the pending connection for this peer
            for (const publicKey of this.pendingConnections) {
              if (this.getPeerIdForPublicKey(publicKey) === failedPeerId) {
                logger.info('Cleaning up failed connection attempt', { peerId: failedPeerId })
                this.pendingConnections.delete(publicKey)
                break
              }
            }
          }
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
    this.pendingConnections.clear()
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
    logger.info('Connecting to paired devices', {
      count: pairedDevices.length,
      devices: pairedDevices.map(d => ({
        name: d.deviceName,
        peerId: this.getPeerIdForPublicKey(d.publicKey),
        publicKeyPrefix: d.publicKey.substring(0, 20)
      }))
    })
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

    // Check if we already have an established or pending connection
    if (this.connections.has(publicKey) || this.pendingConnections.has(publicKey)) {
      logger.debug('Already connected or connecting to peer', { peerId: peerId.substring(0, 16) })
      return
    }

    logger.info('Connecting to peer', { peerId, myPeerId: this.getPeerId() })
    this.pendingConnections.add(publicKey)
    const conn = this.peer.connect(peerId, { reliable: true, serialization: 'json' })
    logger.info('Connection object created', {
      connectionId: conn.connectionId,
      peer: conn.peer,
      type: conn.type,
      open: conn.open,
      metadata: conn.metadata
    })
    this.setupConnection(conn, publicKey)
  }

  private handleIncomingConnection(conn: DataConnection): void {
    logger.info('Incoming connection received', {
      incomingPeerId: conn.peer,
      myPeerId: this.getPeerId(),
      connectionId: conn.connectionId,
      open: conn.open
    })

    // Extract public key from peer ID
    const peerPublicKey = this.findPublicKeyForPeerId(conn.peer)

    if (!peerPublicKey || !isPairedDevice(peerPublicKey)) {
      logger.warn('Rejecting connection from unpaired peer', {
        peerId: conn.peer,
        foundPublicKey: !!peerPublicKey,
        isPaired: peerPublicKey ? isPairedDevice(peerPublicKey) : false
      })
      conn.close()
      return
    }

    // Check for existing connections
    const existingConn = this.connections.get(peerPublicKey)
    if (existingConn?.open) {
      // We have an active, open connection - reject the duplicate
      logger.info('Already have open connection to peer, closing duplicate incoming', { peerId: conn.peer })
      conn.close()
      return
    }

    // If we have a pending or failed outgoing connection, prefer the incoming one
    // This handles the race condition where both peers try to connect simultaneously
    if (this.pendingConnections.has(peerPublicKey)) {
      logger.info('Had pending outgoing connection, accepting incoming instead', { peerId: conn.peer })
      this.pendingConnections.delete(peerPublicKey)
      // Clean up any stale connection object
      if (existingConn) {
        existingConn.close()
        this.connections.delete(peerPublicKey)
      }
    }

    logger.info('Incoming connection from paired peer', { peerId: conn.peer.substring(0, 16) })
    this.pendingConnections.add(peerPublicKey)
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
    const truncatedKey = getTruncatedPublicKey(publicKey)
    const targetPeerId = this.getPeerIdForPublicKey(publicKey)
    logger.info('Setting up connection', {
      peer: truncatedKey,
      connectionId: conn.connectionId,
      alreadyOpen: conn.open,
      targetPeerId,
      connPeer: conn.peer,
      connType: conn.type,
      connReliable: conn.reliable,
      connSerialiation: conn.serialization
    })

    // Access the underlying RTCPeerConnection for detailed ICE logging
    const peerConnection = conn.peerConnection as RTCPeerConnection | undefined
    if (peerConnection) {
      logger.info('RTCPeerConnection found', {
        iceConnectionState: peerConnection.iceConnectionState,
        iceGatheringState: peerConnection.iceGatheringState,
        signalingState: peerConnection.signalingState,
        connectionState: peerConnection.connectionState
      })

      // Use addEventListener to avoid overwriting PeerJS's handlers
      peerConnection.addEventListener('icecandidate', (event) => {
        if (event.candidate) {
          logger.info('ICE candidate gathered', {
            peer: truncatedKey,
            candidateType: event.candidate.type,
            protocol: event.candidate.protocol,
            address: event.candidate.address,
            port: event.candidate.port,
            candidateFull: event.candidate.candidate.substring(0, 100)
          })
        } else {
          logger.info('ICE gathering complete', { peer: truncatedKey })
        }
      })

      peerConnection.addEventListener('iceconnectionstatechange', () => {
        logger.info('ICE connection state changed', {
          peer: truncatedKey,
          state: peerConnection.iceConnectionState
        })
      })

      peerConnection.addEventListener('icegatheringstatechange', () => {
        logger.info('ICE gathering state changed', {
          peer: truncatedKey,
          state: peerConnection.iceGatheringState
        })
      })

      peerConnection.addEventListener('connectionstatechange', () => {
        logger.info('Connection state changed', {
          peer: truncatedKey,
          state: peerConnection.connectionState
        })
      })

      peerConnection.addEventListener('signalingstatechange', () => {
        logger.info('Signaling state changed', {
          peer: truncatedKey,
          state: peerConnection.signalingState
        })
      })
    } else {
      logger.warn('RTCPeerConnection not available yet, will retry', { peer: truncatedKey })
      // PeerJS creates peerConnection lazily, check again after short delay
      setTimeout(() => {
        const delayedPc = conn.peerConnection as RTCPeerConnection | undefined
        if (delayedPc) {
          logger.info('RTCPeerConnection now available (delayed)', {
            peer: truncatedKey,
            iceConnectionState: delayedPc.iceConnectionState,
            iceGatheringState: delayedPc.iceGatheringState,
            signalingState: delayedPc.signalingState,
            connectionState: delayedPc.connectionState
          })
          // Set up the event handlers we missed (use addEventListener to not overwrite PeerJS handlers)
          delayedPc.addEventListener('iceconnectionstatechange', () => {
            logger.info('ICE connection state changed (delayed handler)', {
              peer: truncatedKey,
              state: delayedPc.iceConnectionState
            })
          })
          delayedPc.addEventListener('connectionstatechange', () => {
            logger.info('Connection state changed (delayed handler)', {
              peer: truncatedKey,
              state: delayedPc.connectionState
            })
          })
        } else {
          logger.warn('RTCPeerConnection still not available after delay', { peer: truncatedKey })
        }
      }, 500)
    }

    // Connection timeout - if not open within 30 seconds, log detailed state
    const connectionTimeout = setTimeout(() => {
      if (!conn.open) {
        const pc = conn.peerConnection as RTCPeerConnection | undefined
        logger.warn('Connection timeout - peer may be offline', {
          peer: truncatedKey,
          iceConnectionState: pc?.iceConnectionState,
          iceGatheringState: pc?.iceGatheringState,
          signalingState: pc?.signalingState,
          connectionState: pc?.connectionState
        })
      }
    }, 30000)

    // Handler for when connection opens
    const handleOpen = () => {
      clearTimeout(connectionTimeout)
      this.pendingConnections.delete(publicKey)
      logger.info('Connection opened', { peer: truncatedKey })
      this.connections.set(publicKey, conn)
      this.emit('peer-connected', publicKey)

      // Initiate authentication
      this.sendAuthChallenge(publicKey)
    }

    conn.on('open', handleOpen)

    // Check if already open (for incoming connections, might have missed the event)
    if (conn.open) {
      logger.info('Connection already open, handling immediately', { peer: truncatedKey })
      handleOpen()
    }

    conn.on('data', (data) => {
      logger.info('Data received on connection', { peer: truncatedKey, dataType: typeof data, messageType: (data as PeerMessage)?.type })
      this.handleMessage(publicKey, data as PeerMessage)
    })

    conn.on('close', () => {
      clearTimeout(connectionTimeout)
      this.pendingConnections.delete(publicKey)
      logger.info('Connection closed', { peer: truncatedKey })
      this.connections.delete(publicKey)
      this.authenticatedPeers.delete(publicKey)
      this.emit('peer-disconnected', publicKey)
    })

    conn.on('error', (err) => {
      clearTimeout(connectionTimeout)
      this.pendingConnections.delete(publicKey)
      logger.error('Connection error', { peer: truncatedKey, error: err, errorType: (err as Error).name })
    })

    // Track ICE connection state for debugging (PeerJS event)
    conn.on('iceStateChanged', (state: string) => {
      logger.info('PeerJS ICE state changed', { peer: truncatedKey, state })
    })
  }

  private sendAuthChallenge(publicKey: string): void {
    const challenge = crypto.randomUUID()
    this.pendingChallenges.set(publicKey, challenge)
    logger.info('Sending auth challenge', { peer: getTruncatedPublicKey(publicKey) })

    const sent = this.sendToPeer(publicKey, {
      type: 'auth-challenge',
      challenge
    })
    if (!sent) {
      logger.warn('Failed to send auth challenge', { peer: getTruncatedPublicKey(publicKey) })
    }
  }

  private async handleMessage(publicKey: string, message: PeerMessage): Promise<void> {
    logger.debug('Received message', { peer: getTruncatedPublicKey(publicKey), type: message.type })

    switch (message.type) {
      case 'auth-challenge':
        logger.info('Received auth challenge', { peer: getTruncatedPublicKey(publicKey) })
        await this.handleAuthChallenge(publicKey, message.challenge!)
        break
      case 'auth-response':
        logger.info('Received auth response', { peer: getTruncatedPublicKey(publicKey) })
        this.handleAuthResponse(publicKey, message)
        break
      case 'sync':
        if (this.authenticatedPeers.has(publicKey)) {
          this.emit('sync-message', { publicKey, data: new Uint8Array(message.data) })
        } else {
          logger.warn('Ignoring sync from unauthenticated peer')
        }
        break
      case 'full-state-sync':
        if (this.authenticatedPeers.has(publicKey)) {
          this.emit('full-state-sync', { publicKey, data: message.data, timestamp: message.timestamp })
        } else {
          logger.warn('Ignoring full-state-sync from unauthenticated peer')
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
    logger.info('Sending auth response', { peer: getTruncatedPublicKey(publicKey) })

    const sent = this.sendToPeer(publicKey, {
      type: 'auth-response',
      challenge,
      signature,
      publicKey: this.config.publicKey
    })
    if (!sent) {
      logger.warn('Failed to send auth response', { peer: getTruncatedPublicKey(publicKey) })
    }
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

  sendFullStateSync(publicKey: string, data: string, timestamp: number): boolean {
    if (!this.authenticatedPeers.has(publicKey)) {
      logger.warn('Cannot send full-state-sync - peer not authenticated')
      return false
    }
    logger.info('Sending full state sync', { peer: getTruncatedPublicKey(publicKey), dataLength: data.length })
    return this.sendToPeer(publicKey, { type: 'full-state-sync', data, timestamp })
  }

  broadcastFullStateSync(data: string, timestamp: number): void {
    for (const publicKey of this.authenticatedPeers) {
      this.sendFullStateSync(publicKey, data, timestamp)
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
