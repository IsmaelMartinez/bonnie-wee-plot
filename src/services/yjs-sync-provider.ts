import * as Y from 'yjs'
import * as encoding from 'lib0/encoding'
import * as decoding from 'lib0/decoding'
import * as syncProtocol from 'y-protocols/sync'
import { logger } from '@/lib/logger'

interface Transport {
  send: (data: Uint8Array) => void
  onReceive: (handler: (data: Uint8Array) => void) => void
}

const MESSAGE_SYNC_STEP1 = 0
const MESSAGE_SYNC_STEP2 = 1
const MESSAGE_UPDATE = 2

export class YjsSyncProvider {
  private doc: Y.Doc
  private transport: Transport
  private synced = false
  private updateHandler: (update: Uint8Array, origin: unknown) => void

  constructor(doc: Y.Doc, transport: Transport) {
    this.doc = doc
    this.transport = transport

    // Create update handler
    this.updateHandler = (update: Uint8Array, origin: unknown) => {
      if (origin !== 'remote') {
        this.broadcastUpdate(update)
      }
    }

    // Set up receive handler first
    transport.onReceive((data) => this.receiveMessage(data))

    // Listen for local updates
    doc.on('update', this.updateHandler)
  }

  startSync(): void {
    const encoder = encoding.createEncoder()
    encoding.writeVarUint(encoder, MESSAGE_SYNC_STEP1)
    syncProtocol.writeSyncStep1(encoder, this.doc)
    this.transport.send(encoding.toUint8Array(encoder))
    logger.info('Started Yjs sync')
  }

  receiveMessage(data: Uint8Array): void {
    if (!data || data.length === 0) {
      logger.warn('Received empty message')
      return
    }

    try {
      const decoder = decoding.createDecoder(data)
      const messageType = decoding.readVarUint(decoder)

      switch (messageType) {
        case MESSAGE_SYNC_STEP1:
          this.handleSyncStep1(decoder)
          break
        case MESSAGE_SYNC_STEP2:
          this.handleSyncStep2(decoder)
          break
        case MESSAGE_UPDATE:
          this.handleUpdate(decoder)
          break
        default:
          logger.warn('Unknown sync message type', { messageType })
      }
    } catch (error) {
      logger.error('Error processing sync message', { error })
    }
  }

  private handleSyncStep1(decoder: decoding.Decoder): void {
    const encoder = encoding.createEncoder()
    encoding.writeVarUint(encoder, MESSAGE_SYNC_STEP2)
    syncProtocol.readSyncStep1(decoder, encoder, this.doc)
    this.transport.send(encoding.toUint8Array(encoder))

    // Also send our state vector
    const encoder2 = encoding.createEncoder()
    encoding.writeVarUint(encoder2, MESSAGE_SYNC_STEP1)
    syncProtocol.writeSyncStep1(encoder2, this.doc)
    this.transport.send(encoding.toUint8Array(encoder2))
  }

  private handleSyncStep2(decoder: decoding.Decoder): void {
    syncProtocol.readSyncStep2(decoder, this.doc, 'remote')
    if (!this.synced) {
      this.synced = true
      logger.info('Yjs sync complete')
    }
  }

  private handleUpdate(decoder: decoding.Decoder): void {
    const update = decoding.readVarUint8Array(decoder)
    Y.applyUpdate(this.doc, update, 'remote')
  }

  private broadcastUpdate(update: Uint8Array): void {
    const encoder = encoding.createEncoder()
    encoding.writeVarUint(encoder, MESSAGE_UPDATE)
    encoding.writeVarUint8Array(encoder, update)
    this.transport.send(encoding.toUint8Array(encoder))
  }

  isSynced(): boolean {
    return this.synced
  }

  destroy(): void {
    this.doc.off('update', this.updateHandler)
  }
}
