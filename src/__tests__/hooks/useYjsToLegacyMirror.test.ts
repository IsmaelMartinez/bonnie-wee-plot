/**
 * Tests for `useYjsToLegacyMirror` (ADR 027 Step 3, PR-A foundation).
 *
 * Coverage:
 *   - A snapshot change triggers `local.setData` exactly once.
 *   - A reference-equal snapshot does not re-trigger `setData`.
 *   - `null` snapshot is a no-op.
 *   - Unmount tears down the effect cleanly.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useYjsToLegacyMirror } from '@/hooks/useYjsToLegacyMirror'
import type { UsePersistedStorageReturn } from '@/hooks/usePersistedStorage'
import type { AllotmentData } from '@/types/unified-allotment'

function makeLocal(): UsePersistedStorageReturn<AllotmentData> {
  return {
    data: null,
    setData: vi.fn(),
    saveStatus: 'idle',
    isLoading: false,
    error: null,
    saveError: null,
    isSyncedFromOtherTab: false,
    lastSavedAt: null,
    reload: vi.fn(),
    flushSave: vi.fn().mockResolvedValue(true),
    clearSaveError: vi.fn(),
    cancelPendingSave: vi.fn(),
    retrySave: vi.fn(),
  }
}

function makeSnapshot(name = 'A'): AllotmentData {
  return {
    version: 22,
    currentYear: 2026,
    meta: {
      name,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2026-05-12T10:00:00.000Z',
    },
    layout: { areas: [] },
    seasons: [],
    varieties: [],
  } as unknown as AllotmentData
}

describe('useYjsToLegacyMirror', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not call setData when data is null', () => {
    const local = makeLocal()
    renderHook(({ data }) => useYjsToLegacyMirror(data, local), {
      initialProps: { data: null as AllotmentData | null },
    })

    expect(local.setData).not.toHaveBeenCalled()
  })

  it('calls setData exactly once when the snapshot changes', () => {
    const local = makeLocal()
    const snap = makeSnapshot()

    renderHook(({ data }) => useYjsToLegacyMirror(data, local), {
      initialProps: { data: snap as AllotmentData | null },
    })

    expect(local.setData).toHaveBeenCalledTimes(1)
    expect(local.setData).toHaveBeenCalledWith(snap)
  })

  it('does not re-trigger setData when given a reference-equal snapshot', () => {
    const local = makeLocal()
    const snap = makeSnapshot()

    const { rerender } = renderHook(({ data }) => useYjsToLegacyMirror(data, local), {
      initialProps: { data: snap as AllotmentData | null },
    })

    expect(local.setData).toHaveBeenCalledTimes(1)

    rerender({ data: snap })

    // Same reference → no re-trigger.
    expect(local.setData).toHaveBeenCalledTimes(1)
  })

  it('re-triggers setData when given a fresh snapshot reference', () => {
    const local = makeLocal()
    const snapA = makeSnapshot('A')
    const snapB = makeSnapshot('B')

    const { rerender } = renderHook(({ data }) => useYjsToLegacyMirror(data, local), {
      initialProps: { data: snapA as AllotmentData | null },
    })
    expect(local.setData).toHaveBeenCalledTimes(1)
    expect(local.setData).toHaveBeenLastCalledWith(snapA)

    rerender({ data: snapB })

    expect(local.setData).toHaveBeenCalledTimes(2)
    expect(local.setData).toHaveBeenLastCalledWith(snapB)
  })

  it('unmount does not throw and does not leak setData calls', () => {
    const local = makeLocal()
    const snap = makeSnapshot()

    const { unmount } = renderHook(({ data }) => useYjsToLegacyMirror(data, local), {
      initialProps: { data: snap as AllotmentData | null },
    })

    expect(local.setData).toHaveBeenCalledTimes(1)
    expect(() => unmount()).not.toThrow()
    // No additional setData calls after unmount.
    expect(local.setData).toHaveBeenCalledTimes(1)
  })
})
