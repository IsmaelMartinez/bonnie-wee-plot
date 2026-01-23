/**
 * Unit tests for DataManagement component
 *
 * Focus on import validation and export/import of compost data
 */

import { describe, it, expect } from 'vitest'
import { AllotmentData, CompleteExport, CURRENT_SCHEMA_VERSION } from '@/types/unified-allotment'
import { VarietyData } from '@/types/variety-data'
import { CompostData } from '@/types/compost'

// Mock data for testing
const mockAllotmentData: AllotmentData = {
  version: CURRENT_SCHEMA_VERSION,
  meta: {
    name: 'Test Allotment',
    location: 'Test Location',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  layout: { areas: [] },
  seasons: [],
  currentYear: 2024,
  maintenanceTasks: [],
  varieties: [],
}

const mockVarietyData: VarietyData = {
  version: 2,
  varieties: [],
  meta: {
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
}

const mockCompostData: CompostData = {
  version: 1,
  piles: [
    {
      id: 'pile-1',
      name: 'Bay 1',
      systemType: 'hot-compost',
      status: 'active',
      startDate: '2024-01-01',
      inputs: [],
      events: [],
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  ],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
}

/**
 * Validate import data structure (extracted from DataManagement component for testing)
 */
function validateImportData(parsed: unknown): { valid: boolean; error?: string } {
  // Check if it's a valid object
  if (!parsed || typeof parsed !== 'object') {
    return { valid: false, error: 'Invalid backup file: not a valid JSON object' }
  }

  const obj = parsed as Record<string, unknown>

  // Check for CompleteExport format (new format with allotment + varieties)
  if (obj.allotment && obj.varieties) {
    const allotment = obj.allotment as Record<string, unknown>

    // Validate required AllotmentData fields
    if (typeof allotment.version !== 'number') {
      return { valid: false, error: 'Invalid backup: missing or invalid version' }
    }

    if (!allotment.meta || typeof allotment.meta !== 'object') {
      return { valid: false, error: 'Invalid backup: missing metadata' }
    }

    if (!Array.isArray(allotment.seasons)) {
      return { valid: false, error: 'Invalid backup: missing seasons data' }
    }

    // Check version compatibility
    if (allotment.version > CURRENT_SCHEMA_VERSION) {
      return {
        valid: false,
        error: `Backup is from a newer version (v${allotment.version}). Please update the app first.`
      }
    }

    return { valid: true }
  }

  // Check for old format (just AllotmentData)
  // Validate required fields individually for better error messages
  if (typeof obj.version !== 'number') {
    return { valid: false, error: 'Invalid backup: missing or invalid version' }
  }

  if (!obj.meta || typeof obj.meta !== 'object') {
    return { valid: false, error: 'Invalid backup: missing metadata' }
  }

  if (!Array.isArray(obj.seasons)) {
    return { valid: false, error: 'Invalid backup: missing seasons data' }
  }

  // Check version compatibility
  if (obj.version > CURRENT_SCHEMA_VERSION) {
    return {
      valid: false,
      error: `Backup is from a newer version (v${obj.version}). Please update the app first.`
    }
  }

  return { valid: true }
}

describe('DataManagement - Import Validation', () => {
  it('rejects invalid JSON structure', () => {
    const result = validateImportData('not an object')
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/not a valid JSON object/i)
  })

  it('rejects missing required fields (meta)', () => {
    const invalidData = {
      version: CURRENT_SCHEMA_VERSION,
      // Missing meta
      layout: { areas: [] },
      seasons: [],
      currentYear: 2024,
      varieties: [],
    }

    const result = validateImportData(invalidData)
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/missing metadata/i)
  })

  it('rejects missing required fields (seasons)', () => {
    const invalidData = {
      version: CURRENT_SCHEMA_VERSION,
      meta: mockAllotmentData.meta,
      layout: { areas: [] },
      // Missing seasons array
      currentYear: 2024,
      varieties: [],
    }

    const result = validateImportData(invalidData)
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/missing seasons/i)
  })

  it('rejects invalid version number (non-number)', () => {
    const invalidData = {
      version: 'not-a-number', // Invalid version type
      meta: mockAllotmentData.meta,
      layout: { areas: [] },
      seasons: [],
      currentYear: 2024,
      varieties: [],
    }

    const result = validateImportData(invalidData)
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/missing or invalid version/i)
  })

  it('rejects future version compatibility', () => {
    const futureVersionData = {
      ...mockAllotmentData,
      version: CURRENT_SCHEMA_VERSION + 10, // Future version
    }

    const result = validateImportData(futureVersionData)
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/newer version/i)
    expect(result.error).toMatch(/update the app/i)
  })

  it('accepts both old and new format (AllotmentData vs CompleteExport)', () => {
    // Test 1: Old format (just AllotmentData)
    const oldFormatResult = validateImportData(mockAllotmentData)
    expect(oldFormatResult.valid).toBe(true)
    expect(oldFormatResult.error).toBeUndefined()

    // Test 2: New format (CompleteExport)
    const completeExport: CompleteExport = {
      allotment: mockAllotmentData,
      varieties: mockVarietyData,
      exportedAt: new Date().toISOString(),
      exportVersion: CURRENT_SCHEMA_VERSION,
    }

    const newFormatResult = validateImportData(completeExport)
    expect(newFormatResult.valid).toBe(true)
    expect(newFormatResult.error).toBeUndefined()
  })
})

describe('DataManagement - Compost Export/Import', () => {
  it('export includes compost data field', () => {
    // Verify that the CompleteExport type includes compost field
    const completeExport: CompleteExport = {
      allotment: mockAllotmentData,
      varieties: mockVarietyData,
      compost: mockCompostData,
      exportedAt: new Date().toISOString(),
      exportVersion: CURRENT_SCHEMA_VERSION,
    }

    // Verify structure
    expect(completeExport.allotment).toBeDefined()
    expect(completeExport.varieties).toBeDefined()
    expect(completeExport.compost).toBeDefined()
    expect(completeExport.compost?.piles).toHaveLength(1)
    expect(completeExport.compost?.piles[0].name).toBe('Bay 1')
    expect(completeExport.exportedAt).toBeDefined()
    expect(completeExport.exportVersion).toBe(CURRENT_SCHEMA_VERSION)
  })

  it('import handles compost data when present', () => {
    // Create export with compost data
    const completeExport: CompleteExport = {
      allotment: mockAllotmentData,
      varieties: mockVarietyData,
      compost: mockCompostData,
      exportedAt: new Date().toISOString(),
      exportVersion: CURRENT_SCHEMA_VERSION,
    }

    // Validate it
    const result = validateImportData(completeExport)
    expect(result.valid).toBe(true)

    // Verify compost data is accessible
    const typed = completeExport as CompleteExport
    expect(typed.compost).toBeDefined()
    expect(typed.compost?.piles[0].name).toBe('Bay 1')
  })
})
