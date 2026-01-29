import { EventEmitter } from 'events'
import { logger } from '@/lib/logger'

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' }
]

export class WebRTCManager extends EventEmitter {
  private peerConnection: RTCPeerConnection | null = null
  private dataChannel: RTCDataChannel | null = null
  private pendingCandidates: RTCIceCandidateInit[] = []

  constructor() {
    super()
  }

  hasDataChannel(): boolean {
    return this.dataChannel !== null
  }

  isConnected(): boolean {
    return this.dataChannel?.readyState === 'open'
  }

  private createPeerConnection(): RTCPeerConnection {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.emit('ice-candidate', event.candidate.toJSON())
      }
    }

    pc.ondatachannel = (event) => {
      this.setupDataChannel(event.channel)
    }

    pc.onconnectionstatechange = () => {
      logger.info('WebRTC connection state', { state: pc.connectionState })
      this.emit('connection-state', pc.connectionState)
    }

    return pc
  }

  private setupDataChannel(channel: RTCDataChannel): void {
    this.dataChannel = channel

    channel.onopen = () => {
      logger.info('Data channel opened')
      this.emit('channel-open')
    }

    channel.onmessage = (event) => {
      this.emit('message', event.data)
    }

    channel.onclose = () => {
      logger.info('Data channel closed')
      this.emit('channel-close')
    }

    channel.onerror = (error) => {
      logger.error('Data channel error', { error })
      this.emit('error', error)
    }
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    this.peerConnection = this.createPeerConnection()
    const channel = this.peerConnection.createDataChannel('sync', { ordered: true })
    this.setupDataChannel(channel)

    const offer = await this.peerConnection.createOffer()
    await this.peerConnection.setLocalDescription(offer)
    return offer
  }

  async createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    this.peerConnection = this.createPeerConnection()
    await this.peerConnection.setRemoteDescription(offer)

    for (const candidate of this.pendingCandidates) {
      await this.peerConnection.addIceCandidate(candidate)
    }
    this.pendingCandidates = []

    const answer = await this.peerConnection.createAnswer()
    await this.peerConnection.setLocalDescription(answer)
    return answer
  }

  async setRemoteAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) throw new Error('No peer connection')
    await this.peerConnection.setRemoteDescription(answer)

    for (const candidate of this.pendingCandidates) {
      await this.peerConnection.addIceCandidate(candidate)
    }
    this.pendingCandidates = []
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection || !this.peerConnection.remoteDescription) {
      this.pendingCandidates.push(candidate)
      return
    }
    await this.peerConnection.addIceCandidate(candidate)
  }

  send(data: string | ArrayBuffer): void {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      throw new Error('Data channel not open')
    }
    this.dataChannel.send(data as string)
  }

  close(): void {
    this.dataChannel?.close()
    this.peerConnection?.close()
    this.dataChannel = null
    this.peerConnection = null
  }
}
