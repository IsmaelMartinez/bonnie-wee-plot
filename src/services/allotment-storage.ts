/**
 * Allotment Storage Service
 * 
 * Handles all localStorage operations for the unified allotment data.
 * Single source of truth for persisting allotment state.
 */

import {
  AllotmentData,
  SeasonRecord,
  BedSeason,
  Planting,
  NewPlanting,
  PlantingUpdate,
  NewSeasonInput,
  StorageResult,
  MaintenanceTask,
  NewMaintenanceTask,
  BedNote,
  NewBedNote,
  BedNoteUpdate,
  GardenEvent,
  NewGardenEvent,
  StoredVariety,
  NewVariety,
  VarietyUpdate,
  SeedStatus,
  AllotmentItemRef,
  STORAGE_KEY,
  CURRENT_SCHEMA_VERSION,
  // v9 types for unified area system
  Area,
  BedArea,
  PermanentArea,
  InfrastructureArea,
  PermanentUnderplanting,
  NewPermanentUnderplanting,
  SeasonalUnderplanting,
  NewSeasonalUnderplanting,
  CareLogEntry,
  NewCareLogEntry,
  PermanentSeason,
} from '@/types/unified-allotment'
import { PhysicalBedId, RotationGroup, PlantedVariety, SeasonPlan, PermanentPlanting, InfrastructureItem } from '@/types/garden-planner'
import { generateId } from '@/lib/utils'
import { getNextRotationGroup } from '@/lib/rotation'
// Note: variety-allotment-sync.ts removed - varieties now embedded in AllotmentData

// Import legacy data for migration
import { physicalBeds, permanentPlantings, infrastructure } from '@/data/allotment-layout'
import { season2024, season2025 } from '@/data/historical-plans'

// ============ SCHEMA VALIDATION ============

interface ValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * Validate that data conforms to the AllotmentData schema
 * Returns detailed errors for debugging
 * Exported for use in multi-tab sync validation
 */
export function validateAllotmentData(data: unknown): ValidationResult {
  const errors: string[] = []
  
  // Check if data is an object
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Data is not an object'] }
  }
  
  const obj = data as Record<string, unknown>
  
  // Check required top-level fields
  if (typeof obj.version !== 'number') {
    errors.push('Missing or invalid "version" field (expected number)')
  }
  
  if (typeof obj.currentYear !== 'number') {
    errors.push('Missing or invalid "currentYear" field (expected number)')
  }
  
  // Validate meta
  if (!obj.meta || typeof obj.meta !== 'object') {
    errors.push('Missing or invalid "meta" field (expected object)')
  } else {
    const meta = obj.meta as Record<string, unknown>
    if (typeof meta.name !== 'string') {
      errors.push('Missing or invalid "meta.name" field (expected string)')
    }
  }
  
  // Validate layout
  if (!obj.layout || typeof obj.layout !== 'object') {
    errors.push('Missing or invalid "layout" field (expected object)')
  } else {
    const layout = obj.layout as Record<string, unknown>
    if (!Array.isArray(layout.beds)) {
      errors.push('Missing or invalid "layout.beds" field (expected array)')
    }
    if (!Array.isArray(layout.permanentPlantings)) {
      errors.push('Missing or invalid "layout.permanentPlantings" field (expected array)')
    }
    if (!Array.isArray(layout.infrastructure)) {
      errors.push('Missing or invalid "layout.infrastructure" field (expected array)')
    }
  }
  
  // Validate seasons
  if (!Array.isArray(obj.seasons)) {
    errors.push('Missing or invalid "seasons" field (expected array)')
  } else {
    // Validate each season
    (obj.seasons as unknown[]).forEach((season, index) => {
      if (!season || typeof season !== 'object') {
        errors.push(`Season at index ${index} is not an object`)
        return
      }
      const s = season as Record<string, unknown>
      if (typeof s.year !== 'number') {
        errors.push(`Season at index ${index}: missing or invalid "year" field`)
      }
      if (!Array.isArray(s.beds)) {
        errors.push(`Season at index ${index}: missing or invalid "beds" field`)
      }
    })
  }
  
  return { valid: errors.length === 0, errors }
}

/**
 * Attempt to repair common data issues
 * Returns repaired data or null if unrepairable
 */
function attemptDataRepair(data: unknown): AllotmentData | null {
  if (!data || typeof data !== 'object') return null
  
  const obj = data as Record<string, unknown>
  
  try {
    // Ensure required fields have defaults
    const repaired: AllotmentData = {
      version: typeof obj.version === 'number' ? obj.version : CURRENT_SCHEMA_VERSION,
      currentYear: typeof obj.currentYear === 'number' ? obj.currentYear : new Date().getFullYear(),
      meta: {
        name: 'My Allotment',
        location: 'Unknown',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...(obj.meta && typeof obj.meta === 'object' ? obj.meta as object : {}),
      },
      layout: {
        beds: [],
        permanentPlantings: [],
        infrastructure: [],
        ...(obj.layout && typeof obj.layout === 'object' ? obj.layout as object : {}),
      },
      seasons: Array.isArray(obj.seasons) ? obj.seasons as AllotmentData['seasons'] : [],
      varieties: Array.isArray(obj.varieties) ? obj.varieties as AllotmentData['varieties'] : [],
    }
    
    // Validate the repaired data
    const validation = validateAllotmentData(repaired)
    if (validation.valid) {
      console.warn('Data was repaired with defaults')
      return repaired
    }
    
    return null
  } catch {
    return null
  }
}

// ============ CORE STORAGE OPERATIONS ============

/**
 * Load allotment data from localStorage
 * Includes schema validation and repair attempts
 */
export function loadAllotmentData(): StorageResult<AllotmentData> {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Not in browser environment' }
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    
    if (!stored) {
      // No data exists - will need to migrate from legacy or create fresh
      return { success: false, error: 'No data found' }
    }

    let data: unknown
    try {
      data = JSON.parse(stored)
    } catch (parseError) {
      console.error('Failed to parse stored JSON:', parseError)
      return { success: false, error: 'Corrupted data: invalid JSON' }
    }
    
    // Validate the parsed data
    const validation = validateAllotmentData(data)
    
    if (!validation.valid) {
      console.warn('Schema validation failed:', validation.errors)
      
      // Attempt to repair
      const repaired = attemptDataRepair(data)
      if (repaired) {
        console.log('Data repaired successfully')
        saveAllotmentData(repaired)
        return { success: true, data: repaired }
      }
      
      return { 
        success: false, 
        error: `Invalid data schema: ${validation.errors.join(', ')}` 
      }
    }
    
    const validData = data as AllotmentData

    // Check version and migrate if needed
    if (validData.version !== CURRENT_SCHEMA_VERSION) {
      const migrated = migrateSchema(validData)
      saveAllotmentData(migrated)
      return { success: true, data: migrated }
    }

    // Ensure permanentPlantings is populated (repair if somehow cleared)
    if (!validData.layout.permanentPlantings || validData.layout.permanentPlantings.length === 0) {
      console.log('Repairing: populating empty permanentPlantings from default layout')
      const repaired = {
        ...validData,
        layout: {
          ...validData.layout,
          permanentPlantings: permanentPlantings,
        },
      }
      saveAllotmentData(repaired)
      return { success: true, data: repaired }
    }

    return { success: true, data: validData }
  } catch (error) {
    console.error('Failed to load allotment data:', error)
    return { success: false, error: 'Failed to load stored data' }
  }
}

/**
 * Check if an error is a quota exceeded error
 */
function isQuotaExceededError(error: unknown): boolean {
  if (error instanceof DOMException) {
    // Most browsers
    if (error.code === 22 || error.name === 'QuotaExceededError') {
      return true
    }
    // Firefox
    if (error.code === 1014 || error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
      return true
    }
  }
  return false
}

/**
 * Calculate approximate size of data in bytes
 */
