/**
 * Generic Storage Utilities
 *
 * Generic localStorage wrappers for non-allotment data.
 */

/**
 * Generic get item from localStorage with JSON parsing
 * Use this for any non-allotment data that needs to be stored
 */
export function getStorageItem<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : null
  } catch {
    return null
  }
}

/**
 * Generic set item to localStorage with JSON serialization
 * Use this for any non-allotment data that needs to be stored
 */
export function setStorageItem<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined') return false
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

/**
 * Remove an item from localStorage
 */
export function removeStorageItem(key: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    localStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}
