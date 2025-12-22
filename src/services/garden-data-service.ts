/**
 * Garden Data Service
 * Provides a unified interface for managing garden planner data
 * Handles loading, saving, and validation of garden beds data
 */

import { GridPlot, PlotCell } from '@/types/garden-planner'
import { StorageService, createLocalStorage, StorageResult } from './storage-service'
import { createDebouncedFunction } from '@/lib/debounce'
import { validateAndRepair, formatValidationErrors } from '@/schemas/garden-data.schema'

// Storage keys
const STORAGE_KEYS = {
  GARDEN_BEDS: 'garden-beds-2025',
  ALLOTMENT_LAYOUT: 'allotment-grid-layout',
} as const

// Default grid dimensions
const DEFAULT_ROWS = 4
const DEFAULT_COLS = 4

/**
 * Garden data structure for multiple beds
 */
export interface GardenData {
  beds: GridPlot[]
  activeBedId: string | null
}

/**
 * Listener function type for data changes
 */
export type GardenDataListener = (data: GardenData) => void

/**
 * GardenDataService handles all garden data persistence operations
 */
export class GardenDataService {
  private storage: StorageService
  private listeners: Set<GardenDataListener> = new Set()
  private debouncedSave: ReturnType<typeof createDebouncedFunction<(data: GardenData) => void>>

  constructor(storageService?: StorageService) {
    this.storage = storageService ?? createLocalStorage()
    
    // Create debounced save function (500ms delay)
    this.debouncedSave = createDebouncedFunction((data: GardenData) => {
      this.saveImmediate(data)
    }, 500)
  }