function getDataSizeBytes(data: AllotmentData): number {
  try {
    return new Blob([JSON.stringify(data)]).size
  } catch {
    return JSON.stringify(data).length * 2 // Rough estimate: 2 bytes per char
  }
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

/**
 * Save allotment data to localStorage
 * Handles quota exceeded errors gracefully
 */
export function saveAllotmentData(data: AllotmentData): StorageResult<void> {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Not in browser environment' }
  }

  try {
    // Update the updatedAt timestamp
    const dataToSave: AllotmentData = {
      ...data,
      meta: {
        ...data.meta,
        updatedAt: new Date().toISOString(),
      },
    }
    
    const jsonString = JSON.stringify(dataToSave)
    
    try {
      localStorage.setItem(STORAGE_KEY, jsonString)
      return { success: true }
    } catch (error) {
      if (isQuotaExceededError(error)) {
        const dataSize = formatBytes(getDataSizeBytes(dataToSave))
        console.error(`localStorage quota exceeded. Data size: ${dataSize}`)
        
        return { 
          success: false, 
          error: `Storage quota exceeded (data size: ${dataSize}). Consider exporting and clearing old seasons.`
        }
      }
      throw error // Re-throw if not quota error
    }
  } catch (error) {
    console.error('Failed to save allotment data:', error)
    return { success: false, error: 'Failed to save data' }
  }
}

/**
 * Get current localStorage usage statistics
 */
export function getStorageStats(): { used: string; dataSize: string } | null {
  if (typeof window === 'undefined') return null
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    const dataSize = stored ? formatBytes(stored.length * 2) : '0 B'
    
    // Estimate total localStorage usage
    let totalUsed = 0
    for (const key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        totalUsed += localStorage.getItem(key)?.length ?? 0
      }
    }
    
    return {
      used: formatBytes(totalUsed * 2),
      dataSize,
    }
  } catch {
    return null
  }
}

/**
 * Clear all allotment data (use with caution!)
 */
export function clearAllotmentData(): StorageResult<void> {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Not in browser environment' }
  }

  try {
    localStorage.removeItem(STORAGE_KEY)
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to clear data' }
  }
}

// ============ SCHEMA MIGRATION ============

/**
 * Migrate data from older schema versions
 */
function migrateSchema(data: AllotmentData): AllotmentData {
  const migrated = { ...data }

  // Version 1 -> 2: Add maintenance tasks array
  if (migrated.version < 2) {
    migrated.maintenanceTasks = migrated.maintenanceTasks || []
    console.log('Migrated to schema v2: added maintenanceTasks')
  }

  // Version 2 -> 3: Add notes array to BedSeason (no action needed, notes is optional)
  if (migrated.version < 3) {
    console.log('Migrated to schema v3: bed notes support added')
  }

  // Version 3 -> 4: Migrate problemNotes from layout.beds to BedNotes for 2025
  if (migrated.version < 4) {
    const now = new Date().toISOString()
    const problemNotesMap: Record<string, string> = {
      'C': 'Too shaded by apple tree. Peas did poorly. Consider shade-tolerant perennials like asparagus or rhubarb expansion.',
      'E': 'French beans + sunflowers competition failed. Retry with just beans or consider perennials.',
      'raspberries': 'Area is too large - plan to reduce and reclaim space for rotation beds.',
    }

    // Add notes to 2025 season beds
    migrated.seasons = migrated.seasons.map(season => {
      if (season.year !== 2025) return season

      return {
        ...season,
        beds: season.beds.map(bed => {
          const problemNote = problemNotesMap[bed.bedId]
          if (!problemNote) return bed

          // Only add if no notes exist yet
          if (bed.notes && bed.notes.length > 0) return bed

          return {
            ...bed,
            notes: [{
              id: generateId('note'),
              content: problemNote,
              type: 'warning' as const,
              createdAt: now,
              updatedAt: now,
            }],
          }
        }),
      }
    })

    // Remove problemNotes from layout.beds (create new objects without the field)
    migrated.layout = {
      ...migrated.layout,
      beds: migrated.layout.beds.map(({ id, name, description, status, rotationGroup }) => ({
        id, name, description, status, rotationGroup,
      })),
    }

    console.log('Migrated to schema v4: problemNotes converted to BedNotes for 2025')
  }

  // Version 4 -> 5: Add gardenEvents array
  if (migrated.version < 5) {
    migrated.gardenEvents = migrated.gardenEvents || []
    console.log('Migrated to schema v5: added gardenEvents')
  }

  // Version 5 -> 6: Add varieties array (consolidated from separate storage)
  if (migrated.version < 6) {
    migrated.varieties = migrated.varieties || []
    console.log('Migrated to schema v6: added varieties')
  }

  // Version 6 -> 7: Add plantId to permanent plantings for vegetable database lookup
  if (migrated.version < 7) {
    // Map permanent planting IDs to vegetable database IDs
    const PERMANENT_TO_PLANT_ID: Record<string, string> = {
      'apple-north': 'apple-tree',
      'apple-south-west': 'apple-tree',
      'apple-south': 'apple-tree',
      'cherry-tree': 'cherry-tree',
      'damson': 'damson-tree',
      'raspberries-main': 'raspberry',
      'blueberry': 'blueberry',
      'gooseberry': 'gooseberry',
      'blackcurrant': 'blackcurrant',
      'rhubarb': 'rhubarb',
      'strawberries-damson': 'strawberry',
      'strawberries-b1prime': 'strawberry',
      'oregano': 'oregano',
      'herbs-shed': 'mixed-herbs',
    }

    // If permanentPlantings is empty, populate from default layout
    if (!migrated.layout.permanentPlantings || migrated.layout.permanentPlantings.length === 0) {
      migrated.layout.permanentPlantings = permanentPlantings.map(planting => {
        const plantId = PERMANENT_TO_PLANT_ID[planting.id]
        return plantId ? { ...planting, plantId } : planting
      })
      console.log('Migrated to schema v7: populated permanentPlantings from default layout')
    } else {
      // Add plantId to existing permanentPlantings
      migrated.layout.permanentPlantings = migrated.layout.permanentPlantings.map(planting => {
        const plantId = PERMANENT_TO_PLANT_ID[planting.id]
        return plantId ? { ...planting, plantId } : planting
      })
      console.log('Migrated to schema v7: added plantId to permanent plantings')
    }

    // If infrastructure is empty, populate from default layout
    if (!migrated.layout.infrastructure || migrated.layout.infrastructure.length === 0) {
      migrated.layout.infrastructure = infrastructure
      console.log('Migrated to schema v7: populated infrastructure from default layout')
    }
  }

  // Version 8 -> 9: Unified Area System with underplantings and care logging
  if (migrated.version < 9) {
    const v9Data = migrateToV9(migrated)
    v9Data.version = CURRENT_SCHEMA_VERSION
    console.log('Migrated to schema v9: unified area system with underplantings and care logging')
    return v9Data
  }

  migrated.version = CURRENT_SCHEMA_VERSION
  return migrated
}

/**
 * Migrate from v8 to v9: Unified Area System
 * - Converts beds, permanentPlantings, infrastructure to unified areas array
 * - Detects existing underplantings (strawberries-damson)
 * - Initializes PermanentSeason for each permanent area in each year
 */
