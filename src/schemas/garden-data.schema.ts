/**
 * Zod schemas for garden data validation
 * Provides runtime validation for data loaded from localStorage
 */

import { z } from 'zod'

/**
 * PlotCell schema - represents a single cell in a garden grid
 */
export const PlotCellSchema = z.object({
  id: z.string(),
  plotId: z.string(),
  row: z.number().int().nonnegative(),
  col: z.number().int().nonnegative(),
  vegetableId: z.string().optional(),
  plantedYear: z.number().int().optional()
})

export type ValidatedPlotCell = z.infer<typeof PlotCellSchema>

/**
 * GridPlot schema - represents a garden bed with its grid of cells
 */
export const GridPlotSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  width: z.number().positive(),
  length: z.number().positive(),
  color: z.string(),
  sortOrder: z.number().int().nonnegative(),
  gridRows: z.number().int().positive().max(20),
  gridCols: z.number().int().positive().max(20),
  cells: z.array(PlotCellSchema)
})

export type ValidatedGridPlot = z.infer<typeof GridPlotSchema>

/**
 * GardenData schema - the main data structure for garden storage
 */
export const GardenDataSchema = z.object({
  beds: z.array(GridPlotSchema).min(1),
  activeBedId: z.string().nullable()
})

export type ValidatedGardenData = z.infer<typeof GardenDataSchema>

/**
 * Legacy single GridPlot format (for migration)
 */
export const LegacyGridPlotSchema = GridPlotSchema

/**
 * Validation result type
 */
export type ValidationResult<T> = 
  | { success: true; data: T }
  | { success: false; errors: z.ZodError }

/**
 * Validate garden data with detailed error reporting
 */
export function validateGardenData(data: unknown): ValidationResult<ValidatedGardenData> {
  const result = GardenDataSchema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  }
  
  return { success: false, errors: result.error }
}

/**
 * Check if data is legacy format (single GridPlot)
 */
export function isLegacyFormat(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false
  
  const obj = data as Record<string, unknown>
  
  // Check for legacy format markers
  return 'gridRows' in obj && 'cells' in obj && !('beds' in obj)
}

/**
 * Validate legacy grid plot data
 */
export function validateLegacyGridPlot(data: unknown): ValidationResult<ValidatedGridPlot> {
  const result = LegacyGridPlotSchema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  }
  
  return { success: false, errors: result.error }
}

/**
 * Convert legacy format to current format
 */
export function migrateLegacyData(legacyPlot: ValidatedGridPlot): ValidatedGardenData {
  return {
    beds: [legacyPlot],
    activeBedId: legacyPlot.id
  }
}

/**
 * Validate and repair garden data
 * Attempts to fix common issues while preserving user data
 */
export function validateAndRepair(data: unknown): ValidationResult<ValidatedGardenData> {
  // Check if null/undefined
  if (data === null || data === undefined) {
    return { success: false, errors: new z.ZodError([{
      code: 'custom',
      path: [],
      message: 'Data is null or undefined'
    }]) }
  }

  // Check for legacy format
  if (isLegacyFormat(data)) {
    const legacyResult = validateLegacyGridPlot(data)
    if (legacyResult.success) {
      return { success: true, data: migrateLegacyData(legacyResult.data) }
    }
    return legacyResult as ValidationResult<ValidatedGardenData>
  }

  // Try standard validation
  const standardResult = validateGardenData(data)
  if (standardResult.success) {
    return standardResult
  }

  // Try to repair common issues
  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>
    
    // Repair missing or invalid activeBedId
    if ('beds' in obj && Array.isArray(obj.beds) && obj.beds.length > 0) {
      const repaired = {
        ...obj,
        activeBedId: obj.activeBedId ?? (obj.beds[0] as { id?: string })?.id ?? null
      }
      
      const repairedResult = validateGardenData(repaired)
      if (repairedResult.success) {
        return repairedResult
      }
    }
  }

  return standardResult
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(error: z.ZodError<unknown>): string[] {
  return error.issues.map(issue => {
    const path = issue.path.join('.')
    return path ? `${path}: ${issue.message}` : issue.message
  })
}

