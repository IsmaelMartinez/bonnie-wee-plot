/**
 * Shared storage-related types
 */

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export interface StorageResult<T> {
  success: boolean
  data?: T
  error?: string
}
