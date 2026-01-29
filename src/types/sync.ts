import * as Y from 'yjs'

/**
 * Yjs document structure for AllotmentData
 */
export interface YjsAllotmentSchema {
  meta: Y.Map<unknown>
  layout: Y.Map<unknown>
  seasons: Y.Array<Y.Map<unknown>>
  varieties: Y.Array<Y.Map<unknown>>
  currentYear: number
  maintenanceTasks: Y.Array<Y.Map<unknown>>
  gardenEvents: Y.Array<Y.Map<unknown>>
}

/**
 * Sync connection state
 */
export type SyncConnectionState =
  | 'disconnected'
  | 'discovering'
  | 'connecting'
  | 'connected'
  | 'syncing'

/**
 * Information about a sync peer
 */
export interface SyncPeer {
  publicKey: string
  deviceName: string
  connectionState: SyncConnectionState
  lastSeen?: string
}

/**
 * Sync status for UI display
 */
export interface SyncStatus {
  state: SyncConnectionState
  connectedPeers: SyncPeer[]
  lastSyncTime?: string
  pendingChanges: number
}

/**
 * Sync event for toast notifications
 */
export interface SyncEvent {
  type: 'sync-complete' | 'peer-connected' | 'peer-disconnected' | 'error'
  peerName?: string
  changeCount?: number
  error?: string
  timestamp: string
}

/**
 * Device identity stored locally
 */
export interface DeviceIdentity {
  publicKey: string
  privateKey: string
  deviceName: string
  createdAt: string
}

/**
 * Paired device info
 */
export interface PairedDevice {
  publicKey: string
  deviceName: string
  pairedAt: string
  lastSeen?: string
}

/**
 * QR code pairing payload
 */
export interface PairingPayload {
  v: 1
  pk: string
  code: string
  name: string
  ts: number
}
