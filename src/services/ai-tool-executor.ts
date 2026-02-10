/**
 * AI Tool Executor Service
 *
 * Executes AI tool calls (function calling) against AllotmentData.
 * Tool calls come from OpenAI's function calling API and modify garden data.
 *
 * All operations are immutable - they return new AllotmentData objects.
 * The caller is responsible for persisting the updated data.
 *
 * @see docs/research/ai-inventory-management.md
 * @see src/lib/ai-tools-schema.ts
 */

import {
  AllotmentData,
  NewPlanting,
  PlantingUpdate,
  Area,
  Planting,
} from '@/types/unified-allotment'
import {
  addPlanting as storageAddPlanting,
  updatePlanting as storageUpdatePlanting,
  removePlanting as storageRemovePlanting,
  getAreaById,
  getPlantingsForArea,
  getAllAreas,
  getAreasByKind,
} from '@/services/allotment-storage'
import {
  ToolCall,
  ToolResult,
  parseToolCallArgs,
  AddPlantingArgs,
  UpdatePlantingArgs,
  RemovePlantingArgs,
  ListAreasArgs,
} from '@/lib/ai-tools-schema'
import { getVegetableById, searchVegetables } from '@/lib/vegetable-database'
import { populateExpectedHarvest } from '@/lib/date-calculator'
import { trackEvent } from '@/lib/analytics'

// ============ ERROR HELPERS ============

/**
 * Build an error message with recovery suggestions
 */
function buildErrorWithSuggestion(
  baseError: string,
  suggestion: string
): string {
  return `${baseError}\n\n💡 Suggestion: ${suggestion}`
}

/**
 * Suggest similar plant names when a plant is not found
 */
function suggestSimilarPlants(plantId: string): string[] {
  const searchTerm = normalizePlantId(plantId)
  const results = searchVegetables(searchTerm).slice(0, 5)
  return results.map(v => v.id)
}

// ============ PLANT DISAMBIGUATION ============

export interface PlantSuggestion {
  id: string
  name: string
}

export interface PlantDisambiguationResult {
  needsDisambiguation: boolean
  originalInput: string
  resolvedPlant?: { id: string; name: string }
  suggestions?: PlantSuggestion[]
}

/**
 * Check if a plant ID needs disambiguation
 * Returns resolved plant if exact/normalized match found, or suggestions if ambiguous
 */
export function checkPlantDisambiguation(plantId: string): PlantDisambiguationResult {
  // Try exact match
  let plant = getVegetableById(plantId)
  if (plant) {
    return {
      needsDisambiguation: false,
      originalInput: plantId,
      resolvedPlant: { id: plant.id, name: plant.name },
    }
  }

  // Try normalized match
  const normalized = normalizePlantId(plantId)
  plant = getVegetableById(normalized)
  if (plant) {
    return {
      needsDisambiguation: false,
      originalInput: plantId,
      resolvedPlant: { id: plant.id, name: plant.name },
    }
  }

  // No match - get suggestions
  const searchTerm = normalizePlantId(plantId)
  const results = searchVegetables(searchTerm).slice(0, 6)

  if (results.length === 0) {
    return {
      needsDisambiguation: true,
      originalInput: plantId,
      suggestions: [],
    }
  }

  return {
    needsDisambiguation: true,
    originalInput: plantId,
    suggestions: results.map(v => ({ id: v.id, name: v.name })),
  }
}

/**
 * Normalize plant ID to handle common variations
 * - "tomatoes" -> "tomato"
 * - "Carrots" -> "carrot"
 * - "runner-beans" -> "runner-bean"
 * - "berries" -> "berry"
 */
function normalizePlantId(plantId: string): string {
  return plantId
    .toLowerCase()
    .trim()
    .replace(/ies$/, 'y')  // "berries" -> "berry" (must be before trailing 's' removal)
    .replace(/s$/, '')     // Remove trailing 's' (plurals)
}

/**
 * Result of executing a tool call
 */
export interface ToolExecutionResult {
  /** Updated allotment data (may be unchanged for read-only operations) */
  updatedData: AllotmentData
  /** Result to return to the AI for follow-up response */
  result: ToolResult
}

/**
 * Execute a single tool call against allotment data
 *
 * @param toolCall - The tool call from OpenAI
 * @param allotmentData - Current allotment data
 * @param currentYear - The currently selected year
 * @returns Updated data and result for the AI
 */