function migrateToV9(data: AllotmentData): AllotmentData {
  const migrated = { ...data }

  // Map permanent planting types to PermanentArea plantingType
  const TYPE_MAP: Record<string, PermanentArea['plantingType']> = {
    'fruit-tree': 'fruit-tree',
    'berry': 'berry',
    'perennial-veg': 'perennial-veg',
    'herb': 'herb',
  }

  // Convert beds to BedArea
  const bedAreas: BedArea[] = migrated.layout.beds.map(bed => ({
    id: bed.id,
    type: 'bed' as const,
    name: bed.name,
    description: bed.description,
    status: bed.status,
    rotationGroup: bed.rotationGroup,
    gridPosition: bed.gridPosition,
  }))

  // Convert permanentPlantings to PermanentArea
  const permanentAreas: PermanentArea[] = migrated.layout.permanentPlantings.map(p => ({
    id: p.id,
    type: 'permanent' as const,
    name: p.name,
    description: p.notes,
    plantingType: TYPE_MAP[p.type] || 'perennial-veg',
    plantId: p.plantId,
    variety: p.variety,
    plantedYear: p.plantedYear,
    gridPosition: p.gridPosition ? {
      startRow: p.gridPosition.row,
      startCol: p.gridPosition.col,
      endRow: p.gridPosition.row,
      endCol: p.gridPosition.col,
    } : undefined,
  }))

  // Convert infrastructure to InfrastructureArea
  const infrastructureAreas: InfrastructureArea[] = migrated.layout.infrastructure.map(i => ({
    id: i.id,
    type: 'infrastructure' as const,
    name: i.name,
    infrastructureType: i.type,
    gridPosition: i.gridPosition,
  }))

  // Combine all areas
  const areas: Area[] = [...bedAreas, ...permanentAreas, ...infrastructureAreas]

  // Detect underplantings from existing data
  // strawberries-damson is a separate permanent planting but should be an underplanting of damson
  const permanentUnderplantings: PermanentUnderplanting[] = []
  const UNDERPLANTING_PATTERNS: Array<{ childId: string; parentId: string; plantId: string }> = [
    { childId: 'strawberries-damson', parentId: 'damson', plantId: 'strawberry' },
  ]

  for (const pattern of UNDERPLANTING_PATTERNS) {
    const child = migrated.layout.permanentPlantings.find(p => p.id === pattern.childId)
    if (child) {
      permanentUnderplantings.push({
        id: generateId('underplanting'),
        parentAreaId: pattern.parentId,
        plantId: pattern.plantId,
        variety: child.variety,
        plantedYear: child.plantedYear,
        notes: child.notes,
      })
    }
  }

  // Initialize PermanentSeason for each permanent area in each existing year
  const permanentAreaIds = permanentAreas.map(a => a.id)
  migrated.seasons = migrated.seasons.map(season => ({
    ...season,
    permanents: permanentAreaIds.map(areaId => ({
      areaId,
      careLogs: [],
      underplantings: [],
    })),
  }))

  // Update layout with unified areas
  migrated.layout = {
    ...migrated.layout,
    areas,
    permanentUnderplantings,
  }

  return migrated
}

// ============ LEGACY DATA MIGRATION ============

/**
 * Check if migration from legacy data is needed
 */
export function needsLegacyMigration(): boolean {
  if (typeof window === 'undefined') return false
  
  const stored = localStorage.getItem(STORAGE_KEY)
  return !stored
}

/**
 * Convert a legacy PlantedVariety to the new Planting format
 */
function convertPlanting(legacy: PlantedVariety): Planting {
  return {
    id: legacy.id,
    plantId: legacy.plantId,
    varietyName: legacy.varietyName,
    sowDate: legacy.sowDate,
    transplantDate: legacy.transplantDate,
    harvestDate: legacy.harvestDate,
    success: legacy.success,
    notes: legacy.notes,
    quantity: legacy.quantity,
  }
}

/**
 * Convert a legacy SeasonPlan to the new SeasonRecord format
 */
function convertSeason(legacy: SeasonPlan, status: 'historical' | 'current'): SeasonRecord {
  // Group plantings by bed ID
  const bedMap = new Map<PhysicalBedId, BedSeason>()
  
  // Initialize beds from the legacy bed plans
  for (const bedPlan of legacy.beds) {
    bedMap.set(bedPlan.bedId, {
      bedId: bedPlan.bedId,
      rotationGroup: bedPlan.rotationGroup,
      plantings: bedPlan.plantings.map(convertPlanting),
    })
  }
  
  return {
    year: legacy.year,
    status,
    beds: Array.from(bedMap.values()),
    notes: legacy.notes,
    createdAt: legacy.createdAt,
    updatedAt: legacy.updatedAt,
  }
}

/**
 * Create initial AllotmentData from legacy hardcoded data
 */
export function migrateFromLegacyData(): AllotmentData {
  const now = new Date().toISOString()
  const currentYear = new Date().getFullYear()

  // Problem notes to migrate to BedNotes for 2025
  const problemNotesMap: Record<string, string> = {
    'C': 'Too shaded by apple tree. Peas did poorly. Consider shade-tolerant perennials like asparagus or rhubarb expansion.',
    'E': 'French beans + sunflowers competition failed. Retry with just beans or consider perennials.',
    'raspberries': 'Area is too large - plan to reduce and reclaim space for rotation beds.',
  }

  // Convert legacy seasons and add BedNotes for 2025
  const convertedSeason2024 = convertSeason(season2024, 'historical')
  const convertedSeason2025 = convertSeason(season2025, currentYear === 2025 ? 'current' : 'historical')

  // Add BedNotes to 2025 season
  const season2025WithNotes: SeasonRecord = {
    ...convertedSeason2025,
    beds: convertedSeason2025.beds.map(bed => {
      const problemNote = problemNotesMap[bed.bedId]
      if (!problemNote) return bed

      return {
        ...bed,
        notes: [{
          id: generateId('note'),
          content: problemNote,
          type: 'warning' as const,
          createdAt: now,
          updatedAt: now,
        }],
      }
    }),
  }

  const seasons: SeasonRecord[] = [convertedSeason2024, season2025WithNotes]

  // If current year is after 2025, create a season for it with auto-rotation
  if (currentYear > 2025) {
    const currentYearBeds: BedSeason[] = physicalBeds
      .filter(bed => bed.status !== 'perennial')
      .map(bed => {
        // Find 2025 bed to auto-rotate from
        const previousBed = season2025WithNotes.beds.find(b => b.bedId === bed.id)
        const rotationGroup = previousBed?.rotationGroup
          ? getNextRotationGroup(previousBed.rotationGroup)
          : bed.rotationGroup || 'legumes'
        return {
          bedId: bed.id,
          rotationGroup,
          plantings: [],
        }
      })

    const currentYearSeason: SeasonRecord = {
      year: currentYear,
      status: 'current',
      beds: currentYearBeds,
      createdAt: now,
      updatedAt: now,
    }
    seasons.push(currentYearSeason)
  }

  // Remove problemNotes from beds in layout (create new objects without the field)
  const bedsWithoutProblemNotes = physicalBeds.map(({ id, name, description, status, rotationGroup }) => ({
    id, name, description, status, rotationGroup,
  }))

  // Create initial data structure (v8 format first)
  const v8Data: AllotmentData = {
    version: 8, // Start as v8 so we can apply v9 migration
    meta: {
      name: 'My Edinburgh Allotment',
      location: 'Edinburgh, Scotland',
      createdAt: now,
      updatedAt: now,
    },
    layout: {
      beds: bedsWithoutProblemNotes,
      permanentPlantings: permanentPlantings,
      infrastructure: infrastructure,
    },
    seasons,
    currentYear, // Use actual current year, not hardcoded 2025
    varieties: [], // Empty array - users will add their own varieties
  }

  // Apply v9 migration to add unified areas, underplantings, and permanent seasons
  const data = migrateToV9(v8Data)
  data.version = CURRENT_SCHEMA_VERSION

  return data
}

/**
 * Initialize storage with legacy data if empty
 * Returns the loaded or migrated data
 */
export function initializeStorage(): StorageResult<AllotmentData> {
  // Try to load existing data first
  const loadResult = loadAllotmentData()
  
  if (loadResult.success && loadResult.data) {
    return loadResult
  }
  
  // No existing data - migrate from legacy
  const migratedData = migrateFromLegacyData()
  const saveResult = saveAllotmentData(migratedData)
  
  if (!saveResult.success) {
    return { success: false, error: 'Failed to save migrated data' }
  }
  
  return { success: true, data: migratedData }
}

// ============ SEASON OPERATIONS ============

/**
 * Get all available years from the data
 */
export function getAvailableYears(data: AllotmentData): number[] {
  return data.seasons
    .map(s => s.year)
    .sort((a, b) => b - a) // Descending (most recent first)
}

/**
 * Get a specific season by year
 */
export function getSeasonByYear(data: AllotmentData, year: number): SeasonRecord | undefined {
  return data.seasons.find(s => s.year === year)
}

/**
 * Get the current season
 */
export function getCurrentSeason(data: AllotmentData): SeasonRecord | undefined {
  return getSeasonByYear(data, data.currentYear)
}

/**
 * Add a new season
 * Automatically rotates beds based on previous year's rotation groups
 */
