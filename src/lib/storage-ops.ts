/**
 * Storage Operations Utilities
 *
 * Shared utility functions for storage operations used by both
 * allotment-storage.ts and compost-storage.ts.
 */

import { StorageResult } from '@/types/storage'

/**
 * Check if an error is a localStorage quota exceeded error
 */
export function isQuotaExceededError(error: unknown): boolean {
  if (error instanceof DOMException) {
    // Most browsers
    if (error.code === 22 || error.name === 'QuotaExceededError') {
      return true
    }
    // Firefox
    if (error.code === 1014 || error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
      return true
    }
  }
  return false
}

/**
 * Check if code is running in browser environment
 */
export function isBrowserEnvironment(): boolean {
  return typeof window !== 'undefined'
}

/**
 * Safely parse JSON with proper error handling
 */
export function safeJsonParse<T>(json: string): StorageResult<T> {
  try {
    const data = JSON.parse(json) as T
    return { success: true, data }
  } catch {
    return { success: false, error: 'Invalid JSON' }
  }
}

/**
 * Safely stringify data with error handling
 */
export function safeJsonStringify(data: unknown): StorageResult<string> {
  try {
    const json = JSON.stringify(data)
    return { success: true, data: json }
  } catch {
    return { success: false, error: 'Failed to stringify data' }
  }
}

/**
 * Safely get item from localStorage
 */
export function safeStorageGet(key: string): StorageResult<string> {
  if (!isBrowserEnvironment()) {
    return { success: false, error: 'Not in browser environment' }
  }

  try {
    const value = localStorage.getItem(key)
    if (value === null) {
      return { success: false, error: 'No data found' }
    }
    return { success: true, data: value }
  } catch {
    return { success: false, error: 'Failed to read from storage' }
  }
}

/**
 * Safely set item in localStorage with quota handling
 */
export function safeStorageSet(key: string, value: string): StorageResult<void> {
  if (!isBrowserEnvironment()) {
    return { success: false, error: 'Not in browser environment' }
  }

  try {
    localStorage.setItem(key, value)
    return { success: true }
  } catch (error) {
    if (isQuotaExceededError(error)) {
      return { success: false, error: 'Storage quota exceeded' }
    }
    return { success: false, error: 'Failed to write to storage' }
  }
}

/**
 * Add or update the updatedAt timestamp on a data object
 */
export function withUpdatedTimestamp<T extends Record<string, unknown>>(
  data: T
): T & { updatedAt: string } {
  return {
    ...data,
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Helper for immutable array item updates
 */
export function mapItemUpdate<T extends { id: string }>(
  items: T[],
  id: string,
  updater: (item: T) => T
): T[] {
  return items.map(item => (item.id === id ? updater(item) : item))
}
