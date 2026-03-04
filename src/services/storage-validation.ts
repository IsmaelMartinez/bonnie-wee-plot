/**
 * Storage Validation
 *
 * Schema validation and data repair for AllotmentData.
 */

import {
  AllotmentData,
  Area,
  AreaKind,
  CURRENT_SCHEMA_VERSION,
} from '@/types/unified-allotment'
import { logger } from '@/lib/logger'

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

  // Validate layout - v10 uses areas array only
  if (!obj.layout || typeof obj.layout !== 'object') {
    errors.push('Missing or invalid "layout" field (expected object)')
  } else {
    const layout = obj.layout as Record<string, unknown>
    const hasAreasArray = Array.isArray(layout.areas)

    // v10 requires areas array (can be empty for new allotments)
    if (!hasAreasArray) {
      // Check for legacy format (v9 and earlier)
      const hasLegacyArrays = Array.isArray(layout.beds) &&
                             Array.isArray(layout.permanentPlantings) &&
                             Array.isArray(layout.infrastructure)
      if (!hasLegacyArrays) {
        errors.push('Layout must have "areas" array (v10) or legacy arrays (v9 and earlier)')
      }
    }

    // Validate areas array if present
    if (hasAreasArray) {
      const areas = layout.areas as unknown[]
      const seenIds = new Set<string>()
      const validKinds: AreaKind[] = ['rotation-bed', 'perennial-bed', 'tree', 'berry', 'herb', 'infrastructure', 'other']
      // Also accept legacy v9 types for migration
      const validLegacyTypes = ['bed', 'permanent', 'infrastructure']

      areas.forEach((area, index) => {
        if (!area || typeof area !== 'object') {
          errors.push(`Area at index ${index} is not an object`)
          return
        }
        const a = area as Record<string, unknown>

        // Validate required fields
        if (typeof a.id !== 'string') {
          errors.push(`Area at index ${index}: missing or invalid "id" field`)
        } else {
          if (seenIds.has(a.id)) {
            errors.push(`Area at index ${index}: duplicate id "${a.id}"`)
          }
          seenIds.add(a.id)
        }

        if (typeof a.name !== 'string') {
          errors.push(`Area at index ${index}: missing or invalid "name" field`)
        }

        // Accept either v10 'kind' or v9 'type' for migration compatibility
        const hasKind = (validKinds as string[]).includes(a.kind as string)
        const hasLegacyType = validLegacyTypes.includes(a.type as string)
        if (!hasKind && !hasLegacyType) {
          errors.push(`Area at index ${index}: must have valid "kind" (v10) or "type" (v9)`)
        }
      })
    }
  }

  // Validate seasons
  if (!Array.isArray(obj.seasons)) {
    errors.push('Missing or invalid "seasons" field (expected array)')
  } else {
    // Validate each season - accept either v10 'areas' or v9 'beds'
    (obj.seasons as unknown[]).forEach((season, index) => {
      if (!season || typeof season !== 'object') {
        errors.push(`Season at index ${index} is not an object`)
        return
      }
      const s = season as Record<string, unknown>
      if (typeof s.year !== 'number') {
        errors.push(`Season at index ${index}: missing or invalid "year" field`)
      }
      // Accept either v10 'areas' or v9 'beds'
      if (!Array.isArray(s.areas) && !Array.isArray(s.beds)) {
        errors.push(`Season at index ${index}: must have "areas" (v10) or "beds" (v9) array`)
      }
    })
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Attempt to repair common data issues
 * Returns repaired data or null if unrepairable
 * v10: Uses unified Area system
 */
export function attemptDataRepair(data: unknown): AllotmentData | null {
  if (!data || typeof data !== 'object') return null

  const obj = data as Record<string, unknown>

  try {
    const layout = obj.layout && typeof obj.layout === 'object' ? obj.layout as Record<string, unknown> : {}

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
        // v10 only needs areas array
        areas: Array.isArray(layout.areas) ? layout.areas as Area[] : [],
      },
      seasons: Array.isArray(obj.seasons) ? obj.seasons as AllotmentData['seasons'] : [],
      varieties: Array.isArray(obj.varieties) ? obj.varieties as AllotmentData['varieties'] : [],
    }

    // Validate the repaired data
    const validation = validateAllotmentData(repaired)
    if (validation.valid) {
      logger.warn('Data was repaired with defaults')
      return repaired
    }

    return null
  } catch {
    return null
  }
}