export function addSeason(data: AllotmentData, input: NewSeasonInput): AllotmentData {
  const now = new Date().toISOString()

  // Find previous year's season for auto-rotation
  const previousYear = input.year - 1
  const previousSeason = data.seasons.find(s => s.year === previousYear)

  // Create bed seasons for all rotation beds (not perennial)
  const bedSeasons: BedSeason[] = data.layout.beds
    .filter(bed => bed.status !== 'perennial')
    .map(bed => {
      // Auto-rotate based on previous year, if it exists
      const previousBed = previousSeason?.beds.find(b => b.bedId === bed.id)
      const rotationGroup = previousBed?.rotationGroup
        ? getNextRotationGroup(previousBed.rotationGroup)
        : bed.rotationGroup || 'legumes'

      // Debug logging
      console.log(`[AUTO-ROTATE] Bed ${bed.id} for ${input.year}:`, {
        previousYear,
        previousRotation: previousBed?.rotationGroup,
        newRotation: rotationGroup,
        rotated: !!previousBed?.rotationGroup
      })

      return {
        bedId: bed.id,
        rotationGroup,
        plantings: [],
      }
    })

  // Initialize permanent seasons for all permanent areas (v9)
  const permanentAreaIds = (data.layout.areas || [])
    .filter((a): a is PermanentArea => a.type === 'permanent')
    .map(a => a.id)

  const newSeason: SeasonRecord = {
    year: input.year,
    status: input.status || 'planned',
    beds: bedSeasons,
    permanents: permanentAreaIds.map(areaId => ({
      areaId,
      careLogs: [],
      underplantings: [],
    })),
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
  }

  return {
    ...data,
    seasons: [...data.seasons, newSeason],
    currentYear: input.year, // Switch to the new season
  }
}

/**
 * Remove a season by year
 * Cannot remove if it's the only season
 */
export function removeSeason(data: AllotmentData, year: number): AllotmentData {
  // Don't allow removing the last season
  if (data.seasons.length <= 1) {
    return data
  }

  const filteredSeasons = data.seasons.filter(s => s.year !== year)

  // If we removed the current year, switch to the most recent remaining year
  let newCurrentYear = data.currentYear
  if (data.currentYear === year) {
    const years = filteredSeasons.map(s => s.year).sort((a, b) => b - a)
    newCurrentYear = years[0]
  }

  return {
    ...data,
    seasons: filteredSeasons,
    currentYear: newCurrentYear,
  }
}

/**
 * Update a season's metadata (notes, status)
 */
export function updateSeason(
  data: AllotmentData,
  year: number,
  updates: Partial<Pick<SeasonRecord, 'notes' | 'status'>>
): AllotmentData {
  return {
    ...data,
    seasons: data.seasons.map(s =>
      s.year === year
        ? { ...s, ...updates, updatedAt: new Date().toISOString() }
        : s
    ),
  }
}

/**
 * Set the current year
 */
export function setCurrentYear(data: AllotmentData, year: number): AllotmentData {
  return {
    ...data,
    currentYear: year,
  }
}

// ============ BED SEASON OPERATIONS ============

/**
 * Get a specific bed's season data
 */
export function getBedSeason(
  data: AllotmentData, 
  year: number, 
  bedId: PhysicalBedId
): BedSeason | undefined {
  const season = getSeasonByYear(data, year)
  return season?.beds.find(b => b.bedId === bedId)
}

/**
 * Update a bed's rotation group for a season
 */
export function updateBedRotationGroup(
  data: AllotmentData,
  year: number,
  bedId: PhysicalBedId,
  rotationGroup: RotationGroup
): AllotmentData {
  return {
    ...data,
    seasons: data.seasons.map(season => {
      if (season.year !== year) return season

      // Check if the bed exists in this season
      const existingBed = season.beds.find(b => b.bedId === bedId)

      return {
        ...season,
        updatedAt: new Date().toISOString(),
        beds: existingBed
          ? season.beds.map(bed =>
              bed.bedId === bedId
                ? { ...bed, rotationGroup }
                : bed
            )
          : [...season.beds, { bedId, rotationGroup, plantings: [] }],
      }
    }),
  }
}

// ============ PLANTING OPERATIONS ============

/**
 * Generate a unique ID for a planting
 */
export function generatePlantingId(): string {
  return generateId('planting')
}

/**
 * Add a planting to a bed in a season
 */
export function addPlanting(
  data: AllotmentData,
  year: number,
  bedId: PhysicalBedId,
  planting: NewPlanting
): AllotmentData {
  const newPlanting: Planting = {
    ...planting,
    id: generatePlantingId(),
  }

  return {
    ...data,
    seasons: data.seasons.map(season => {
      if (season.year !== year) return season

      return {
        ...season,
        updatedAt: new Date().toISOString(),
        beds: season.beds.map(bed => {
          if (bed.bedId !== bedId) return bed

          return {
            ...bed,
            plantings: [...bed.plantings, newPlanting],
          }
        }),
      }
    }),
  }
}

/**
 * Update a planting
 */
export function updatePlanting(
  data: AllotmentData,
  year: number,
  bedId: PhysicalBedId,
  plantingId: string,
  updates: PlantingUpdate
): AllotmentData {
  return {
    ...data,
    seasons: data.seasons.map(season => {
      if (season.year !== year) return season
      
      return {
        ...season,
        updatedAt: new Date().toISOString(),
        beds: season.beds.map(bed => {
          if (bed.bedId !== bedId) return bed
          
          return {
            ...bed,
            plantings: bed.plantings.map(p => 
              p.id === plantingId ? { ...p, ...updates } : p
            ),
          }
        }),
      }
    }),
  }
}

/**
 * Remove a planting
 */
export function removePlanting(
  data: AllotmentData,
  year: number,
  bedId: PhysicalBedId,
  plantingId: string
): AllotmentData {
  return {
    ...data,
    seasons: data.seasons.map(season => {
      if (season.year !== year) return season
      
      return {
        ...season,
        updatedAt: new Date().toISOString(),
        beds: season.beds.map(bed => {
          if (bed.bedId !== bedId) return bed
          
          return {
            ...bed,
            plantings: bed.plantings.filter(p => p.id !== plantingId),
          }
        }),
      }
    }),
  }
}

/**
 * Get all plantings for a bed in a season
 */
export function getPlantingsForBed(
  data: AllotmentData,
  year: number,
  bedId: PhysicalBedId
): Planting[] {
  const bedSeason = getBedSeason(data, year, bedId)
  return bedSeason?.plantings || []
}

// ============ BED NOTE OPERATIONS ============

/**
 * Generate a unique ID for a bed note
 */
export function generateBedNoteId(): string {
  return generateId('note')
}

/**
 * Get all notes for a bed in a season
 */
export function getBedNotes(
  data: AllotmentData,
  year: number,
  bedId: PhysicalBedId
): BedNote[] {
  const bedSeason = getBedSeason(data, year, bedId)
  return bedSeason?.notes || []
}

/**
 * Add a note to a bed in a season
 */
export function addBedNote(
  data: AllotmentData,
  year: number,
  bedId: PhysicalBedId,
  note: NewBedNote
): AllotmentData {
  const now = new Date().toISOString()
  const newNote: BedNote = {
    ...note,
    id: generateBedNoteId(),
    createdAt: now,
    updatedAt: now,
  }

  return {
    ...data,
    seasons: data.seasons.map(season => {
      if (season.year !== year) return season

      return {
        ...season,
        updatedAt: now,
        beds: season.beds.map(bed => {
          if (bed.bedId !== bedId) return bed

          return {
            ...bed,
            notes: [...(bed.notes || []), newNote],
          }
        }),
      }
    }),
  }
}

/**
 * Update a bed note
 */
export function updateBedNote(
  data: AllotmentData,
  year: number,
  bedId: PhysicalBedId,
  noteId: string,
  updates: BedNoteUpdate
): AllotmentData {
  const now = new Date().toISOString()

  return {
    ...data,
    seasons: data.seasons.map(season => {
      if (season.year !== year) return season

      return {
        ...season,
        updatedAt: now,
        beds: season.beds.map(bed => {
          if (bed.bedId !== bedId) return bed

          return {
            ...bed,
            notes: (bed.notes || []).map(note =>
              note.id === noteId
                ? { ...note, ...updates, updatedAt: now }
                : note
            ),
          }
        }),
      }
    }),
  }
}

