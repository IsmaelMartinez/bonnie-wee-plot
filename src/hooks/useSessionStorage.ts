'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * Hook for managing session storage state
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

  // Save to session storage
  const setValue = useCallback((value: T) => {
    try {
      setStoredValue(value)
      if (value === null || value === undefined || value === '') {
        sessionStorage.removeItem(key)
      } else {
        sessionStorage.setItem(key, JSON.stringify(value))
      }
    } catch (error) {
      console.error(`Error setting sessionStorage key "${key}":`, error)
    }
  }, [key])

  // Clear from session storage
  const clearValue = useCallback(() => {
    try {
      sessionStorage.removeItem(key)
      setStoredValue(initialValue)
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



