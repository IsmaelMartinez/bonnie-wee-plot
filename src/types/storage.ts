/**
 * Shared storage-related types
 */

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export type SyncStatus = 'disabled' | 'syncing' | 'synced' | 'error' | 'offline' | 'conflict'

export interface StorageResult<T> {
  success: boolean
  data?: T
  error?: string
}