/**
 * Remove a bed note
 */
export function removeBedNote(
  data: AllotmentData,
  year: number,
  bedId: PhysicalBedId,
  noteId: string
): AllotmentData {
  return {
    ...data,
    seasons: data.seasons.map(season => {
      if (season.year !== year) return season

      return {
        ...season,
        updatedAt: new Date().toISOString(),
        beds: season.beds.map(bed => {
          if (bed.bedId !== bedId) return bed

          return {
            ...bed,
            notes: (bed.notes || []).filter(note => note.id !== noteId),
          }
        }),
      }
    }),
  }
}

// ============ GARDEN EVENTS OPERATIONS ============

/**
 * Get all garden events
 */
export function getGardenEvents(data: AllotmentData): GardenEvent[] {
  return data.gardenEvents || []
}

/**
 * Get garden events for a specific date range
 */
export function getGardenEventsInRange(
  data: AllotmentData,
  startDate: string,
  endDate: string
): GardenEvent[] {
  return (data.gardenEvents || []).filter(event => {
    return event.date >= startDate && event.date <= endDate
  })
}

/**
 * Add a garden event
 */
export function addGardenEvent(
  data: AllotmentData,
  event: NewGardenEvent
): AllotmentData {
  const now = new Date().toISOString()
  const newEvent: GardenEvent = {
    ...event,
    id: generateId('event'),
    createdAt: now,
  }

  return {
    ...data,
    gardenEvents: [...(data.gardenEvents || []), newEvent],
    meta: {
      ...data.meta,
      updatedAt: now,
    },
  }
}

/**
 * Remove a garden event
 */
export function removeGardenEvent(
  data: AllotmentData,
  eventId: string
): AllotmentData {
  return {
    ...data,
    gardenEvents: (data.gardenEvents || []).filter(e => e.id !== eventId),
    meta: {
      ...data.meta,
      updatedAt: new Date().toISOString(),
    },
  }
}

// ============ LAYOUT OPERATIONS ============

// ============ BACKWARD COMPATIBILITY HELPERS (v9) ============

/**
 * Get beds from unified areas array (v9 backward compatibility)
 * Falls back to legacy layout.beds if areas not available
 */
export function getBedsFromAreas(data: AllotmentData): import('@/types/garden-planner').PhysicalBed[] {
  if (data.layout.areas && data.layout.areas.length > 0) {
    return data.layout.areas
      .filter((a): a is BedArea => a.type === 'bed')
      .map(a => ({
        id: a.id as PhysicalBedId,
        name: a.name,
        description: a.description,
        status: a.status,
        rotationGroup: a.rotationGroup,
        gridPosition: a.gridPosition,
      }))
  }
  return data.layout.beds
}

/**
 * Get permanent plantings from unified areas array (v9 backward compatibility)
 * Falls back to legacy layout.permanentPlantings if areas not available
 */
export function getPermanentPlantingsFromAreas(data: AllotmentData): PermanentPlanting[] {
  if (data.layout.areas && data.layout.areas.length > 0) {
    return data.layout.areas
      .filter((a): a is PermanentArea => a.type === 'permanent')
      .map(a => ({
        id: a.id,
        name: a.name,
        type: a.plantingType,
        plantId: a.plantId,
        variety: a.variety,
        plantedYear: a.plantedYear,
        notes: a.description,
        gridPosition: a.gridPosition ? {
          row: a.gridPosition.startRow,
          col: a.gridPosition.startCol,
        } : undefined,
      }))
  }
  return data.layout.permanentPlantings
}

/**
 * Get infrastructure from unified areas array (v9 backward compatibility)
 * Falls back to legacy layout.infrastructure if areas not available
 */
export function getInfrastructureFromAreas(data: AllotmentData): InfrastructureItem[] {
  if (data.layout.areas && data.layout.areas.length > 0) {
    return data.layout.areas
      .filter((a): a is InfrastructureArea => a.type === 'infrastructure')
      .map(a => ({
        id: a.id,
        type: a.infrastructureType,
        name: a.name,
        gridPosition: a.gridPosition,
      }))
  }
  return data.layout.infrastructure
}

/**
 * Get an area by ID from the unified areas array
 */
export function getAreaById(data: AllotmentData, id: string): Area | undefined {
  return data.layout.areas?.find(a => a.id === id)
}

/**
 * Get areas by type from the unified areas array
 */
export function getAreasByType<T extends Area['type']>(
  data: AllotmentData,
  type: T
): Extract<Area, { type: T }>[] {
  return (data.layout.areas || []).filter((a): a is Extract<Area, { type: T }> => a.type === type)
}

/**
 * Resolved item from an AllotmentItemRef
 */
export type ResolvedItem =
  | { type: 'bed'; item: import('@/types/garden-planner').PhysicalBed }
  | { type: 'permanent'; item: PermanentPlanting }
  | { type: 'infrastructure'; item: InfrastructureItem }
  | null

/**
 * Resolve an AllotmentItemRef to the actual item data
 * Returns null if the item is not found
 */
export function resolveItemRef(data: AllotmentData, ref: AllotmentItemRef): ResolvedItem {
  switch (ref.type) {
    case 'bed': {
      const bed = data.layout.beds.find(b => b.id === ref.id)
      return bed ? { type: 'bed', item: bed } : null
    }
    case 'permanent': {
      const planting = data.layout.permanentPlantings.find(p => p.id === ref.id)
      return planting ? { type: 'permanent', item: planting } : null
    }
    case 'infrastructure': {
      const infra = data.layout.infrastructure.find(i => i.id === ref.id)
      return infra ? { type: 'infrastructure', item: infra } : null
    }
    default:
      return null
  }
}

/**
 * Get a permanent planting by ID
 */
export function getPermanentPlantingById(
  data: AllotmentData,
  id: string
): PermanentPlanting | undefined {
  return data.layout.permanentPlantings.find(p => p.id === id)
}

/**
 * Get an infrastructure item by ID
 */
export function getInfrastructureById(
  data: AllotmentData,
  id: string
): InfrastructureItem | undefined {
  return data.layout.infrastructure.find(i => i.id === id)
}

/**
 * Get a bed by ID
 */
export function getBedById(
  data: AllotmentData,
  bedId: PhysicalBedId
): import('@/types/garden-planner').PhysicalBed | undefined {
  return data.layout.beds.find(b => b.id === bedId)
}

/**
 * Get beds by status
 */
export function getBedsByStatus(
  data: AllotmentData,
  status: import('@/types/garden-planner').BedStatus
): import('@/types/garden-planner').PhysicalBed[] {
  return data.layout.beds.filter(b => b.status === status)
}

/**
 * Get all rotation beds (excludes perennial)
 */
export function getRotationBeds(
  data: AllotmentData
): import('@/types/garden-planner').PhysicalBed[] {
  return data.layout.beds.filter(b => b.status !== 'perennial')
}

// ============ ROTATION HISTORY ============

/**
 * Get rotation history for a bed across all years
 */
export function getRotationHistory(
  data: AllotmentData,
  bedId: PhysicalBedId
): Array<{ year: number; group: RotationGroup }> {
  return data.seasons
    .map(season => {
      const bed = season.beds.find(b => b.bedId === bedId)
      return bed ? { year: season.year, group: bed.rotationGroup } : null
    })
    .filter((item): item is { year: number; group: RotationGroup } => item !== null)
    .sort((a, b) => b.year - a.year)
}

/**
 * Get the last N years of rotation for a bed
 */
export function getRecentRotation(
  data: AllotmentData,
  bedId: PhysicalBedId,
  years: number = 3
): RotationGroup[] {
  return getRotationHistory(data, bedId)
    .slice(0, years)
    .map(h => h.group)
}

// ============ MAINTENANCE TASK OPERATIONS ============

/**
 * Generate a unique ID for a maintenance task
 */
export function generateMaintenanceTaskId(): string {
  return generateId('task')
}

/**
 * Get all maintenance tasks
 */
export function getMaintenanceTasks(data: AllotmentData): MaintenanceTask[] {
  return data.maintenanceTasks || []
}

/**
 * Get maintenance tasks for a specific plant
 */
