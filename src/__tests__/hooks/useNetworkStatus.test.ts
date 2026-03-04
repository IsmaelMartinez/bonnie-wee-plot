import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'

describe('useNetworkStatus', () => {
  const originalNavigator = window.navigator

  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
    Object.defineProperty(window, 'navigator', {
      value: originalNavigator,
      writable: true,
    })
  })

  it('should return online status when navigator.onLine is true', () => {
    Object.defineProperty(window, 'navigator', {
      value: { onLine: true },
      writable: true,
    })

    const { result } = renderHook(() => useNetworkStatus())

    expect(result.current.isOnline).toBe(true)
    expect(result.current.isOffline).toBe(false)
    expect(result.current.justReconnected).toBe(false)
  })

  it('should return offline status when navigator.onLine is false', () => {
    Object.defineProperty(window, 'navigator', {
      value: { onLine: false },
      writable: true,
    })

    const { result } = renderHook(() => useNetworkStatus())

    expect(result.current.isOnline).toBe(false)
    expect(result.current.isOffline).toBe(true)
  })

  it('should update to offline when offline event fires', () => {
    Object.defineProperty(window, 'navigator', {
      value: { onLine: true },
      writable: true,
    })

    const { result } = renderHook(() => useNetworkStatus())
    expect(result.current.isOnline).toBe(true)

    act(() => {
      window.dispatchEvent(new Event('offline'))
    })

    expect(result.current.isOnline).toBe(false)
    expect(result.current.isOffline).toBe(true)
  })

  it('should update to online when online event fires', () => {
    Object.defineProperty(window, 'navigator', {
      value: { onLine: false },
      writable: true,
    })

    const { result } = renderHook(() => useNetworkStatus())
    expect(result.current.isOffline).toBe(true)

    act(() => {
      window.dispatchEvent(new Event('online'))
    })

    expect(result.current.isOnline).toBe(true)
    expect(result.current.isOffline).toBe(false)
  })

  it('should set justReconnected after going offline then online', () => {
    Object.defineProperty(window, 'navigator', {
      value: { onLine: true },
      writable: true,
    })

    const { result } = renderHook(() => useNetworkStatus())

    act(() => {
      window.dispatchEvent(new Event('offline'))
    })
    expect(result.current.isOffline).toBe(true)
    expect(result.current.justReconnected).toBe(false)

    act(() => {
      window.dispatchEvent(new Event('online'))
    })
    expect(result.current.isOnline).toBe(true)
    expect(result.current.justReconnected).toBe(true)
  })

  it('should clear justReconnected after 3 seconds', () => {
    Object.defineProperty(window, 'navigator', {
      value: { onLine: true },
      writable: true,
    })

    const { result } = renderHook(() => useNetworkStatus())

    act(() => {
      window.dispatchEvent(new Event('offline'))
    })
    act(() => {
      window.dispatchEvent(new Event('online'))
    })
    expect(result.current.justReconnected).toBe(true)

    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(result.current.justReconnected).toBe(false)
  })

  it('should not set justReconnected on initial online event without prior offline', () => {
    Object.defineProperty(window, 'navigator', {
      value: { onLine: true },
      writable: true,
    })

    const { result } = renderHook(() => useNetworkStatus())

    act(() => {
      window.dispatchEvent(new Event('online'))
    })
    expect(result.current.justReconnected).toBe(false)
  })

  it('should clean up event listeners on unmount', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

    const { unmount } = renderHook(() => useNetworkStatus())

    expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function))
    expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function))

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function))
    expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function))

    addEventListenerSpy.mockRestore()
    removeEventListenerSpy.mockRestore()
  })
})
