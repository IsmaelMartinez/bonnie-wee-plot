/**
 * Unit tests for the v21 -> v22 migration: per-user Aitor opt-in.
 *
 * The migration is a no-op data transform (both new fields are optional);
 * it simply bumps the version field so the schema validator accepts the row.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { loadAllotmentData } from '@/services/allotment-storage'
import { AllotmentData, CURRENT_SCHEMA_VERSION } from '@/types/unified-allotment'

const TEST_CURRENT_YEAR = new Date().getFullYear()

function createV21Data(overrides: Partial<AllotmentData> = {}): AllotmentData {
  return {
    version: 21,
    currentYear: TEST_CURRENT_YEAR,
    meta: {
      name: 'Test Allotment',
      location: 'Test Location',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    },
    layout: { areas: [] },
    seasons: [
      {
        year: TEST_CURRENT_YEAR,
        status: 'current',
        areas: [],
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
    ],
    customTasks: [],
    varieties: [],
    compost: [],
    ...overrides,
  }
}

describe('v21 to v22 migration: Aitor opt-in', () => {
  beforeEach(() => {
    vi.mocked(localStorage.getItem).mockClear()
    vi.mocked(localStorage.setItem).mockClear()
  })

  it('bumps version to current and leaves opt-in fields undefined', () => {
    const v21Data = createV21Data()
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(v21Data))

    const result = loadAllotmentData()

    expect(result.success).toBe(true)
    expect(result.data?.version).toBe(CURRENT_SCHEMA_VERSION)
    expect(result.data?.meta.aiAdvisorEnabled).toBeUndefined()
    expect(result.data?.meta.aiAdvisorPromptDismissedAt).toBeUndefined()
  })

  it('preserves existing meta fields during migration', () => {
    const v21Data = createV21Data({
      meta: {
        name: 'My Plot',
        location: 'Edinburgh',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
        setupCompleted: true,
      },
    })
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(v21Data))

    const result = loadAllotmentData()

    expect(result.success).toBe(true)
    expect(result.data?.meta.name).toBe('My Plot')
    expect(result.data?.meta.setupCompleted).toBe(true)
  })

  it('preserves opt-in fields when already set on v21 data', () => {
    const v21Data = createV21Data({
      meta: {
        name: 'Test Allotment',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
        aiAdvisorEnabled: true,
        aiAdvisorPromptDismissedAt: '2026-05-01T00:00:00.000Z',
      },
    })
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(v21Data))

    const result = loadAllotmentData()

    expect(result.success).toBe(true)
    expect(result.data?.meta.aiAdvisorEnabled).toBe(true)
    expect(result.data?.meta.aiAdvisorPromptDismissedAt).toBe('2026-05-01T00:00:00.000Z')
  })
})