export function getTasksForPlanting(
  data: AllotmentData,
  plantingId: string
): MaintenanceTask[] {
  return (data.maintenanceTasks || []).filter(t => t.plantingId === plantingId)
}

/**
 * Get maintenance tasks due in a specific month
 */
export function getTasksForMonth(
  data: AllotmentData,
  month: number
): MaintenanceTask[] {
  return (data.maintenanceTasks || []).filter(t => t.month === month)
}

/**
 * Add a new maintenance task
 */
export function addMaintenanceTask(
  data: AllotmentData,
  task: NewMaintenanceTask
): AllotmentData {
  const newTask: MaintenanceTask = {
    ...task,
    id: generateMaintenanceTaskId(),
  }
  
  return {
    ...data,
    maintenanceTasks: [...(data.maintenanceTasks || []), newTask],
  }
}

/**
 * Update a maintenance task
 */
export function updateMaintenanceTask(
  data: AllotmentData,
  taskId: string,
  updates: Partial<Omit<MaintenanceTask, 'id'>>
): AllotmentData {
  return {
    ...data,
    maintenanceTasks: (data.maintenanceTasks || []).map(task =>
      task.id === taskId ? { ...task, ...updates } : task
    ),
  }
}

/**
 * Mark a maintenance task as completed
 */
export function completeMaintenanceTask(
  data: AllotmentData,
  taskId: string,
  completedDate: string = new Date().toISOString()
): AllotmentData {
  return updateMaintenanceTask(data, taskId, { lastCompleted: completedDate })
}

/**
 * Remove a maintenance task
 */
export function removeMaintenanceTask(
  data: AllotmentData,
  taskId: string
): AllotmentData {
  return {
    ...data,
    maintenanceTasks: (data.maintenanceTasks || []).filter(t => t.id !== taskId),
  }
}

// ============ GENERIC STORAGE UTILITIES ============

/**
 * Generic get item from localStorage with JSON parsing
 * Use this for any non-allotment data that needs to be stored
 */
export function getStorageItem<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : null
  } catch {
    return null
  }
}

/**
 * Generic set item to localStorage with JSON serialization
 * Use this for any non-allotment data that needs to be stored
 */
export function setStorageItem<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined') return false
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

/**
 * Remove an item from localStorage
 */
export function removeStorageItem(key: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    localStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}

// ============ VARIETY OPERATIONS ============

/**
 * Generate a unique ID for a variety
 */
export function generateVarietyId(): string {
  return generateId('variety')
}

/**
 * Get all varieties
 */
export function getVarieties(data: AllotmentData): StoredVariety[] {
  return data.varieties || []
}

/**
 * Get a variety by ID
 */
export function getVarietyById(data: AllotmentData, id: string): StoredVariety | undefined {
  return data.varieties?.find(v => v.id === id)
}

/**
 * Get varieties for a specific vegetable/plant
 */
export function getVarietiesByPlant(data: AllotmentData, plantId: string): StoredVariety[] {
  return (data.varieties || []).filter(v => v.plantId === plantId)
}

/**
 * Add a new variety
 */
export function addVariety(data: AllotmentData, variety: NewVariety): AllotmentData {
  const newVariety: StoredVariety = {
    id: generateVarietyId(),
    plantId: variety.plantId,
    name: variety.name,
    supplier: variety.supplier,
    price: variety.price,
    notes: variety.notes,
    yearsUsed: [],
    plannedYears: variety.plannedYears || [],
    seedsByYear: variety.seedsByYear || {},
  }

  return {
    ...data,
    varieties: [...(data.varieties || []), newVariety],
    meta: { ...data.meta, updatedAt: new Date().toISOString() },
  }
}

/**
 * Update an existing variety
 */
export function updateVariety(
  data: AllotmentData,
  id: string,
  updates: VarietyUpdate
): AllotmentData {
  return {
    ...data,
    varieties: (data.varieties || []).map(v =>
      v.id === id ? { ...v, ...updates } : v
    ),
    meta: { ...data.meta, updatedAt: new Date().toISOString() },
  }
}

/**
 * Remove a variety
 */
export function removeVariety(data: AllotmentData, id: string): AllotmentData {
  return {
    ...data,
    varieties: (data.varieties || []).filter(v => v.id !== id),
    meta: { ...data.meta, updatedAt: new Date().toISOString() },
  }
}

/**
 * Toggle whether a variety is planned for a specific year
 */
export function togglePlannedYear(
  data: AllotmentData,
  varietyId: string,
  year: number
): AllotmentData {
  return {
    ...data,
    varieties: (data.varieties || []).map(v => {
      if (v.id !== varietyId) return v

      const hasYear = v.plannedYears.includes(year)
      return {
        ...v,
        plannedYears: hasYear
          ? v.plannedYears.filter(y => y !== year)
          : [...v.plannedYears, year].sort((a, b) => a - b),
      }
    }),
    meta: { ...data.meta, updatedAt: new Date().toISOString() },
  }
}

/**
 * Cycle seed status for a variety in a specific year
 * Cycles: none → ordered → have → none
 */
export function toggleHaveSeedsForYear(
  data: AllotmentData,
  varietyId: string,
  year: number
): AllotmentData {
  return {
    ...data,
    varieties: (data.varieties || []).map(v => {
      if (v.id !== varietyId) return v

      const current = v.seedsByYear[year] || 'none'
      const next: Record<SeedStatus, SeedStatus> = {
        'none': 'ordered',
        'ordered': 'have',
        'have': 'none'
      }
      const nextState = next[current]

      // Remove entry when cycling back to 'none'
      if (nextState === 'none') {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [year]: _, ...rest } = v.seedsByYear
        return { ...v, seedsByYear: rest }
      }

      return {
        ...v,
        seedsByYear: { ...v.seedsByYear, [year]: nextState }
      }
    }),
    meta: { ...data.meta, updatedAt: new Date().toISOString() },
  }
}

/**
 * Check if user has seeds for a variety in a specific year
 */
export function hasSeedsForYear(variety: StoredVariety, year: number): boolean {
  return variety.seedsByYear?.[year] === 'have'
}

/**
 * Get varieties planned or used for a specific year
 */
export function getVarietiesForYear(data: AllotmentData, year: number): StoredVariety[] {
  return (data.varieties || []).filter(
    v => v.yearsUsed.includes(year) || v.plannedYears.includes(year)
  )
}

/**
 * Get unique list of suppliers
 */
export function getSuppliers(data: AllotmentData): string[] {
  const suppliers = (data.varieties || [])
    .map(v => v.supplier)
    .filter((s): s is string => s !== undefined)
  return [...new Set(suppliers)].sort()
}

/**
 * Calculate total spend for varieties used or planned in a specific year
 */
export function getTotalSpendForYear(data: AllotmentData, year: number): number {
  return (data.varieties || [])
    .filter(v =>
      (v.yearsUsed.includes(year) || v.plannedYears.includes(year)) &&
      v.price !== undefined
    )
    .reduce((sum, v) => sum + (v.price || 0), 0)
}

/**
 * Get all years that have variety data (used or planned)
 */
export function getAvailableVarietyYears(data: AllotmentData): number[] {
  const years = new Set<number>()
  for (const v of data.varieties || []) {
    v.yearsUsed.forEach(y => years.add(y))
    v.plannedYears.forEach(y => years.add(y))
  }
  return [...years].sort((a, b) => b - a)
}

/**
 * Get seed stats for a specific year
 */
export function getSeedsStatsForYear(
  data: AllotmentData,
  year: number
): { total: number; have: number; ordered: number; none: number } {
  const varieties = getVarietiesForYear(data, year)
  let have = 0
  let ordered = 0
  let none = 0

  for (const v of varieties) {
    const status = v.seedsByYear[year] || 'none'
    if (status === 'have') have++
    else if (status === 'ordered') ordered++
    else none++
  }

  return { total: varieties.length, have, ordered, none }
}

// ============ UNIFIED AREA CRUD OPERATIONS (v9) ============

/**
 * Add a new area to the unified areas array
 */
