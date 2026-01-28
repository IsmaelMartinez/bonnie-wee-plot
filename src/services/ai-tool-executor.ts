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
import { getVegetableById } from '@/lib/vegetable-database'

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
    return {
      updatedData: data,
      result: {
        tool_call_id: toolCallId,
        success: false,
        error: `Area '${args.areaId}' not found. Available areas: ${getAllAreas(data).map(a => a.id).join(', ')}`,
      },
    }
  }

  // Check if area can have plantings
  if (!area.canHavePlantings) {
    return {
      updatedData: data,
      result: {
        tool_call_id: toolCallId,
        success: false,
        error: `Area '${args.areaId}' (${area.name}) cannot have plantings. Try a different bed.`,
      },
    }
  }

  // Validate plant exists in database
  const plant = getVegetableById(args.plantId)
  if (!plant) {
    return {
      updatedData: data,
      result: {
        tool_call_id: toolCallId,
        success: false,
        error: `Plant '${args.plantId}' not found in the vegetable database. Please check the plant name.`,
      },
    }
  }

  // Create the new planting
  const newPlanting: NewPlanting = {
    plantId: args.plantId,
    varietyName: args.varietyName,
    sowDate: args.sowDate,
    sowMethod: args.sowMethod,
    quantity: args.quantity,
    notes: args.notes,
    status: args.sowDate ? 'active' : 'planned',
  }

  const updatedData = storageAddPlanting(data, year, args.areaId, newPlanting)

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
        areaId: args.areaId,
        areaName: area.name,
        plantId: args.plantId,
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
    return {
      updatedData: data,
      result: {
        tool_call_id: toolCallId,
        success: false,
        error: `Area '${args.areaId}' not found`,
      },
    }
  }

  // Find the planting to update
  const plantings = getPlantingsForArea(data, year, args.areaId)
  const planting = findPlantingByPlantId(plantings, args.plantId)

  if (!planting) {
    const availablePlants = plantings.map(p => p.plantId).join(', ')
    return {
      updatedData: data,
      result: {
        tool_call_id: toolCallId,
        success: false,
        error: `No planting of '${args.plantId}' found in ${area.name} for ${year}.${availablePlants ? ` Available: ${availablePlants}` : ' The bed is empty.'}`,
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

  const updatedData = storageUpdatePlanting(
    data,
    year,
    args.areaId,
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
        areaId: args.areaId,
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
    return {
      updatedData: data,
      result: {
        tool_call_id: toolCallId,
        success: false,
        error: `Area '${args.areaId}' not found`,
      },
    }
  }

  // Find the planting to remove
  const plantings = getPlantingsForArea(data, year, args.areaId)
  const planting = findPlantingByPlantId(plantings, args.plantId)

  if (!planting) {
    const availablePlants = plantings.map(p => p.plantId).join(', ')
    return {
      updatedData: data,
      result: {
        tool_call_id: toolCallId,
        success: false,
        error: `No planting of '${args.plantId}' found in ${area.name} for ${year}.${availablePlants ? ` Available: ${availablePlants}` : ' The bed is empty.'}`,
      },
    }
  }

  const updatedData = storageRemovePlanting(
    data,
    year,
    args.areaId,
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
        areaId: args.areaId,
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
 */
function findPlantingByPlantId(
  plantings: Planting[],
  plantId: string
): Planting | undefined {
  // Try exact match first
  let planting = plantings.find(p => p.plantId === plantId)
  if (planting) return planting

  // Try case-insensitive match
  const lowerPlantId = plantId.toLowerCase()
  planting = plantings.find(p => p.plantId.toLowerCase() === lowerPlantId)
  if (planting) return planting

  // Try partial match (e.g., "tomatoes" -> "tomato")
  const singularPlantId = plantId.replace(/s$/, '').toLowerCase()
  planting = plantings.find(
    p => p.plantId.toLowerCase() === singularPlantId ||
         p.plantId.toLowerCase().replace(/s$/, '') === singularPlantId
  )

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