  /**
   * Generate a unique ID for beds and cells
   */
  generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Create a new grid plot with initialized cells
   */
  createBed(name: string, rows: number = DEFAULT_ROWS, cols: number = DEFAULT_COLS): GridPlot {
    const plotId = this.generateId()
    const cells: PlotCell[] = []
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        cells.push({
          id: `${plotId}-${row}-${col}`,
          plotId,
          row,
          col,
          vegetableId: undefined,
          plantedYear: undefined
        })
      }
    }
    
    return {
      id: plotId,
      name,
      width: 2,
      length: 2,
      color: this.getRandomBedColor(),
      sortOrder: 0,
      gridRows: rows,
      gridCols: cols,
      cells
    }
  }

  /**
   * Get a random color for a new bed
   */
  private getRandomBedColor(): string {
    const colors = [
      '#22c55e', // green-500
      '#3b82f6', // blue-500
      '#f59e0b', // amber-500
      '#ef4444', // red-500
      '#8b5cf6', // violet-500
      '#ec4899', // pink-500
      '#14b8a6', // teal-500
      '#f97316', // orange-500
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  /**
   * Load garden data from storage with Zod validation
   */
  load(): StorageResult<GardenData> {
    const result = this.storage.get<unknown>(STORAGE_KEYS.GARDEN_BEDS)
    
    if (!result.success) {
      return result as StorageResult<GardenData>
    }

    // Handle null (no data stored)
    if (result.data === null) {
      const defaultBed = this.createBed('Bed 1')
      return { 
        success: true, 
        data: { beds: [defaultBed], activeBedId: defaultBed.id } 
      }
    }

    // Validate with Zod (handles legacy format and repairs)
    const validationResult = validateAndRepair(result.data)
    
    if (validationResult.success) {
      // Type assertion is safe here because Zod validated the structure
      return { 
        success: true, 
        data: validationResult.data as GardenData 
      }
    }

    // Log validation errors for debugging
    console.warn(
      'Garden data validation failed, using default data:', 
      formatValidationErrors(validationResult.errors)
    )
    
    // Return default data if validation fails
    const defaultBed = this.createBed('Bed 1')
    return { 
      success: true, 
      data: { beds: [defaultBed], activeBedId: defaultBed.id } 
    }
  }

  /**
   * Save garden data (debounced)
   */
  save(data: GardenData): void {
    this.debouncedSave.debounced(data)
  }

  /**
   * Save garden data immediately (bypasses debounce)
   */
  saveImmediate(data: GardenData): StorageResult<void> {
    const result = this.storage.set(STORAGE_KEYS.GARDEN_BEDS, data)
    
    if (result.success) {
      this.notifyListeners(data)
    }
    
    return result
  }

  /**
   * Flush any pending saves
   */
  flush(): void {
    this.debouncedSave.flush()
  }

  /**
   * Cancel any pending saves
   */
  cancel(): void {
    this.debouncedSave.cancel()
  }

  /**
   * Add a listener for data changes
   */
  subscribe(listener: GardenDataListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * Notify all listeners of data changes
   */
  private notifyListeners(data: GardenData): void {
    this.listeners.forEach(listener => listener(data))
  }

  /**
   * Add a new bed
   */
  addBed(data: GardenData, name?: string): GardenData {
    const newBed = this.createBed(name ?? `Bed ${data.beds.length + 1}`)
    return {
      beds: [...data.beds, newBed],
      activeBedId: newBed.id
    }
  }

  /**
   * Delete a bed
   */
  deleteBed(data: GardenData, bedId: string): GardenData {
    if (data.beds.length <= 1) {
      return data // Don't delete the last bed
    }
    
    const newBeds = data.beds.filter(b => b.id !== bedId)
    return {
      beds: newBeds,
      activeBedId: data.activeBedId === bedId ? newBeds[0].id : data.activeBedId
    }
  }

  /**
   * Rename a bed
   */
  renameBed(data: GardenData, bedId: string, newName: string): GardenData {
    return {
      ...data,
      beds: data.beds.map(b => b.id === bedId ? { ...b, name: newName } : b)
    }
  }

  /**
   * Select a bed as active
   */
  selectBed(data: GardenData, bedId: string): GardenData {
    return { ...data, activeBedId: bedId }
  }

  /**
   * Get the active bed
   */
  getActiveBed(data: GardenData): GridPlot | undefined {
    return data.beds.find(b => b.id === data.activeBedId) ?? data.beds[0]
  }

  /**
   * Assign a plant to a cell
   */
  assignPlant(data: GardenData, bedId: string, cellId: string, vegetableId: string): GardenData {
    return {
      ...data,
      beds: data.beds.map(bed => {
        if (bed.id !== bedId) return bed
        return {
          ...bed,
          cells: bed.cells.map(cell =>
            cell.id === cellId
              ? { ...cell, vegetableId, plantedYear: new Date().getFullYear() }
              : cell
          )
        }
      })
    }
  }

  /**
   * Clear a cell
   */
  clearCell(data: GardenData, bedId: string, cellId: string): GardenData {
    return {
      ...data,
      beds: data.beds.map(bed => {
        if (bed.id !== bedId) return bed
        return {
          ...bed,
          cells: bed.cells.map(cell =>
            cell.id === cellId
              ? { ...cell, vegetableId: undefined, plantedYear: undefined }
              : cell
          )
        }
      })
    }
  }

  /**
   * Clear all plants in a bed
   */
  clearBed(data: GardenData, bedId: string): GardenData {
    return {
      ...data,
      beds: data.beds.map(bed => {
        if (bed.id !== bedId) return bed
        return {
          ...bed,
          cells: bed.cells.map(cell => ({
            ...cell,
            vegetableId: undefined,
            plantedYear: undefined
          }))
        }
      })
    }
  }

  /**
   * Resize a bed's grid
   */
  resizeBed(data: GardenData, bedId: string, newRows: number, newCols: number): GardenData {
    return {
      ...data,
      beds: data.beds.map(bed => {
        if (bed.id !== bedId) return bed
        
        const newCells: PlotCell[] = []
        for (let row = 0; row < newRows; row++) {
          for (let col = 0; col < newCols; col++) {
            const existing = bed.cells.find(c => c.row === row && c.col === col)
            if (existing) {
              newCells.push(existing)
            } else {
              newCells.push({
                id: `${bed.id}-${row}-${col}`,
                plotId: bed.id,
                row,
                col
              })
            }
          }
        }
        
        return {
          ...bed,
          gridRows: newRows,
          gridCols: newCols,
          cells: newCells
        }
      })
    }
  }

  /**
   * Get statistics for garden data
   */
  getStats(data: GardenData): { totalBeds: number; totalPlants: number; totalCells: number } {
    const totalBeds = data.beds.length
    const totalCells = data.beds.reduce((sum, bed) => sum + bed.cells.length, 0)
    const totalPlants = data.beds.reduce(
      (sum, bed) => sum + bed.cells.filter(c => c.vegetableId).length,
      0
    )
    
    return { totalBeds, totalPlants, totalCells }
  }

  /**
   * Check if data needs migration
   */
  needsMigration(data: unknown): boolean {
    if (!data || typeof data !== 'object') return true
    
    // Check for legacy single-bed format
    if ('gridRows' in data && 'cells' in data && !('beds' in data)) {
      return true
    }
    
    return false
  }
}

// Default service instance
export const gardenDataService = new GardenDataService()