export function addArea(
  data: AllotmentData,
  area: Omit<Area, 'id'>
): { data: AllotmentData; areaId: string } {
  const id = generateId()
  const newArea = { ...area, id } as Area

  const areas = data.layout.areas || []

  return {
    data: {
      ...data,
      layout: {
        ...data.layout,
        areas: [...areas, newArea],
      },
    },
    areaId: id,
  }
}

/**
 * Update an existing area
 */
export function updateArea(
  data: AllotmentData,
  areaId: string,
  updates: Partial<Omit<Area, 'id' | 'type'>>
): AllotmentData {
  const areas = data.layout.areas || []
  const areaIndex = areas.findIndex(a => a.id === areaId)

  if (areaIndex === -1) {
    return data
  }

  const updatedArea = { ...areas[areaIndex], ...updates }
  const newAreas = [...areas]
  newAreas[areaIndex] = updatedArea as Area

  return {
    ...data,
    layout: {
      ...data.layout,
      areas: newAreas,
    },
  }
}

/**
 * Remove an area from the unified areas array
 * Also removes any associated underplantings and permanent seasons
 */
export function removeArea(data: AllotmentData, areaId: string): AllotmentData {
  const areas = data.layout.areas || []
  const permanentUnderplantings = data.layout.permanentUnderplantings || []

  // Remove underplantings that have this area as parent
  const filteredUnderplantings = permanentUnderplantings.filter(
    u => u.parentAreaId !== areaId
  )

  // Remove permanent seasons for this area from all seasons
  const updatedSeasons = data.seasons.map(season => ({
    ...season,
    permanents: (season.permanents || []).filter(p => p.areaId !== areaId),
  }))

  return {
    ...data,
    layout: {
      ...data.layout,
      areas: areas.filter(a => a.id !== areaId),
      permanentUnderplantings: filteredUnderplantings,
    },
    seasons: updatedSeasons,
  }
}

/**
 * Convert an area to a different type
 * Preserves common fields (id, name, description, gridPosition)
 * Initializes type-specific fields with defaults
 */
export function convertAreaType(
  data: AllotmentData,
  areaId: string,
  newType: Area['type'],
  typeConfig?: Partial<BedArea | PermanentArea | InfrastructureArea>
): AllotmentData {
  const areas = data.layout.areas || []
  const areaIndex = areas.findIndex(a => a.id === areaId)

  if (areaIndex === -1) {
    return data
  }

  const oldArea = areas[areaIndex]

  // If already the same type, no change
  if (oldArea.type === newType) {
    return data
  }

  // Preserve common fields
  const baseFields = {
    id: oldArea.id,
    name: oldArea.name,
    description: oldArea.description,
    gridPosition: oldArea.gridPosition,
  }

  let newArea: Area

  switch (newType) {
    case 'bed':
      newArea = {
        ...baseFields,
        type: 'bed',
        status: 'rotation',
        rotationGroup: (typeConfig as Partial<BedArea>)?.rotationGroup,
      } as BedArea
      break
    case 'permanent':
      newArea = {
        ...baseFields,
        type: 'permanent',
        plantingType: (typeConfig as Partial<PermanentArea>)?.plantingType || 'perennial-veg',
        plantId: (typeConfig as Partial<PermanentArea>)?.plantId,
        variety: (typeConfig as Partial<PermanentArea>)?.variety,
        plantedYear: (typeConfig as Partial<PermanentArea>)?.plantedYear,
      } as PermanentArea
      break
    case 'infrastructure':
      newArea = {
        ...baseFields,
        type: 'infrastructure',
        infrastructureType: (typeConfig as Partial<InfrastructureArea>)?.infrastructureType || 'other',
      } as InfrastructureArea
      break
  }

  const newAreas = [...areas]
  newAreas[areaIndex] = newArea

  // If converting to permanent, initialize permanent seasons for all years
  let updatedSeasons = data.seasons
  if (newType === 'permanent') {
    updatedSeasons = data.seasons.map(season => {
      const permanents = season.permanents || []
      const existingPerm = permanents.find(p => p.areaId === areaId)
      if (!existingPerm) {
        return {
          ...season,
          permanents: [
            ...permanents,
            {
              areaId,
              careLogs: [],
              underplantings: [],
            },
          ],
        }
      }
      return season
    })
  }

  return {
    ...data,
    layout: {
      ...data.layout,
      areas: newAreas,
    },
    seasons: updatedSeasons,
  }
}

// ============ UNDERPLANTING CRUD OPERATIONS ============

/**
 * Add a permanent underplanting (persists across years)
 */
export function addPermanentUnderplanting(
  data: AllotmentData,
  underplanting: NewPermanentUnderplanting
): { data: AllotmentData; underplantingId: string } {
  const id = generateId()
  const newUnderplanting: PermanentUnderplanting = { ...underplanting, id }

  const permanentUnderplantings = data.layout.permanentUnderplantings || []

  return {
    data: {
      ...data,
      layout: {
        ...data.layout,
        permanentUnderplantings: [...permanentUnderplantings, newUnderplanting],
      },
    },
    underplantingId: id,
  }
}

/**
 * Update a permanent underplanting
 */
export function updatePermanentUnderplanting(
  data: AllotmentData,
  underplantingId: string,
  updates: Partial<Omit<PermanentUnderplanting, 'id'>>
): AllotmentData {
  const permanentUnderplantings = data.layout.permanentUnderplantings || []
  const index = permanentUnderplantings.findIndex(u => u.id === underplantingId)

  if (index === -1) {
    return data
  }

  const updated = { ...permanentUnderplantings[index], ...updates }
  const newUnderplantings = [...permanentUnderplantings]
  newUnderplantings[index] = updated

  return {
    ...data,
    layout: {
      ...data.layout,
      permanentUnderplantings: newUnderplantings,
    },
  }
}

/**
 * Remove a permanent underplanting
 */
export function removePermanentUnderplanting(
  data: AllotmentData,
  underplantingId: string
): AllotmentData {
  const permanentUnderplantings = data.layout.permanentUnderplantings || []

  return {
    ...data,
    layout: {
      ...data.layout,
      permanentUnderplantings: permanentUnderplantings.filter(u => u.id !== underplantingId),
    },
  }
}

/**
 * Get permanent underplantings for a specific area
 */
export function getPermanentUnderplantingsForArea(
  data: AllotmentData,
  parentAreaId: string
): PermanentUnderplanting[] {
  return (data.layout.permanentUnderplantings || []).filter(
    u => u.parentAreaId === parentAreaId
  )
}

/**
 * Add a seasonal underplanting (tracked per year)
 */
export function addSeasonalUnderplanting(
  data: AllotmentData,
  year: number,
  parentAreaId: string,
  planting: NewSeasonalUnderplanting
): { data: AllotmentData; underplantingId: string } {
  const seasonIndex = data.seasons.findIndex(s => s.year === year)

  if (seasonIndex === -1) {
    return { data, underplantingId: '' }
  }

  const id = generateId()
  const newUnderplanting: SeasonalUnderplanting = {
    ...planting,
    id,
    parentAreaId,
  }

  const season = data.seasons[seasonIndex]
  const permanents = season.permanents || []
  const permIndex = permanents.findIndex(p => p.areaId === parentAreaId)

  let updatedPermanents: PermanentSeason[]

  if (permIndex === -1) {
    // Create new permanent season entry
    updatedPermanents = [
      ...permanents,
      {
        areaId: parentAreaId,
        careLogs: [],
        underplantings: [newUnderplanting],
      },
    ]
  } else {
    // Add to existing permanent season
    updatedPermanents = [...permanents]
    updatedPermanents[permIndex] = {
      ...permanents[permIndex],
      underplantings: [...permanents[permIndex].underplantings, newUnderplanting],
    }
  }

  const updatedSeasons = [...data.seasons]
  updatedSeasons[seasonIndex] = {
    ...season,
    permanents: updatedPermanents,
  }

  return {
    data: {
      ...data,
      seasons: updatedSeasons,
    },
    underplantingId: id,
  }
}

/**
 * Remove a seasonal underplanting
 */
