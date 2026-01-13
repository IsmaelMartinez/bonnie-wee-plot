/**
 * Storage Detection Utility
 *
 * Detects localStorage availability and provides helpful error messages.
 * Handles cases like:
 * - Safari private browsing mode
 * - Browser settings disabling storage
 * - QuotaExceededError
 */

export interface StorageAvailability {
  available: boolean
  reason?: string
}

/**
 * Test if localStorage is available and functional
 */
export function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined') {
      return false
    }

    if (typeof localStorage === 'undefined') {
      return false
    }

    const test = '__localStorage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

/**
 * Get detailed information about storage availability
 */
export function getStorageAvailability(): StorageAvailability {
  // Server-side rendering
  if (typeof window === 'undefined') {
    return {
      available: false,
      reason: 'Server-side rendering - localStorage not available'
    }
  }

  // localStorage API not supported
  if (typeof localStorage === 'undefined') {
    return {
      available: false,
      reason: 'Browser does not support localStorage'
    }
  }

  // Test if we can actually use localStorage
  try {
    const test = '__localStorage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return { available: true }
  } catch (e) {
    const error = e as Error

    // Check for specific error types
    if (error.name === 'QuotaExceededError') {
      return {
        available: false,
        reason: 'Storage quota exceeded - please clear old data or free up space'
      }
    }

    if (error.name === 'SecurityError') {
      return {
        available: false,
        reason: 'localStorage is disabled (may be private browsing mode or browser settings)'
      }
    }

    // Generic error
    return {
      available: false,
      reason: `localStorage access error: ${error.message}`
    }
  }
}

/**
 * Get user-friendly error message for unavailable storage
 */
export function getStorageUnavailableMessage(): string {
  const availability = getStorageAvailability()

  if (availability.available) {
    return ''
  }

  return availability.reason || 'localStorage is not available'
}

/**
 * Get suggested actions for the user when storage is unavailable
 */
export function getStorageSuggestions(): string[] {
  const availability = getStorageAvailability()

  if (availability.available) {
    return []
  }

  const reason = availability.reason || ''

  // Private browsing mode
  if (reason.includes('private browsing') || reason.includes('SecurityError')) {
    return [
      'Exit private browsing mode',
      'Use a regular browser window',
      'Check browser privacy settings'
    ]
  }

  // Quota exceeded
  if (reason.includes('quota exceeded') || reason.includes('QuotaExceeded')) {
    return [
      'Export your data first (to avoid data loss)',
      'Clear old season data',
      'Free up browser storage space',
      'Check browser storage settings'
    ]
  }

  // Browser doesn't support localStorage
  if (reason.includes('does not support')) {
    return [
      'Update your browser to the latest version',
      'Use a modern browser (Chrome, Firefox, Safari, Edge)',
      'Enable JavaScript in your browser'
    ]
  }

  // Generic suggestions
  return [
    'Check browser settings',
    'Try a different browser',
    'Contact support if the issue persists'
  ]
}
