/**
 * Unit tests for usePersistedStorage hook
 *
 * Focus on flush mechanism and race condition handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { usePersistedStorage } from '@/hooks/usePersistedStorage'

// Mock data type for testing
interface TestData {
  version: number
  value: string
}

describe('usePersistedStorage - Flush Mechanism', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockLoad: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSave: any

  beforeEach(() => {
    mockLoad = vi.fn()
    mockSave = vi.fn()
  })

  it('flushSave returns true when save succeeds', async () => {
    const testData: TestData = { version: 1, value: 'initial' }
    const updatedData: TestData = { version: 1, value: 'updated' }

    // Initial load returns original data
    mockLoad.mockReturnValueOnce({ success: true, data: testData })
    // Save succeeds
    mockSave.mockReturnValue({ success: true })
    // Verification load returns the updated data (what we just saved)
    mockLoad.mockReturnValue({ success: true, data: updatedData })

    const { result } = renderHook(() =>
      usePersistedStorage<TestData>({
        storageKey: 'test-key',
        load: mockLoad,
        save: mockSave,
      })
    )

    // Wait for initial load
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // Make a change
    act(() => {
      result.current.setData(updatedData)
    })

    // Flush immediately
    let flushResult: boolean = false
    await act(async () => {
      flushResult = await result.current.flushSave()
    })

    expect(flushResult).toBe(true)
    expect(mockSave).toHaveBeenCalledWith(updatedData)
  })

  it('flushSave returns false when save fails', async () => {
    const testData: TestData = { version: 1, value: 'initial' }
    mockLoad.mockReturnValue({ success: true, data: testData })
    mockSave.mockReturnValue({ success: false, error: 'Save failed' })

    const { result } = renderHook(() =>
      usePersistedStorage<TestData>({
        storageKey: 'test-key',
        load: mockLoad,
        save: mockSave,
      })
    )

    // Wait for initial load
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // Make a change
    act(() => {
      result.current.setData({ version: 1, value: 'updated' })
    })

    // Flush immediately
    let flushResult: boolean = true
    await act(async () => {
      flushResult = await result.current.flushSave()
    })

    expect(flushResult).toBe(false)
    expect(result.current.saveStatus).toBe('error')
  })

  it('flushSave verifies data after write', async () => {
    const testData: TestData = { version: 1, value: 'initial' }
    const updatedData: TestData = { version: 1, value: 'updated' }

    // Initial load returns original data
    mockLoad.mockReturnValueOnce({ success: true, data: testData })
    // Save succeeds
    mockSave.mockReturnValue({ success: true })
    // Verification load returns the updated data
    mockLoad.mockReturnValueOnce({ success: true, data: updatedData })

    const { result } = renderHook(() =>
      usePersistedStorage<TestData>({
        storageKey: 'test-key',
        load: mockLoad,
        save: mockSave,
      })
    )

    // Wait for initial load
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // Make a change
    act(() => {
      result.current.setData(updatedData)
    })

    // Flush immediately
    let flushResult: boolean = false
    await act(async () => {
      flushResult = await result.current.flushSave()
    })

    expect(flushResult).toBe(true)
    // Should have called load twice: once for initial, once for verification
    expect(mockLoad).toHaveBeenCalledTimes(2)
  })

  it('flushSave returns false when verification fails', async () => {
    const testData: TestData = { version: 1, value: 'initial' }
    const updatedData: TestData = { version: 1, value: 'updated' }
    const wrongData: TestData = { version: 1, value: 'wrong' }

    // Initial load returns original data
    mockLoad.mockReturnValueOnce({ success: true, data: testData })
    // Save succeeds
    mockSave.mockReturnValue({ success: true })
    // Verification load returns different data (write didn't persist correctly)
    mockLoad.mockReturnValueOnce({ success: true, data: wrongData })

    const { result } = renderHook(() =>
      usePersistedStorage<TestData>({
        storageKey: 'test-key',
        load: mockLoad,
        save: mockSave,
      })
    )

    // Wait for initial load
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // Make a change
    act(() => {
      result.current.setData(updatedData)
    })

    // Flush immediately
    let flushResult: boolean = true
    await act(async () => {
      flushResult = await result.current.flushSave()
    })

    expect(flushResult).toBe(false)
  })

  it('flushSave returns true when no pending data', async () => {
    const testData: TestData = { version: 1, value: 'initial' }
    mockLoad.mockReturnValue({ success: true, data: testData })
    mockSave.mockReturnValue({ success: true })

    const { result } = renderHook(() =>
      usePersistedStorage<TestData>({
        storageKey: 'test-key',
        load: mockLoad,
        save: mockSave,
      })
    )

    // Wait for initial load
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // Wait for auto-save to complete (status becomes 'saved' then 'idle' after 2s)
    await waitFor(() => expect(result.current.saveStatus).toBe('idle'), { timeout: 3000 })

    // Clear any calls from auto-save
    mockSave.mockClear()

    // Don't make any changes, just flush
    let flushResult: boolean = false
    await act(async () => {
      flushResult = await result.current.flushSave()
    })

    expect(flushResult).toBe(true)
    // Should not have called save since there's no pending data after initial auto-save
    expect(mockSave).not.toHaveBeenCalled()
  })

  it('flushSave clears timeout when called', async () => {
    const testData: TestData = { version: 1, value: 'initial' }
    mockLoad.mockReturnValue({ success: true, data: testData })
    mockSave.mockReturnValue({ success: true })

    const { result } = renderHook(() =>
      usePersistedStorage<TestData>({
        storageKey: 'test-key',
        load: mockLoad,
        save: mockSave,
      })
    )

    // Wait for initial load
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // Make a change (this schedules a debounced save)
    act(() => {
      result.current.setData({ version: 1, value: 'updated' })
    })

    expect(result.current.saveStatus).toBe('saving')

    // Flush immediately (should cancel debounced save and save immediately)
    await act(async () => {
      await result.current.flushSave()
    })

    // Should have called save exactly once (from flush, not from debounce)
    expect(mockSave).toHaveBeenCalledTimes(1)
  })
})
