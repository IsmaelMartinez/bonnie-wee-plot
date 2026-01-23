import { vi, beforeEach } from 'vitest'
import React from 'react'

// Make React available globally (for Next.js client components that don't import React)
Object.defineProperty(global, 'React', { value: React })

// Functional localStorage mock (stores data in-memory)
const createStorageMock = () => {
  const store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key])
    }),
    key: vi.fn((index: number) => {
      const keys = Object.keys(store)
      return keys[index] || null
    }),
    get length() {
      return Object.keys(store).length
    }
  }
}

const localStorageMock = createStorageMock()
const sessionStorageMock = createStorageMock()

Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true })
Object.defineProperty(global, 'sessionStorage', { value: sessionStorageMock, writable: true })

// Reset mocks between tests (but don't clear the store - tests do that explicitly)
beforeEach(() => {
  vi.clearAllMocks()
})

