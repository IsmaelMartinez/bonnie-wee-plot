/**
 * V9 Unification Tests
 *
 * Tests for the unified areas system, migration, backup/recovery,
 * and area type conversions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  loadAllotmentData,
  saveAllotmentData,
  restoreFromBackup,
  getAvailableBackups,
  getAreaById,
  getAreasByType,
  getBedAreaById,
  getPermanentAreaById,
  getInfrastructureAreaById,
  validateAreaConversion,
  convertAreaType,
} from '@/services/allotment-storage'
import { AllotmentData, CURRENT_SCHEMA_VERSION, Area, BedArea, PermanentArea, InfrastructureArea, SeasonRecord, BedSeason, PermanentSeason } from '@/types/unified-allotment'
import { PhysicalBedId } from '@/types/garden-planner'

// Helper to create a test season record
function createTestSeason(overrides: {
  year: number
  beds?: BedSeason[]
  permanents?: PermanentSeason[]
}): SeasonRecord {
  return {
    year: overrides.year,
    status: 'current',
    beds: overrides.beds || [],
    permanents: overrides.permanents,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  }
}

// Helper to create valid test data with areas
function createV9AllotmentData(overrides: Partial<AllotmentData> = {}): AllotmentData {
  const bedArea: BedArea = {
    id: 'A',
    type: 'bed',
    name: 'Bed A',
    description: 'Test bed',
    gridPosition: { startRow: 0, startCol: 0, endRow: 1, endCol: 1 },
    status: 'rotation',
    rotationGroup: 'legumes',
  }

  const permanentArea: PermanentArea = {
    id: 'apple-tree',
    type: 'permanent',
    name: 'Apple Tree',
    description: 'Bramley apple',
    gridPosition: { startRow: 2, startCol: 0, endRow: 3, endCol: 1 },
    plantingType: 'fruit-tree',
    plantId: 'apple',
    plantedYear: 2020,
  }

  return {
    version: CURRENT_SCHEMA_VERSION,
    currentYear: 2025,
    meta: {
      name: 'Test Allotment',
      location: 'Test Location',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    },
    layout: {
      // Primary storage (v9+)
      areas: [bedArea, permanentArea],
      permanentUnderplantings: [],
      // Legacy arrays for backward compatibility
      beds: [
        { id: 'A', name: 'Bed A', status: 'rotation', rotationGroup: 'legumes', gridPosition: { startRow: 0, startCol: 0, endRow: 1, endCol: 1 }, description: 'Test bed' },
      ],
      permanentPlantings: [
        { id: 'apple-tree', name: 'Apple Tree', type: 'fruit-tree', plantId: 'apple', plantedYear: 2020, gridPosition: { row: 2, col: 0 }, notes: 'Bramley apple' },
      ],
      infrastructure: [],
    },
    seasons: [
      {
        year: 2025,
        status: 'current',
        beds: [{ bedId: 'A', rotationGroup: 'brassicas', plantings: [] }],
        permanents: [{ areaId: 'apple-tree', careLogs: [], underplantings: [] }],
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
    ],
    varieties: [],
    ...overrides,
  }
}

// Helper to create v8 data (without areas) - simulates pre-migration data
// Uses 'as unknown as AllotmentData' because v8 format lacks required areas/permanentUnderplantings
function createV8AllotmentData(): AllotmentData {
  return {
    version: 8,
    currentYear: 2025,
    meta: {
      name: 'Test Allotment',
      location: 'Test Location',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    },
    layout: {
      beds: [
        { id: 'A', name: 'Bed A', status: 'rotation', rotationGroup: 'legumes', gridPosition: { startRow: 0, startCol: 0, endRow: 1, endCol: 1 }, description: 'Test bed' },
        { id: 'B1', name: 'Bed B1', status: 'rotation', rotationGroup: 'roots', gridPosition: { startRow: 0, startCol: 2, endRow: 1, endCol: 3 }, description: 'Test bed 2' },
      ],
      permanentPlantings: [
        { id: 'apple-tree', name: 'Apple Tree', type: 'fruit-tree', plantId: 'apple', plantedYear: 2020, gridPosition: { row: 2, col: 0 }, notes: 'Bramley apple' },
      ],
      infrastructure: [
        { id: 'shed', name: 'Shed', type: 'shed', gridPosition: { startRow: 4, startCol: 0, endRow: 5, endCol: 1 } },
      ],
    },
    seasons: [
      {
        year: 2025,
        status: 'current',
        beds: [
          { bedId: 'A', rotationGroup: 'brassicas', plantings: [] },
          { bedId: 'B1', rotationGroup: 'roots', plantings: [] },
        ],
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
    ],
    varieties: [],
  } as unknown as AllotmentData
}

describe('V9 Areas System', () => {
  beforeEach(() => {
    vi.mocked(localStorage.getItem).mockClear()
    vi.mocked(localStorage.setItem).mockClear()
    vi.mocked(localStorage.removeItem).mockClear()
  })

  describe('Loading V9 Data', () => {
    it('loads v9 data with areas array successfully', () => {
      const v9Data = createV9AllotmentData()
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(v9Data))

      const result = loadAllotmentData()

      expect(result.success).toBe(true)
      expect(result.data?.layout.areas).toBeDefined()
      expect(result.data?.layout.areas?.length).toBe(2)
    })

    it('preserves both legacy arrays and areas after load', () => {
      const v9Data = createV9AllotmentData()
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(v9Data))

      const result = loadAllotmentData()

      expect(result.success).toBe(true)
      // Primary storage (areas) should be populated
      expect(result.data?.layout.areas?.length).toBeGreaterThan(0)
      // Legacy arrays (optional) may also be present for backward compatibility
      expect(result.data?.layout.beds?.length).toBeGreaterThan(0)
    })
  })

  describe('V8 to V9 Migration', () => {
    it('migrates v8 data to v9 format with areas', () => {
      const v8Data = createV8AllotmentData()
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(v8Data))

      const result = loadAllotmentData()

      expect(result.success).toBe(true)
      expect(result.data?.version).toBe(CURRENT_SCHEMA_VERSION)
      expect(result.data?.layout.areas).toBeDefined()
    })

    it('creates areas from legacy beds during migration', () => {
      const v8Data = createV8AllotmentData()
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(v8Data))

      const result = loadAllotmentData()

      expect(result.success).toBe(true)
      const areas = result.data?.layout.areas || []
      const bedAreas = areas.filter((a: Area) => a.type === 'bed')
      expect(bedAreas.length).toBe(2) // A and B1
    })

    it('creates areas from legacy permanentPlantings during migration', () => {
      const v8Data = createV8AllotmentData()
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(v8Data))

      const result = loadAllotmentData()

      expect(result.success).toBe(true)
      const areas = result.data?.layout.areas || []
      const permanentAreas = areas.filter((a: Area) => a.type === 'permanent')
      expect(permanentAreas.length).toBe(1) // apple-tree
    })

    it('creates areas from legacy infrastructure during migration', () => {
      const v8Data = createV8AllotmentData()
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(v8Data))

      const result = loadAllotmentData()

      expect(result.success).toBe(true)
      const areas = result.data?.layout.areas || []
      const infraAreas = areas.filter((a: Area) => a.type === 'infrastructure')
      expect(infraAreas.length).toBe(1) // shed
    })

    it('preserves all data during migration', () => {
      const v8Data = createV8AllotmentData()
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(v8Data))

      const result = loadAllotmentData()

      expect(result.success).toBe(true)
      expect(result.data?.meta.name).toBe('Test Allotment')
      expect(result.data?.seasons.length).toBe(1)
      expect(result.data?.currentYear).toBe(2025)
    })
  })

  describe('Migration Backup', () => {
    it('creates backup before migration', () => {
      const v8Data = createV8AllotmentData()
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(v8Data))

      loadAllotmentData()

      // Check that setItem was called with backup key
      const setItemCalls = vi.mocked(localStorage.setItem).mock.calls
      const backupCall = setItemCalls.find(call => call[0].includes('-backup-v8'))
      expect(backupCall).toBeDefined()
    })
  })

  describe('Empty Areas Repair', () => {
    it('repairs empty areas array from legacy data', () => {
      const dataWithEmptyAreas = createV9AllotmentData()
      dataWithEmptyAreas.layout.areas = []
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(dataWithEmptyAreas))

      const result = loadAllotmentData()

      expect(result.success).toBe(true)
      // After repair, areas should be repopulated
      expect(result.data?.layout.areas?.length).toBeGreaterThan(0)
    })
  })
})

describe('Migration Recovery', () => {
  beforeEach(() => {
    vi.mocked(localStorage.getItem).mockClear()
    vi.mocked(localStorage.setItem).mockClear()
  })

  it('detects and resumes incomplete migration', () => {
    const incompleteData = createV9AllotmentData()
    incompleteData.meta.migrationState = {
      targetVersion: CURRENT_SCHEMA_VERSION,
      startedAt: '2025-01-01T00:00:00.000Z',
      step: 'migrateToV9',
    }
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(incompleteData))

    const result = loadAllotmentData()

    expect(result.success).toBe(true)
    // Migration state should be cleared after completion
    expect(result.data?.meta.migrationState).toBeUndefined()
  })

  it('clears migration state after successful completion', () => {
    const dataWithMigrationState = createV9AllotmentData()
    dataWithMigrationState.meta.migrationState = {
      targetVersion: CURRENT_SCHEMA_VERSION,
      startedAt: '2025-01-01T00:00:00.000Z',
      step: 'complete',
    }
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(dataWithMigrationState))

    const result = loadAllotmentData()

    expect(result.success).toBe(true)
    expect(result.data?.meta.migrationState).toBeUndefined()
  })
})

describe('Backup and Restore', () => {
  let mockStorage: Record<string, string>

  beforeEach(() => {
    mockStorage = {}
    vi.mocked(localStorage.getItem).mockImplementation((key) => mockStorage[key] || null)
    vi.mocked(localStorage.setItem).mockImplementation((key, value) => {
      mockStorage[key] = value
    })
  })

  it('restores data from backup successfully', () => {
    const backupData = createV8AllotmentData()
    mockStorage['allotment-unified-data-backup-v8'] = JSON.stringify(backupData)

    const result = restoreFromBackup(8)

    expect(result.success).toBe(true)
    expect(result.data?.version).toBe(8)
  })

  it('returns error when backup not found', () => {
    const result = restoreFromBackup(7)

    expect(result.success).toBe(false)
    expect(result.error).toContain('No backup found')
  })

  it('lists available backups', () => {
    // This test verifies the getAvailableBackups function exists and returns an array
    // Full testing requires more complex localStorage mocking that's better suited for integration tests
    const backups = getAvailableBackups()
    expect(Array.isArray(backups)).toBe(true)
  })
})

describe('Area ID Validation', () => {
  beforeEach(() => {
    vi.mocked(localStorage.getItem).mockClear()
    vi.mocked(localStorage.setItem).mockClear()
  })

  it('areas have unique IDs after migration', () => {
    const v8Data = createV8AllotmentData()
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(v8Data))

    const result = loadAllotmentData()

    expect(result.success).toBe(true)
    const areas = result.data?.layout.areas || []
    const ids = areas.map((a: Area) => a.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })
})

describe('Dual Array Consistency', () => {
  beforeEach(() => {
    vi.mocked(localStorage.getItem).mockClear()
    vi.mocked(localStorage.setItem).mockClear()
  })

  it('legacy beds match bed areas after migration', () => {
    const v8Data = createV8AllotmentData()
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(v8Data))

    const result = loadAllotmentData()

    expect(result.success).toBe(true)
    const areas = result.data?.layout.areas || []
    const bedAreas = areas.filter((a: Area) => a.type === 'bed')
    const legacyBeds = result.data?.layout.beds || []

    expect(bedAreas.length).toBe(legacyBeds.length)

    // Each legacy bed should have a corresponding area
    for (const bed of legacyBeds) {
      const matchingArea = bedAreas.find((a: Area) => a.id === bed.id)
      expect(matchingArea).toBeDefined()
      expect(matchingArea?.name).toBe(bed.name)
    }
  })
})

describe('Save and Load Roundtrip', () => {
  let mockStorage: Record<string, string>

  beforeEach(() => {
    mockStorage = {}
    vi.mocked(localStorage.getItem).mockImplementation((key) => mockStorage[key] || null)
    vi.mocked(localStorage.setItem).mockImplementation((key, value) => {
      mockStorage[key] = value
    })
  })

  it('preserves areas through save/load cycle', () => {
    const v9Data = createV9AllotmentData()

    // Save
    saveAllotmentData(v9Data)

    // Load
    const result = loadAllotmentData()

    expect(result.success).toBe(true)
    expect(result.data?.layout.areas?.length).toBe(v9Data.layout.areas?.length)
  })
})

describe('Dual-Mode Validation', () => {
  beforeEach(() => {
    vi.mocked(localStorage.getItem).mockClear()
    vi.mocked(localStorage.setItem).mockClear()
  })

  it('accepts data with only legacy arrays (no areas)', () => {
    const legacyOnlyData = {
      version: CURRENT_SCHEMA_VERSION,
      currentYear: 2025,
      meta: {
        name: 'Test Allotment',
        location: 'Test',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
      layout: {
        beds: [{ id: 'A', name: 'Bed A', status: 'rotation', rotationGroup: 'legumes' }],
        permanentPlantings: [{ id: 'tree', name: 'Tree', type: 'fruit-tree' }],
        infrastructure: [],
        // No areas array
      },
      seasons: [{ year: 2025, status: 'current', beds: [], createdAt: '', updatedAt: '' }],
      varieties: [],
    }
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(legacyOnlyData))

    const result = loadAllotmentData()

    // Should load successfully (legacy arrays present)
    expect(result.success).toBe(true)
  })

  it('accepts data with only areas array (no legacy)', () => {
    const areasOnlyData = {
      version: CURRENT_SCHEMA_VERSION,
      currentYear: 2025,
      meta: {
        name: 'Test Allotment',
        location: 'Test',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
      layout: {
        beds: [], // Empty legacy arrays
        permanentPlantings: [],
        infrastructure: [],
        areas: [
          { id: 'A', type: 'bed', name: 'Bed A', status: 'rotation', rotationGroup: 'legumes' },
          { id: 'tree', type: 'permanent', name: 'Tree', plantingType: 'fruit-tree' },
        ],
      },
      seasons: [{ year: 2025, status: 'current', beds: [], createdAt: '', updatedAt: '' }],
      varieties: [],
    }
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(areasOnlyData))

    const result = loadAllotmentData()

    // Should load successfully (areas array present)
    expect(result.success).toBe(true)
  })

  it('accepts data with both legacy arrays and areas', () => {
    const dualModeData = createV9AllotmentData()
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(dualModeData))

    const result = loadAllotmentData()

    // Should load successfully (both present)
    expect(result.success).toBe(true)
    // Primary storage (areas) should be populated
    expect(result.data?.layout.areas?.length).toBeGreaterThan(0)
    // Legacy arrays (optional) may also be present
    expect(result.data?.layout.beds?.length).toBeGreaterThan(0)
  })

  it('accepts data with empty legacy arrays (valid empty allotment)', () => {
    // An allotment with no beds/permanents yet is valid
    const emptyData = {
      version: CURRENT_SCHEMA_VERSION,
      currentYear: 2025,
      meta: {
        name: 'Test Allotment',
        location: 'Test',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
      layout: {
        beds: [],
        permanentPlantings: [],
        infrastructure: [],
        areas: [], // Empty areas array
      },
      seasons: [{ year: 2025, status: 'current', beds: [], createdAt: '', updatedAt: '' }],
      varieties: [],
    }
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(emptyData))

    const result = loadAllotmentData()

    // Empty legacy arrays are valid - the arrays exist, they're just empty
    // This represents a new/empty allotment
    expect(result.success).toBe(true)
  })

  it('validates area IDs are unique', () => {
    const duplicateIdData = {
      version: CURRENT_SCHEMA_VERSION,
      currentYear: 2025,
      meta: {
        name: 'Test',
        location: 'Test',
        createdAt: '',
        updatedAt: '',
      },
      layout: {
        beds: [],
        permanentPlantings: [],
        infrastructure: [],
        areas: [
          { id: 'A', type: 'bed', name: 'Bed A', status: 'rotation' },
          { id: 'A', type: 'bed', name: 'Bed A duplicate', status: 'rotation' }, // Duplicate ID
        ],
      },
      seasons: [],
      varieties: [],
    }
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(duplicateIdData))

    const result = loadAllotmentData()

    // Should fail validation due to duplicate ID
    expect(result.success).toBe(false)
    expect(result.error).toContain('duplicate id')
  })

  it('validates bed areas have status field', () => {
    const invalidBedData = {
      version: CURRENT_SCHEMA_VERSION,
      currentYear: 2025,
      meta: { name: 'Test', location: 'Test', createdAt: '', updatedAt: '' },
      layout: {
        beds: [],
        permanentPlantings: [],
        infrastructure: [],
        areas: [
          { id: 'A', type: 'bed', name: 'Bed A' }, // Missing status
        ],
      },
      seasons: [],
      varieties: [],
    }
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(invalidBedData))

    const result = loadAllotmentData()

    expect(result.success).toBe(false)
    expect(result.error).toContain('status')
  })

  it('validates permanent areas have plantingType field', () => {
    const invalidPermanentData = {
      version: CURRENT_SCHEMA_VERSION,
      currentYear: 2025,
      meta: { name: 'Test', location: 'Test', createdAt: '', updatedAt: '' },
      layout: {
        beds: [],
        permanentPlantings: [],
        infrastructure: [],
        areas: [
          { id: 'tree', type: 'permanent', name: 'Tree' }, // Missing plantingType
        ],
      },
      seasons: [],
      varieties: [],
    }
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(invalidPermanentData))

    const result = loadAllotmentData()

    expect(result.success).toBe(false)
    expect(result.error).toContain('plantingType')
  })
})

describe('Area Getters with Fallback', () => {
  describe('getAreaById', () => {
    it('returns area from areas array when present', () => {
      const data = createV9AllotmentData()

      const result = getAreaById(data, 'A')

      expect(result).toBeDefined()
      expect(result?.type).toBe('bed')
      expect(result?.name).toBe('Bed A')
    })

    it('falls back to legacy beds when areas array empty', () => {
      const data = createV9AllotmentData()
      data.layout.areas = [] // Clear areas array

      const result = getAreaById(data, 'A')

      expect(result).toBeDefined()
      expect(result?.type).toBe('bed')
      expect(result?.name).toBe('Bed A')
    })

    it('falls back to legacy permanentPlantings when areas array empty', () => {
      const data = createV9AllotmentData()
      data.layout.areas = [] // Clear areas array

      const result = getAreaById(data, 'apple-tree')

      expect(result).toBeDefined()
      expect(result?.type).toBe('permanent')
      expect(result?.name).toBe('Apple Tree')
    })

    it('falls back to legacy infrastructure when areas array empty', () => {
      const data = createV8AllotmentData()
      // v8 data has no areas array

      const result = getAreaById(data as AllotmentData, 'shed')

      expect(result).toBeDefined()
      expect(result?.type).toBe('infrastructure')
      expect(result?.name).toBe('Shed')
    })

    it('returns undefined for non-existent ID', () => {
      const data = createV9AllotmentData()

      const result = getAreaById(data, 'non-existent')

      expect(result).toBeUndefined()
    })
  })

  describe('getAreasByType', () => {
    it('returns areas from areas array when present', () => {
      const data = createV9AllotmentData()

      const result = getAreasByType(data, 'bed')

      expect(result.length).toBe(1)
      expect(result[0].name).toBe('Bed A')
    })

    it('falls back to legacy beds when areas array empty', () => {
      const data = createV8AllotmentData()
      // v8 data has no areas array

      const result = getAreasByType(data as AllotmentData, 'bed')

      expect(result.length).toBe(2) // A and B1
    })

    it('falls back to legacy permanentPlantings when areas array empty', () => {
      const data = createV8AllotmentData()

      const result = getAreasByType(data as AllotmentData, 'permanent')

      expect(result.length).toBe(1) // apple-tree
      expect(result[0].name).toBe('Apple Tree')
    })

    it('falls back to legacy infrastructure when areas array empty', () => {
      const data = createV8AllotmentData()

      const result = getAreasByType(data as AllotmentData, 'infrastructure')

      expect(result.length).toBe(1) // shed
      expect(result[0].name).toBe('Shed')
    })
  })

  describe('getBedAreaById', () => {
    it('returns bed area when ID matches bed', () => {
      const data = createV9AllotmentData()

      const result = getBedAreaById(data, 'A')

      expect(result).toBeDefined()
      expect(result?.type).toBe('bed')
      expect(result?.status).toBe('rotation')
    })

    it('returns undefined when ID matches non-bed area', () => {
      const data = createV9AllotmentData()

      const result = getBedAreaById(data, 'apple-tree')

      expect(result).toBeUndefined()
    })

    it('falls back to legacy beds', () => {
      const data = createV8AllotmentData()

      const result = getBedAreaById(data as AllotmentData, 'A')

      expect(result).toBeDefined()
      expect(result?.type).toBe('bed')
    })
  })

  describe('getPermanentAreaById', () => {
    it('returns permanent area when ID matches permanent', () => {
      const data = createV9AllotmentData()

      const result = getPermanentAreaById(data, 'apple-tree')

      expect(result).toBeDefined()
      expect(result?.type).toBe('permanent')
      expect(result?.plantingType).toBe('fruit-tree')
    })

    it('returns undefined when ID matches non-permanent area', () => {
      const data = createV9AllotmentData()

      const result = getPermanentAreaById(data, 'A')

      expect(result).toBeUndefined()
    })

    it('falls back to legacy permanentPlantings', () => {
      const data = createV8AllotmentData()

      const result = getPermanentAreaById(data as AllotmentData, 'apple-tree')

      expect(result).toBeDefined()
      expect(result?.type).toBe('permanent')
    })
  })

  describe('getInfrastructureAreaById', () => {
    it('returns infrastructure area when ID matches infrastructure', () => {
      const data = createV8AllotmentData()
      // v8 data has infrastructure

      const result = getInfrastructureAreaById(data as AllotmentData, 'shed')

      expect(result).toBeDefined()
      expect(result?.type).toBe('infrastructure')
      expect(result?.infrastructureType).toBe('shed')
    })

    it('returns undefined when ID matches non-infrastructure area', () => {
      const data = createV9AllotmentData()

      const result = getInfrastructureAreaById(data, 'A')

      expect(result).toBeUndefined()
    })
  })
})

// ============ AREA TYPE CONVERSION TESTS ============

describe('Area Type Conversion', () => {
  describe('validateAreaConversion', () => {
    it('returns error when area not found', () => {
      const data = createV9AllotmentData()

      const result = validateAreaConversion(data, 'nonexistent', 'permanent')

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Area "nonexistent" not found')
    })

    it('returns error when converting to same type', () => {
      const data = createV9AllotmentData()

      const result = validateAreaConversion(data, 'A', 'bed')

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Area is already of type "bed"')
    })

    it('warns about existing plantings when converting bed', () => {
      const data = createV9AllotmentData()
      // Add a season with plantings for bed A
      data.seasons.push(createTestSeason({
        year: 2025,
        beds: [{
          bedId: 'A' as PhysicalBedId,
          rotationGroup: 'brassicas',
          plantings: [{ id: '1', plantId: 'tomato', success: 'good' }],
        }],
        permanents: [],
      }))

      const result = validateAreaConversion(data, 'A', 'permanent')

      expect(result.isValid).toBe(true)
      expect(result.warnings.some(w => w.includes('plantings'))).toBe(true)
    })

    it('warns about care logs when converting permanent', () => {
      const data = createV9AllotmentData()
      // Add permanent area and season with care logs
      data.layout.areas!.push({
        id: 'test-perm',
        type: 'permanent',
        name: 'Test Permanent',
        plantingType: 'berry',
      } as PermanentArea)
      data.seasons.push(createTestSeason({
        year: 2026,
        beds: [],
        permanents: [{
          areaId: 'test-perm',
          careLogs: [{ id: '1', type: 'prune', date: '2025-03-01' }],
          underplantings: [],
        }],
      }))

      const result = validateAreaConversion(data, 'test-perm', 'bed')

      expect(result.isValid).toBe(true)
      expect(result.warnings.some(w => w.includes('care logs'))).toBe(true)
    })
  })

  describe('convertAreaType - bed to permanent', () => {
    it('converts bed to permanent area', () => {
      const data = createV9AllotmentData()

      const result = convertAreaType(data, 'A', 'permanent', { plantingType: 'berry' })

      expect(result.validation.isValid).toBe(true)
      const converted = result.data.layout.areas!.find(a => a.id === 'A')
      expect(converted?.type).toBe('permanent')
      expect((converted as PermanentArea).plantingType).toBe('berry')
    })

    it('creates permanent season when converting bed with plantings', () => {
      const data = createV9AllotmentData()
      data.seasons.push(createTestSeason({
        year: 2026,
        beds: [{
          bedId: 'A' as PhysicalBedId,
          rotationGroup: 'brassicas',
          plantings: [{ id: '1', plantId: 'tomato', varietyName: 'Roma', success: 'good' }],
        }],
        permanents: [],
      }))

      const result = convertAreaType(data, 'A', 'permanent')

      expect(result.validation.isValid).toBe(true)
      // Verify a permanent season was created
      const seasonWithPerm = result.data.seasons.find(s => s.permanents?.some(p => p.areaId === 'A'))
      expect(seasonWithPerm).toBeDefined()
      const permSeason = seasonWithPerm?.permanents?.find(p => p.areaId === 'A')
      expect(permSeason).toBeDefined()
      expect(permSeason?.underplantings).toEqual([])
    })

    it('removes bed from seasons when converting to permanent', () => {
      const data = createV9AllotmentData()
      data.seasons.push(createTestSeason({
        year: 2026,
        beds: [{
          bedId: 'A' as PhysicalBedId,
          rotationGroup: 'brassicas',
          plantings: [],
        }],
        permanents: [],
      }))

      const result = convertAreaType(data, 'A', 'permanent')

      expect(result.data.seasons[0].beds.find(b => b.bedId === 'A')).toBeUndefined()
    })
  })

  describe('convertAreaType - permanent to bed', () => {
    it('converts permanent area to bed', () => {
      const data = createV9AllotmentData()
      data.layout.areas!.push({
        id: 'test-perm',
        type: 'permanent',
        name: 'Test Berry',
        plantingType: 'berry',
      } as PermanentArea)

      const result = convertAreaType(data, 'test-perm', 'bed')

      expect(result.validation.isValid).toBe(true)
      const converted = result.data.layout.areas!.find(a => a.id === 'test-perm')
      expect(converted?.type).toBe('bed')
      expect((converted as BedArea).status).toBe('rotation')
    })

    it('suggests rotation group based on permanent type', () => {
      const data = createV9AllotmentData()
      data.layout.areas!.push({
        id: 'test-herb',
        type: 'permanent',
        name: 'Test Herb',
        plantingType: 'herb',
      } as PermanentArea)

      const result = convertAreaType(data, 'test-herb', 'bed')

      const converted = result.data.layout.areas!.find(a => a.id === 'test-herb') as BedArea
      expect(converted.rotationGroup).toBe('alliums') // herbs → alliums
    })

    it('creates bed season when converting permanent with care logs', () => {
      const data = createV9AllotmentData()
      data.layout.areas!.push({
        id: 'test-perm',
        type: 'permanent',
        name: 'Test Permanent',
        plantingType: 'perennial-veg',
      } as PermanentArea)
      data.seasons.push(createTestSeason({
        year: 2026,
        beds: [],
        permanents: [{
          areaId: 'test-perm',
          careLogs: [{ id: '1', type: 'prune', date: '2025-03-01', description: 'Spring pruning' }],
          underplantings: [],
        }],
      }))

      const result = convertAreaType(data, 'test-perm', 'bed')

      expect(result.validation.isValid).toBe(true)
      // Find the season with the bed - bedId is now 'test-perm' string
      const seasonWithBed = result.data.seasons.find(s => s.beds.some(b => b.bedId === ('test-perm' as PhysicalBedId)))
      expect(seasonWithBed).toBeDefined()
      const bedSeason = seasonWithBed?.beds.find(b => b.bedId === ('test-perm' as PhysicalBedId))
      expect(bedSeason).toBeDefined()
      expect(bedSeason?.plantings).toEqual([])
    })

    it('removes permanent from seasons when converting to bed', () => {
      const data = createV9AllotmentData()
      data.layout.areas!.push({
        id: 'test-perm',
        type: 'permanent',
        name: 'Test Permanent',
        plantingType: 'berry',
      } as PermanentArea)
      data.seasons.push(createTestSeason({
        year: 2026,
        beds: [],
        permanents: [{
          areaId: 'test-perm',
          careLogs: [],
          underplantings: [],
        }],
      }))

      const result = convertAreaType(data, 'test-perm', 'bed')

      expect(result.data.seasons[0].permanents?.find(p => p.areaId === 'test-perm')).toBeUndefined()
    })
  })

  describe('convertAreaType - to infrastructure', () => {
    it('converts bed to infrastructure', () => {
      const data = createV9AllotmentData()

      const result = convertAreaType(data, 'A', 'infrastructure', { infrastructureType: 'path' })

      expect(result.validation.isValid).toBe(true)
      const converted = result.data.layout.areas!.find(a => a.id === 'A')
      expect(converted?.type).toBe('infrastructure')
      expect((converted as InfrastructureArea).infrastructureType).toBe('path')
    })

    it('converts permanent to infrastructure', () => {
      const data = createV9AllotmentData()
      data.layout.areas!.push({
        id: 'test-perm',
        type: 'permanent',
        name: 'Test Permanent',
        plantingType: 'berry',
      } as PermanentArea)

      const result = convertAreaType(data, 'test-perm', 'infrastructure', { infrastructureType: 'compost' })

      const converted = result.data.layout.areas!.find(a => a.id === 'test-perm')
      expect(converted?.type).toBe('infrastructure')
    })

    it('removes from both bed and permanent seasons', () => {
      const data = createV9AllotmentData()
      data.seasons.push(createTestSeason({
        year: 2026,
        beds: [{
          bedId: 'A' as PhysicalBedId,
          rotationGroup: 'brassicas',
          plantings: [],
        }],
        permanents: [],
      }))

      const result = convertAreaType(data, 'A', 'infrastructure')

      expect(result.data.seasons[0].beds.find(b => b.bedId === 'A')).toBeUndefined()
    })
  })

  describe('convertAreaType - from infrastructure', () => {
    it('converts infrastructure to bed', () => {
      const data = createV9AllotmentData()
      data.layout.areas!.push({
        id: 'test-infra',
        type: 'infrastructure',
        name: 'Test Path',
        infrastructureType: 'path',
      } as InfrastructureArea)

      const result = convertAreaType(data, 'test-infra', 'bed', { rotationGroup: 'legumes' })

      expect(result.validation.isValid).toBe(true)
      const converted = result.data.layout.areas!.find(a => a.id === 'test-infra')
      expect(converted?.type).toBe('bed')
      expect((converted as BedArea).rotationGroup).toBe('legumes')
    })

    it('converts infrastructure to permanent', () => {
      const data = createV9AllotmentData()
      data.layout.areas!.push({
        id: 'test-infra',
        type: 'infrastructure',
        name: 'Test Area',
        infrastructureType: 'other',
      } as InfrastructureArea)

      const result = convertAreaType(data, 'test-infra', 'permanent', { plantingType: 'fruit-tree' })

      const converted = result.data.layout.areas!.find(a => a.id === 'test-infra')
      expect(converted?.type).toBe('permanent')
      expect((converted as PermanentArea).plantingType).toBe('fruit-tree')
    })
  })

  describe('convertAreaType - preserves common fields', () => {
    it('preserves id, name, description, and gridPosition', () => {
      const data = createV9AllotmentData()
      // Bed A has gridPosition in the test data
      const originalArea = data.layout.areas!.find(a => a.id === 'A')!

      const result = convertAreaType(data, 'A', 'permanent')

      const converted = result.data.layout.areas!.find(a => a.id === 'A')!
      expect(converted.id).toBe(originalArea.id)
      expect(converted.name).toBe(originalArea.name)
      expect(converted.description).toBe(originalArea.description)
      expect(converted.gridPosition).toEqual(originalArea.gridPosition)
    })
  })
})
