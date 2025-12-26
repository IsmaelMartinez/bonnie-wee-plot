/**
 * Base storage service providing unified access to browser storage
 * Abstracts localStorage and sessionStorage with error handling and type safety
 */

export type StorageType = 'local' | 'session'

export interface StorageOptions {
  type?: StorageType
  /** Optional prefix for all keys */
  prefix?: string
}

/**
 * Result type for storage operations
 */
export type StorageResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string }

/**
 * StorageService provides a unified interface for browser storage operations
 */
export class StorageService {
  private storage: Storage | null = null
  private prefix: string

  constructor(options: StorageOptions = {}) {
    this.prefix = options.prefix ?? ''
    
    if (typeof window !== 'undefined') {
      this.storage = options.type === 'session' 
        ? window.sessionStorage 
        : window.localStorage
    }
  }

  /**
   * Get the full key with prefix
   */
  private getKey(key: string): string {
    return this.prefix ? `${this.prefix}:${key}` : key
  }

  /**
   * Check if storage is available
   */
  isAvailable(): boolean {
    if (!this.storage) return false
    
    try {
      const testKey = '__storage_test__'
      this.storage.setItem(testKey, 'test')
      this.storage.removeItem(testKey)
      return true
    } catch {
      return false
    }
  }

  /**
   * Get an item from storage
   */
  get<T>(key: string): StorageResult<T | null> {
    if (!this.storage) {
      return { success: false, error: 'Storage not available' }
    }

    try {
      const item = this.storage.getItem(this.getKey(key))
      if (item === null) {
        return { success: true, data: null }
      }
      
      const parsed = JSON.parse(item) as T
      return { success: true, data: parsed }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to parse stored data'
      }
    }
  }

  /**
   * Set an item in storage
   */
  set<T>(key: string, value: T): StorageResult<void> {
    if (!this.storage) {
      return { success: false, error: 'Storage not available' }
    }

    try {
      const serialized = JSON.stringify(value)
      this.storage.setItem(this.getKey(key), serialized)
      return { success: true, data: undefined }
    } catch (error) {
      // Handle quota exceeded error
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        return { success: false, error: 'Storage quota exceeded' }
      }
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to save data'
      }
    }
  }

  /**
   * Remove an item from storage
   */
  remove(key: string): StorageResult<void> {
    if (!this.storage) {
      return { success: false, error: 'Storage not available' }
    }

    try {
      this.storage.removeItem(this.getKey(key))
      return { success: true, data: undefined }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to remove data'
      }
    }
  }

  /**
   * Check if a key exists in storage
   */
  has(key: string): boolean {
    if (!this.storage) return false
    return this.storage.getItem(this.getKey(key)) !== null
  }

  /**
   * Clear all items with the current prefix
   */
  clearPrefixed(): StorageResult<void> {
    if (!this.storage) {
      return { success: false, error: 'Storage not available' }
    }

    if (!this.prefix) {
      return { success: false, error: 'Cannot clear without prefix - use clearAll() instead' }
    }

    try {
      const keysToRemove: string[] = []
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i)
        if (key?.startsWith(`${this.prefix}:`)) {
          keysToRemove.push(key)
        }
      }
      
      keysToRemove.forEach(key => this.storage!.removeItem(key))
      return { success: true, data: undefined }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to clear data'
      }
    }
  }

  /**
   * Get all keys with the current prefix
   */
  keys(): string[] {
    if (!this.storage) return []
    
    const result: string[] = []
    const prefixWithColon = this.prefix ? `${this.prefix}:` : ''
    
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i)
      if (key && (!this.prefix || key.startsWith(prefixWithColon))) {
        result.push(this.prefix ? key.slice(prefixWithColon.length) : key)
      }
    }
    
    return result
  }
}

/**
 * Create a localStorage service instance
 */
export function createLocalStorage(prefix?: string): StorageService {
  return new StorageService({ type: 'local', prefix })
}

/**
 * Create a sessionStorage service instance
 */
export function createSessionStorage(prefix?: string): StorageService {
  return new StorageService({ type: 'session', prefix })
}

// Default instances
export const localStorageService = new StorageService({ type: 'local' })
export const sessionStorageService = new StorageService({ type: 'session' })



