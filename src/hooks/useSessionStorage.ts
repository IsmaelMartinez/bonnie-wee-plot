'use client'

import { useState, useEffect, useCallback } from 'react'

// Custom event name for cross-component synchronization
const SESSION_STORAGE_EVENT = 'session-storage-update'

/**
 * Hook for managing session storage state with cross-component sync
 */
export function useSessionStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue)

  // Load from session storage on mount
  useEffect(() => {
    try {
      const item = sessionStorage.getItem(key)
      if (item) {
        setStoredValue(JSON.parse(item))
      }
    } catch (error) {
      console.error(`Error reading sessionStorage key "${key}":`, error)
    }
  }, [key])

  // Listen for updates from other components in the same tab
  useEffect(() => {
    const handleStorageUpdate = (event: CustomEvent<{ key: string; value: unknown }>) => {
      if (event.detail.key === key) {
        setStoredValue(event.detail.value as T)
      }
    }

    window.addEventListener(SESSION_STORAGE_EVENT, handleStorageUpdate as EventListener)
    return () => {
      window.removeEventListener(SESSION_STORAGE_EVENT, handleStorageUpdate as EventListener)
    }
  }, [key])

  // Save to session storage and notify other components
  const setValue = useCallback((value: T) => {
    try {
      setStoredValue(value)
      if (value === null || value === undefined || value === '') {
        sessionStorage.removeItem(key)
      } else {
        sessionStorage.setItem(key, JSON.stringify(value))
      }
      // Dispatch custom event for cross-component sync
      window.dispatchEvent(new CustomEvent(SESSION_STORAGE_EVENT, {
        detail: { key, value }
      }))
    } catch (error) {
      console.error(`Error setting sessionStorage key "${key}":`, error)
    }
  }, [key])

  // Clear from session storage
  const clearValue = useCallback(() => {
    try {
      sessionStorage.removeItem(key)
      setStoredValue(initialValue)
      // Dispatch custom event for cross-component sync
      window.dispatchEvent(new CustomEvent(SESSION_STORAGE_EVENT, {
        detail: { key, value: initialValue }
      }))
    } catch (error) {
      console.error(`Error clearing sessionStorage key "${key}":`, error)
    }
  }, [key, initialValue])

  return [storedValue, setValue, clearValue]
}

/**
 * Specialized hook for API token management
 */
export function useApiToken() {
  const [token, setToken, clearToken] = useSessionStorage<string>('aitor_api_token', '')
  
  const saveToken = useCallback((newToken: string) => {
    const trimmed = newToken.trim()
    setToken(trimmed)
  }, [setToken])

  return {
    token,
    saveToken,
    clearToken,
    hasToken: !!token
  }
}




