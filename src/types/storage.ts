/**
 * Shared storage-related types
 */

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

// ADR 027 Step 4: cloud sync merges Yjs binary state (no last-write-wins), so
// there is no 'conflict' status — concurrent edits merge instead of forcing a
// user choice.
export type SyncStatus = 'disabled' | 'syncing' | 'synced' | 'error' | 'offline'

export interface StorageResult<T> {
  success: boolean
  data?: T
  error?: string
}
