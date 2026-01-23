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

describe('usePersistedStorage - Race Condition Handling', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockLoad: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSave: any

  beforeEach(() => {
    mockLoad = vi.fn()
    mockSave = vi.fn()
  })

  it('handles concurrent save/import operations via flush', async () => {
    const testData: TestData = { version: 1, value: 'initial' }
    const updatedData: TestData = { version: 1, value: 'updated' }
    const importedData: TestData = { version: 1, value: 'imported' }

    // Initial load returns original data
    mockLoad.mockReturnValueOnce({ success: true, data: testData })
    // Save succeeds
    mockSave.mockReturnValue({ success: true })
    // Verification load returns the updated data
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

    // Make a change (simulating user edit)
    act(() => {
      result.current.setData(updatedData)
    })

    // Flush before import (this is what DataManagement does)
    let flushResult: boolean = false
    await act(async () => {
      flushResult = await result.current.flushSave()
    })

    expect(flushResult).toBe(true)
    expect(mockSave).toHaveBeenCalledWith(updatedData)

    // Now simulate import by setting new data (after flush completes)
    mockLoad.mockReturnValue({ success: true, data: importedData })

    act(() => {
      result.current.setData(importedData)
    })

    // Data should be the imported data
    expect(result.current.data).toEqual(importedData)

    // Clear the mock and flush again to verify imported data persists
    mockSave.mockClear()
    await act(async () => {
      await result.current.flushSave()
    })

    // Should have saved the imported data
    expect(mockSave).toHaveBeenCalledWith(importedData)
  })

  it('handles multi-tab sync during import correctly', async () => {
    const testData: TestData = { version: 1, value: 'initial' }
    const importedData: TestData = { version: 1, value: 'imported-from-other-tab' }

    // Initial load returns original data
    mockLoad.mockReturnValueOnce({ success: true, data: testData })
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

    // Simulate storage event from another tab (import happened there)
    mockLoad.mockReturnValue({ success: true, data: importedData })

    act(() => {
      // Create and dispatch storage event
      const storageEvent = new StorageEvent('storage', {
        key: 'test-key',
        newValue: JSON.stringify(importedData),
        oldValue: JSON.stringify(testData),
      })
      window.dispatchEvent(storageEvent)
    })

    // Data should sync to imported data from other tab
    await waitFor(() => {
      expect(result.current.data).toEqual(importedData)
    })

    // Should have called load to sync
    expect(mockLoad).toHaveBeenCalledTimes(2) // Once for initial, once for storage event
  })

  it('clears debounce timeout properly when flush is called', async () => {
    const testData: TestData = { version: 1, value: 'initial' }
    const updatedData: TestData = { version: 1, value: 'updated' }

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

    // Clear any calls from initial load
    mockSave.mockClear()

    // Make a change (schedules debounced save)
    act(() => {
      result.current.setData(updatedData)
    })

    expect(result.current.saveStatus).toBe('saving')

    // Immediately flush (should cancel debounce and save immediately)
    await act(async () => {
      await result.current.flushSave()
    })

    // Should have called save exactly once (from flush)
    expect(mockSave).toHaveBeenCalledTimes(1)
    expect(mockSave).toHaveBeenCalledWith(updatedData)

    // Clear mock and wait for debounce duration to verify no second save
    mockSave.mockClear()

    // Wait longer than debounce delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Should NOT have called save again (debounce was cancelled)
    expect(mockSave).not.toHaveBeenCalled()
  })

  it('handles pending data correctly - waits for flush before import', async () => {
    const testData: TestData = { version: 1, value: 'initial' }
    const pendingData: TestData = { version: 1, value: 'pending-edit' }
    const importData: TestData = { version: 1, value: 'import' }

    // Initial load
    mockLoad.mockReturnValueOnce({ success: true, data: testData })
    mockSave.mockReturnValue({ success: true })
    // Verification load after save
    mockLoad.mockReturnValue({ success: true, data: pendingData })

    const { result } = renderHook(() =>
      usePersistedStorage<TestData>({
        storageKey: 'test-key',
        load: mockLoad,
        save: mockSave,
      })
    )

    // Wait for initial load
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // Make an edit (creates pending data)
    act(() => {
      result.current.setData(pendingData)
    })

    expect(result.current.saveStatus).toBe('saving')

    // Simulate import workflow - flush first
    let flushSuccess = false
    await act(async () => {
      flushSuccess = await result.current.flushSave()
    })

    expect(flushSuccess).toBe(true)
    expect(mockSave).toHaveBeenCalledWith(pendingData)

    // Now it's safe to import
    mockLoad.mockReturnValue({ success: true, data: importData })

    act(() => {
      result.current.setData(importData)
    })

    expect(result.current.data).toEqual(importData)

    // Verify import data can be saved
    mockSave.mockClear()
    await act(async () => {
      await result.current.flushSave()
    })

    expect(mockSave).toHaveBeenCalledWith(importData)
  })
})
