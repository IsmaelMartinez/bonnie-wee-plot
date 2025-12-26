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
  STORAGE_KEY,
  CURRENT_SCHEMA_VERSION,
} from '@/types/unified-allotment'
import { PhysicalBedId, RotationGroup, PlantedVariety, SeasonPlan } from '@/types/garden-planner'

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
  
  migrated.version = CURRENT_SCHEMA_VERSION
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
    vegetableId: legacy.vegetableId,
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
  
  // Convert legacy seasons
  const seasons: SeasonRecord[] = [
    convertSeason(season2024, 'historical'),
    convertSeason(season2025, currentYear === 2025 ? 'current' : 'historical'),
  ]
  
  // Create initial data structure
  const data: AllotmentData = {
    version: CURRENT_SCHEMA_VERSION,
    meta: {
      name: 'My Edinburgh Allotment',
      location: 'Edinburgh, Scotland',
      createdAt: now,
      updatedAt: now,
    },
    layout: {
      beds: physicalBeds,
      permanentPlantings: permanentPlantings,
      infrastructure: infrastructure,
    },
    seasons,
    currentYear: 2025,
  }
  
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
 */
export function addSeason(data: AllotmentData, input: NewSeasonInput): AllotmentData {
  const now = new Date().toISOString()
  
  // Create bed seasons for all rotation beds (not perennial)
  const bedSeasons: BedSeason[] = data.layout.beds
    .filter(bed => bed.status !== 'perennial')
    .map(bed => ({
      bedId: bed.id,
      rotationGroup: bed.rotationGroup || 'legumes',
      plantings: [],
    }))
  
  const newSeason: SeasonRecord = {
    year: input.year,
    status: input.status || 'planned',
    beds: bedSeasons,
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
      
      return {
        ...season,
        updatedAt: new Date().toISOString(),
        beds: season.beds.map(bed => 
          bed.bedId === bedId 
            ? { ...bed, rotationGroup }
            : bed
        ),
      }
    }),
  }
}

// ============ PLANTING OPERATIONS ============

/**
 * Generate a unique ID for a planting
 */
export function generatePlantingId(): string {
  return `planting-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
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

// ============ LAYOUT OPERATIONS ============

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
  return `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
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