export function executeToolCall(
  toolCall: ToolCall,
  allotmentData: AllotmentData,
  currentYear: number
): ToolExecutionResult {
  const { id, function: func } = toolCall

  // Parse and validate arguments
  const parseResult = parseToolCallArgs(func.name, func.arguments)
  if (!parseResult.valid) {
    return {
      updatedData: allotmentData,
      result: {
        tool_call_id: id,
        success: false,
        error: `Invalid arguments: ${parseResult.error}`,
      },
    }
  }

  try {
    switch (func.name) {
      case 'add_planting':
        return executeAddPlanting(
          id,
          parseResult.data as AddPlantingArgs,
          allotmentData,
          currentYear
        )

      case 'update_planting':
        return executeUpdatePlanting(
          id,
          parseResult.data as UpdatePlantingArgs,
          allotmentData,
          currentYear
        )

      case 'remove_planting':
        return executeRemovePlanting(
          id,
          parseResult.data as RemovePlantingArgs,
          allotmentData,
          currentYear
        )

      case 'list_areas':
        return executeListAreas(
          id,
          parseResult.data as ListAreasArgs,
          allotmentData
        )

      default:
        return {
          updatedData: allotmentData,
          result: {
            tool_call_id: id,
            success: false,
            error: `Unknown function: ${func.name}`,
          },
        }
    }
  } catch (error) {
    return {
      updatedData: allotmentData,
      result: {
        tool_call_id: id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
    }
  }
}

/**
 * Execute multiple tool calls in sequence
 *
 * Each call receives the updated data from the previous call,
 * ensuring changes accumulate correctly.
 */
export function executeToolCalls(
  toolCalls: ToolCall[],
  allotmentData: AllotmentData,
  currentYear: number
): { updatedData: AllotmentData; results: ToolResult[] } {
  let currentData = allotmentData
  const results: ToolResult[] = []

  for (const toolCall of toolCalls) {
    const { updatedData, result } = executeToolCall(
      toolCall,
      currentData,
      currentYear
    )
    currentData = updatedData
    results.push(result)

    // Track AI tool execution
    trackEvent('ai', 'tool-executed', toolCall.function.name)
  }

  return { updatedData: currentData, results }
}

// ============ INDIVIDUAL OPERATION HANDLERS ============

function executeAddPlanting(
  toolCallId: string,
  args: AddPlantingArgs,
  data: AllotmentData,
  year: number
): ToolExecutionResult {
  // Validate area exists
  const area = getAreaById(data, args.areaId)
  if (!area) {
    const availableAreas = getAllAreas(data).filter(a => a.canHavePlantings && !a.isArchived)
    const areaList = availableAreas.slice(0, 5).map(a => a.name).join(', ')
    const moreText = availableAreas.length > 5 ? ` and ${availableAreas.length - 5} more` : ''
    return {
      updatedData: data,
      result: {
        tool_call_id: toolCallId,
        success: false,
        error: buildErrorWithSuggestion(
          `Area '${args.areaId}' not found.`,
          `Available beds: ${areaList}${moreText}. Try asking "which beds do I have?" to see all options.`
        ),
      },
    }
  }

  // Check if area can have plantings
  if (!area.canHavePlantings) {
    const plantableBeds = getAllAreas(data).filter(a => a.canHavePlantings && !a.isArchived)
    const bedSuggestions = plantableBeds.slice(0, 3).map(a => a.name).join(', ')
    return {
      updatedData: data,
      result: {
        tool_call_id: toolCallId,
        success: false,
        error: buildErrorWithSuggestion(
          `Area '${area.name}' is marked as infrastructure and cannot have plantings.`,
          `Try adding to a bed instead: ${bedSuggestions}`
        ),
      },
    }
  }

  // Try to find the plant, handling common variations
  let plant = getVegetableById(args.plantId)

  // Try normalizing the plant ID if not found (handle plurals, case)
  if (!plant) {
    const normalized = normalizePlantId(args.plantId)
    plant = getVegetableById(normalized)
  }

  if (!plant) {
    const suggestions = suggestSimilarPlants(args.plantId)
    const suggestionText = suggestions.length > 0
      ? `Did you mean: ${suggestions.join(', ')}?`
      : 'Check the spelling or try a more common name.'
    return {
      updatedData: data,
      result: {
        tool_call_id: toolCallId,
        success: false,
        error: buildErrorWithSuggestion(
          `Plant '${args.plantId}' not found in the database.`,
          suggestionText
        ),
      },
    }
  }

  // Create the new planting (use the actual plant ID from database, not user input)
  let newPlanting: NewPlanting = {
    plantId: plant.id,
    varietyName: args.varietyName,
    sowDate: args.sowDate,
    sowMethod: args.sowMethod,
    quantity: args.quantity,
    notes: args.notes,
    status: args.sowDate ? 'active' : 'planned',
  }

  // Calculate and populate expected harvest dates
  if (args.sowDate) {
    newPlanting = populateExpectedHarvest(newPlanting, plant) as NewPlanting
  }

  // Use area.id (not args.areaId) since args.areaId might be a name
  const updatedData = storageAddPlanting(data, year, area.id, newPlanting)

  const displayName = args.varietyName
    ? `${args.varietyName} (${plant.name})`
    : plant.name

  return {
    updatedData,
    result: {
      tool_call_id: toolCallId,
      success: true,
      result: {
        message: `Added ${displayName} to ${area.name}${args.sowDate ? ` with sowing date ${args.sowDate}` : ''}`,
        areaId: area.id, // Use resolved ID, not input
        areaName: area.name,
        plantId: plant.id, // Use the actual ID from database, not the user input
        plantName: plant.name,
        varietyName: args.varietyName,
        sowDate: args.sowDate,
      },
    },
  }
}

function executeUpdatePlanting(
  toolCallId: string,
  args: UpdatePlantingArgs,
  data: AllotmentData,
  year: number
): ToolExecutionResult {
  // Validate area exists
  const area = getAreaById(data, args.areaId)
  if (!area) {
    const availableAreas = getAllAreas(data).filter(a => a.canHavePlantings && !a.isArchived)
    const areaList = availableAreas.slice(0, 5).map(a => a.name).join(', ')
    return {
      updatedData: data,
      result: {
        tool_call_id: toolCallId,
        success: false,
        error: buildErrorWithSuggestion(
          `Area '${args.areaId}' not found.`,
          `Available beds: ${areaList}. Try asking "what's planted in Bed A?" to see your plantings.`
        ),
      },
    }
  }

  // Find the planting to update (use area.id since args.areaId might be a name)
  const plantings = getPlantingsForArea(data, year, area.id)
  const planting = findPlantingByPlantId(plantings, args.plantId)

  if (!planting) {
    const availablePlants = plantings.map(p => {
      const veg = getVegetableById(p.plantId)
      return veg?.name || p.plantId
    })
    const plantList = availablePlants.length > 0
      ? availablePlants.join(', ')
      : null
    return {
      updatedData: data,
      result: {
        tool_call_id: toolCallId,
        success: false,
        error: buildErrorWithSuggestion(
          `No '${args.plantId}' found in ${area.name} for ${year}.`,
          plantList
            ? `Plants in this bed: ${plantList}. Did you mean one of these?`
            : `This bed is empty for ${year}. Try adding a plant first, or check a different year.`
        ),
      },
    }
  }

  // Build the update object
  const updates: PlantingUpdate = {}
  if (args.updates.varietyName !== undefined) updates.varietyName = args.updates.varietyName
  if (args.updates.sowDate !== undefined) updates.sowDate = args.updates.sowDate
  if (args.updates.sowMethod !== undefined) updates.sowMethod = args.updates.sowMethod
  if (args.updates.transplantDate !== undefined) updates.transplantDate = args.updates.transplantDate
  if (args.updates.actualHarvestStart !== undefined) updates.actualHarvestStart = args.updates.actualHarvestStart
  if (args.updates.actualHarvestEnd !== undefined) updates.actualHarvestEnd = args.updates.actualHarvestEnd
  if (args.updates.success !== undefined) updates.success = args.updates.success
  if (args.updates.notes !== undefined) updates.notes = args.updates.notes
  if (args.updates.quantity !== undefined) updates.quantity = args.updates.quantity
  if (args.updates.status !== undefined) updates.status = args.updates.status

  // Use area.id (not args.areaId) since args.areaId might be a name
  const updatedData = storageUpdatePlanting(
    data,
    year,
    area.id,
    planting.id,
    updates
  )

  const plant = getVegetableById(args.plantId)
  const plantName = plant?.name || args.plantId

  return {
    updatedData,
    result: {
      tool_call_id: toolCallId,
      success: true,
      result: {
        message: `Updated ${plantName} in ${area.name}`,
        areaId: area.id, // Use resolved ID, not input
        areaName: area.name,
        plantingId: planting.id,
        updates: args.updates,
      },
    },
  }
}

function executeRemovePlanting(
  toolCallId: string,
  args: RemovePlantingArgs,
  data: AllotmentData,
  year: number
): ToolExecutionResult {
  // Validate area exists
  const area = getAreaById(data, args.areaId)
  if (!area) {
    const availableAreas = getAllAreas(data).filter(a => a.canHavePlantings && !a.isArchived)
    const areaList = availableAreas.slice(0, 5).map(a => a.name).join(', ')
    return {
      updatedData: data,
      result: {
        tool_call_id: toolCallId,
        success: false,
        error: buildErrorWithSuggestion(
          `Area '${args.areaId}' not found.`,
          `Available beds: ${areaList}. Try asking "what's in my beds?" to see your current plantings.`
        ),
      },
    }
  }

  // Find the planting to remove (use area.id since args.areaId might be a name)
  const plantings = getPlantingsForArea(data, year, area.id)
  const planting = findPlantingByPlantId(plantings, args.plantId)

  if (!planting) {
    const availablePlants = plantings.map(p => {
      const veg = getVegetableById(p.plantId)
      return veg?.name || p.plantId
    })
    const plantList = availablePlants.length > 0
      ? availablePlants.join(', ')
      : null
    return {
      updatedData: data,
      result: {
        tool_call_id: toolCallId,
        success: false,
        error: buildErrorWithSuggestion(
          `No '${args.plantId}' found in ${area.name} for ${year}.`,
          plantList
            ? `Plants in this bed: ${plantList}. Did you mean one of these?`
            : `This bed is empty for ${year}. Nothing to remove.`
        ),
      },
    }
  }

  // Use area.id (not args.areaId) since args.areaId might be a name
  const updatedData = storageRemovePlanting(
    data,
    year,
    area.id,
    planting.id
  )

  const plant = getVegetableById(args.plantId)
  const plantName = plant?.name || args.plantId

  return {
    updatedData,
    result: {
      tool_call_id: toolCallId,
      success: true,
      result: {
        message: `Removed ${plantName} from ${area.name}`,
        areaId: area.id, // Use resolved ID, not input
        areaName: area.name,
        plantingId: planting.id,
      },
    },
  }
}

function executeListAreas(
  toolCallId: string,
  args: ListAreasArgs,
  data: AllotmentData
): ToolExecutionResult {
  // Get areas, optionally filtered by kind
  const areas = args.kind
    ? getAreasByKind(data, args.kind)
    : getAllAreas(data)

  // Filter to only active (non-archived) areas
  const activeAreas = areas.filter(a => !a.isArchived)

  // Format for AI response
  const formattedAreas = activeAreas.map((area: Area) => ({
    id: area.id,
    name: area.name,
    kind: area.kind,
    canHavePlantings: area.canHavePlantings,
    description: area.description,
  }))

  return {
    updatedData: data, // No changes for list operation
    result: {
      tool_call_id: toolCallId,
      success: true,
      result: {
        message: args.kind
          ? `Found ${formattedAreas.length} ${args.kind} areas`
          : `Found ${formattedAreas.length} areas total`,
        areas: formattedAreas,
        count: formattedAreas.length,
      },
    },
  }
}

// ============ HELPER FUNCTIONS ============

/**
 * Find a planting by plant ID (not planting ID)
 * The AI uses plant type (e.g., "tomato") not the internal UUID
 * Handles common variations like plurals, case differences, etc.
 */
function findPlantingByPlantId(
  plantings: Planting[],
  plantId: string
): Planting | undefined {
  // Try exact match first
  let planting = plantings.find(p => p.plantId === plantId)
  if (planting) return planting

  // Try normalized match (handles plurals, case, etc.)
  const normalizedInput = normalizePlantId(plantId)
  planting = plantings.find(p => normalizePlantId(p.plantId) === normalizedInput)
  if (planting) return planting

  // Try fuzzy matching for common variations
  // e.g., "broad-bean" vs "broadbean", "runner bean" vs "runner-bean"
  const fuzzyInput = normalizedInput.replace(/[-\s]/g, '')
  planting = plantings.find(p => {
    const fuzzyPlantId = normalizePlantId(p.plantId).replace(/[-\s]/g, '')
    return fuzzyPlantId === fuzzyInput
  })

  return planting
}

/**
 * Format tool execution results for AI follow-up message
 */
export function formatResultsForAI(results: ToolResult[]): string {
  const successful = results.filter(r => r.success)
  const failed = results.filter(r => !r.success)

  const lines: string[] = []

  if (successful.length > 0) {
    lines.push(`Successfully completed ${successful.length} operation(s):`)
    successful.forEach(r => {
      const msg = (r.result as { message?: string })?.message
      if (msg) lines.push(`- ${msg}`)
    })
  }

  if (failed.length > 0) {
    lines.push(`\nFailed ${failed.length} operation(s):`)
    failed.forEach(r => {
      lines.push(`- ${r.error}`)
    })
  }

  return lines.join('\n')
}