export function removeSeasonalUnderplanting(
  data: AllotmentData,
  year: number,
  parentAreaId: string,
  underplantingId: string
): AllotmentData {
  const seasonIndex = data.seasons.findIndex(s => s.year === year)

  if (seasonIndex === -1) {
    return data
  }

  const season = data.seasons[seasonIndex]
  const permanents = season.permanents || []
  const permIndex = permanents.findIndex(p => p.areaId === parentAreaId)

  if (permIndex === -1) {
    return data
  }

  const updatedPermanents = [...permanents]
  updatedPermanents[permIndex] = {
    ...permanents[permIndex],
    underplantings: permanents[permIndex].underplantings.filter(
      u => u.id !== underplantingId
    ),
  }

  const updatedSeasons = [...data.seasons]
  updatedSeasons[seasonIndex] = {
    ...season,
    permanents: updatedPermanents,
  }

  return {
    ...data,
    seasons: updatedSeasons,
  }
}

/**
 * Get seasonal underplantings for an area in a specific year
 */
export function getSeasonalUnderplantingsForArea(
  data: AllotmentData,
  year: number,
  parentAreaId: string
): SeasonalUnderplanting[] {
  const season = data.seasons.find(s => s.year === year)
  if (!season) return []

  const permSeason = (season.permanents || []).find(p => p.areaId === parentAreaId)
  return permSeason?.underplantings || []
}

// ============ CARE LOG CRUD OPERATIONS ============

/**
 * Add a care log entry for a permanent area
 */
export function addCareLogEntry(
  data: AllotmentData,
  year: number,
  areaId: string,
  entry: NewCareLogEntry
): { data: AllotmentData; entryId: string } {
  const seasonIndex = data.seasons.findIndex(s => s.year === year)

  if (seasonIndex === -1) {
    return { data, entryId: '' }
  }

  const id = generateId()
  const newEntry: CareLogEntry = { ...entry, id }

  const season = data.seasons[seasonIndex]
  const permanents = season.permanents || []
  const permIndex = permanents.findIndex(p => p.areaId === areaId)

  let updatedPermanents: PermanentSeason[]

  if (permIndex === -1) {
    // Create new permanent season entry
    updatedPermanents = [
      ...permanents,
      {
        areaId,
        careLogs: [newEntry],
        underplantings: [],
      },
    ]
  } else {
    // Add to existing permanent season
    updatedPermanents = [...permanents]
    updatedPermanents[permIndex] = {
      ...permanents[permIndex],
      careLogs: [...permanents[permIndex].careLogs, newEntry],
    }
  }

  const updatedSeasons = [...data.seasons]
  updatedSeasons[seasonIndex] = {
    ...season,
    permanents: updatedPermanents,
  }

  return {
    data: {
      ...data,
      seasons: updatedSeasons,
    },
    entryId: id,
  }
}

/**
 * Update a care log entry
 */
export function updateCareLogEntry(
  data: AllotmentData,
  year: number,
  areaId: string,
  entryId: string,
  updates: Partial<Omit<CareLogEntry, 'id'>>
): AllotmentData {
  const seasonIndex = data.seasons.findIndex(s => s.year === year)

  if (seasonIndex === -1) {
    return data
  }

  const season = data.seasons[seasonIndex]
  const permanents = season.permanents || []
  const permIndex = permanents.findIndex(p => p.areaId === areaId)

  if (permIndex === -1) {
    return data
  }

  const careLogs = permanents[permIndex].careLogs
  const logIndex = careLogs.findIndex(l => l.id === entryId)

  if (logIndex === -1) {
    return data
  }

  const updatedLogs = [...careLogs]
  updatedLogs[logIndex] = { ...careLogs[logIndex], ...updates }

  const updatedPermanents = [...permanents]
  updatedPermanents[permIndex] = {
    ...permanents[permIndex],
    careLogs: updatedLogs,
  }

  const updatedSeasons = [...data.seasons]
  updatedSeasons[seasonIndex] = {
    ...season,
    permanents: updatedPermanents,
  }

  return {
    ...data,
    seasons: updatedSeasons,
  }
}

/**
 * Remove a care log entry
 */
export function removeCareLogEntry(
  data: AllotmentData,
  year: number,
  areaId: string,
  entryId: string
): AllotmentData {
  const seasonIndex = data.seasons.findIndex(s => s.year === year)

  if (seasonIndex === -1) {
    return data
  }

  const season = data.seasons[seasonIndex]
  const permanents = season.permanents || []
  const permIndex = permanents.findIndex(p => p.areaId === areaId)

  if (permIndex === -1) {
    return data
  }

  const updatedPermanents = [...permanents]
  updatedPermanents[permIndex] = {
    ...permanents[permIndex],
    careLogs: permanents[permIndex].careLogs.filter(l => l.id !== entryId),
  }

  const updatedSeasons = [...data.seasons]
  updatedSeasons[seasonIndex] = {
    ...season,
    permanents: updatedPermanents,
  }

  return {
    ...data,
    seasons: updatedSeasons,
  }
}

/**
 * Get care logs for an area in a specific year
 */
export function getCareLogsForArea(
  data: AllotmentData,
  year: number,
  areaId: string
): CareLogEntry[] {
  const season = data.seasons.find(s => s.year === year)
  if (!season) return []

  const permSeason = (season.permanents || []).find(p => p.areaId === areaId)
  return permSeason?.careLogs || []
}

/**
 * Get all care logs for an area across all years
 */
export function getAllCareLogsForArea(
  data: AllotmentData,
  areaId: string
): Array<{ year: number; entry: CareLogEntry }> {
  const result: Array<{ year: number; entry: CareLogEntry }> = []

  for (const season of data.seasons) {
    const permSeason = (season.permanents || []).find(p => p.areaId === areaId)
    if (permSeason) {
      for (const entry of permSeason.careLogs) {
        result.push({ year: season.year, entry })
      }
    }
  }

  return result.sort((a, b) => new Date(b.entry.date).getTime() - new Date(a.entry.date).getTime())
}

/**
 * Log a harvest for a permanent area (convenience function)
 */
export function logHarvest(
  data: AllotmentData,
  year: number,
  areaId: string,
  quantity: number,
  unit: string,
  date?: string
): { data: AllotmentData; entryId: string } {
  return addCareLogEntry(data, year, areaId, {
    type: 'harvest',
    date: date || new Date().toISOString().split('T')[0],
    quantity,
    unit,
  })
}

/**
 * Get total harvest for an area in a specific year
 */
export function getHarvestTotal(
  data: AllotmentData,
  year: number,
  areaId: string
): { quantity: number; unit: string } | null {
  const careLogs = getCareLogsForArea(data, year, areaId)
  const harvests = careLogs.filter(l => l.type === 'harvest' && l.quantity !== undefined)

  if (harvests.length === 0) {
    return null
  }

  // Assume all harvests use the same unit (use first unit found)
  const unit = harvests[0].unit || 'units'
  const total = harvests.reduce((sum, h) => sum + (h.quantity || 0), 0)

  return { quantity: total, unit }
}

/**
 * Update season notes for a permanent area
 */
export function updatePermanentSeasonNotes(
  data: AllotmentData,
  year: number,
  areaId: string,
  notes: string
): AllotmentData {
  const seasonIndex = data.seasons.findIndex(s => s.year === year)

  if (seasonIndex === -1) {
    return data
  }

  const season = data.seasons[seasonIndex]
  const permanents = season.permanents || []
  const permIndex = permanents.findIndex(p => p.areaId === areaId)

  let updatedPermanents: PermanentSeason[]

  if (permIndex === -1) {
    updatedPermanents = [
      ...permanents,
      {
        areaId,
        careLogs: [],
        underplantings: [],
        seasonNotes: notes,
      },
    ]
  } else {
    updatedPermanents = [...permanents]
    updatedPermanents[permIndex] = {
      ...permanents[permIndex],
      seasonNotes: notes,
    }
  }

  const updatedSeasons = [...data.seasons]
  updatedSeasons[seasonIndex] = {
    ...season,
    permanents: updatedPermanents,
  }

  return {
    ...data,
    seasons: updatedSeasons,
  }
}

/**
 * Get the permanent season record for an area in a specific year
 */
export function getPermanentSeason(
  data: AllotmentData,
  year: number,
  areaId: string
): PermanentSeason | undefined {
  const season = data.seasons.find(s => s.year === year)
  if (!season) return undefined

  return (season.permanents || []).find(p => p.areaId === areaId)
}

