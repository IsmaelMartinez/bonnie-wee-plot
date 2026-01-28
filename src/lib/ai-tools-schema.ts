/**
 * AI Tools Schema for OpenAI Function Calling
 *
 * Defines the tools that Aitor (AI advisor) can use to modify allotment data.
 * These follow the OpenAI Tools API specification.
 *
 * @see docs/research/ai-inventory-management.md
 */

import { z } from 'zod'

// ============ TOOL DEFINITIONS ============

/**
 * OpenAI Tool type for function calling
 */
export interface OpenAITool {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: {
      type: 'object'
      properties: Record<string, unknown>
      required?: string[]
      additionalProperties?: boolean
    }
    strict?: boolean
  }
}

/**
 * Tool call from OpenAI response
 */
export interface ToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string // JSON string
  }
}

/**
 * Result of executing a tool call
 */
export interface ToolResult {
  tool_call_id: string
  success: boolean
  result?: unknown
  error?: string
}

// ============ PLANTING TOOLS ============

export const PLANTING_TOOLS: OpenAITool[] = [
  {
    type: 'function',
    function: {
      name: 'add_planting',
      description:
        'Add a new plant to a bed or area. Only call this when the user explicitly wants to add a plant. Confirm the bed/area exists before calling. Include sowing date if mentioned.',
      parameters: {
        type: 'object',
        properties: {
          areaId: {
            type: 'string',
            description:
              "The bed or area ID where plant will be added (e.g., 'bed-a', 'bed-b1'). Must be a valid existing area.",
          },
          plantId: {
            type: 'string',
            description:
              "Plant identifier from the vegetable database (e.g., 'tomato', 'carrot', 'lettuce')",
          },
          varietyName: {
            type: 'string',
            description:
              "Specific variety name if mentioned (e.g., 'San Marzano', 'Nantes 2')",
          },
          sowDate: {
            type: 'string',
            description:
              'Sowing date in YYYY-MM-DD format. Use current year if not specified.',
          },
          sowMethod: {
            type: 'string',
            enum: ['indoor', 'outdoor', 'transplant-purchased'],
            description:
              'How the plant was started: indoor (from seed indoors), outdoor (direct sown), or transplant-purchased (bought as seedling)',
          },
          quantity: {
            type: 'number',
            description: 'Number of plants or seeds if mentioned',
          },
          notes: {
            type: 'string',
            description: 'Any additional notes about this planting',
          },
        },
        required: ['areaId', 'plantId'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_planting',
      description:
        'Update an existing planting\'s information. Only call when user wants to modify existing plant details. Do not use for adding new plants.',
      parameters: {
        type: 'object',
        properties: {
          areaId: {
            type: 'string',
            description: 'The bed/area containing the planting',
          },
          plantId: {
            type: 'string',
            description: 'Which plant to update (search by plant type)',
          },
          updates: {
            type: 'object',
            description: 'Fields to update on the planting',
            properties: {
              varietyName: {
                type: 'string',
                description: 'New variety name',
              },
              sowDate: {
                type: 'string',
                description: 'New sowing date in YYYY-MM-DD format',
              },
              sowMethod: {
                type: 'string',
                enum: ['indoor', 'outdoor', 'transplant-purchased'],
                description: 'How the plant was started',
              },
              transplantDate: {
                type: 'string',
                description: 'Transplant date in YYYY-MM-DD format',
              },
              actualHarvestStart: {
                type: 'string',
                description: 'When harvest actually started in YYYY-MM-DD format',
              },
              actualHarvestEnd: {
                type: 'string',
                description: 'When harvest actually ended in YYYY-MM-DD format',
              },
              success: {
                type: 'string',
                enum: ['excellent', 'good', 'fair', 'poor', 'failed'],
                description: 'How well the planting performed',
              },
              notes: {
                type: 'string',
                description: 'Updated notes about this planting',
              },
              quantity: {
                type: 'number',
                description: 'Updated quantity',
              },
              status: {
                type: 'string',
                enum: ['planned', 'active', 'harvested', 'removed'],
                description: 'Current lifecycle status of the planting',
              },
            },
            additionalProperties: false,
          },
        },
        required: ['areaId', 'plantId', 'updates'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'remove_planting',
      description:
        'Remove a plant from a bed. Only use when user explicitly wants to delete/remove a planting. This is destructive and cannot be undone.',
      parameters: {
        type: 'object',
        properties: {
          areaId: {
            type: 'string',
            description: 'The bed/area ID',
          },
          plantId: {
            type: 'string',
            description: 'Which plant to remove (by plant type)',
          },
        },
        required: ['areaId', 'plantId'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_areas',
      description:
        'Get a list of all beds and areas in the garden to help users know where they can plant',
      parameters: {
        type: 'object',
        properties: {
          kind: {
            type: 'string',
            enum: [
              'rotation-bed',
              'perennial-bed',
              'tree',
              'berry',
              'herb',
              'infrastructure',
              'other',
            ],
            description: 'Optional filter by area type',
          },
        },
        additionalProperties: false,
      },
    },
  },
]

// ============ ZOD VALIDATION SCHEMAS ============

/**
 * Schema for add_planting tool arguments
 */
export const addPlantingArgsSchema = z.object({
  areaId: z.string().min(1, 'areaId is required'),
  plantId: z.string().min(1, 'plantId is required'),
  varietyName: z.string().optional(),
  sowDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'sowDate must be in YYYY-MM-DD format')
    .optional(),
  sowMethod: z.enum(['indoor', 'outdoor', 'transplant-purchased']).optional(),
  quantity: z.number().positive().optional(),
  notes: z.string().optional(),
})

export type AddPlantingArgs = z.infer<typeof addPlantingArgsSchema>

/**
 * Schema for update_planting tool arguments
 */
export const updatePlantingArgsSchema = z.object({
  areaId: z.string().min(1, 'areaId is required'),
  plantId: z.string().min(1, 'plantId is required'),
  updates: z.object({
    varietyName: z.string().optional(),
    sowDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'sowDate must be in YYYY-MM-DD format')
      .optional(),
    sowMethod: z.enum(['indoor', 'outdoor', 'transplant-purchased']).optional(),
    transplantDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'transplantDate must be in YYYY-MM-DD format')
      .optional(),
    actualHarvestStart: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'actualHarvestStart must be in YYYY-MM-DD format')
      .optional(),
    actualHarvestEnd: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'actualHarvestEnd must be in YYYY-MM-DD format')
      .optional(),
    success: z.enum(['excellent', 'good', 'fair', 'poor', 'failed']).optional(),
    notes: z.string().optional(),
    quantity: z.number().positive().optional(),
    status: z.enum(['planned', 'active', 'harvested', 'removed']).optional(),
  }),
})

export type UpdatePlantingArgs = z.infer<typeof updatePlantingArgsSchema>

/**
 * Schema for remove_planting tool arguments
 */
export const removePlantingArgsSchema = z.object({
  areaId: z.string().min(1, 'areaId is required'),
  plantId: z.string().min(1, 'plantId is required'),
})

export type RemovePlantingArgs = z.infer<typeof removePlantingArgsSchema>

/**
 * Schema for list_areas tool arguments
 */
export const listAreasArgsSchema = z.object({
  kind: z
    .enum([
      'rotation-bed',
      'perennial-bed',
      'tree',
      'berry',
      'herb',
      'infrastructure',
      'other',
    ])
    .optional(),
})

export type ListAreasArgs = z.infer<typeof listAreasArgsSchema>

// ============ VALIDATION HELPERS ============

/**
 * Validate tool call arguments based on function name
 */
export function validateToolCallArgs(
  functionName: string,
  args: unknown
): { valid: true; data: unknown } | { valid: false; error: string } {
  try {
    switch (functionName) {
      case 'add_planting': {
        const result = addPlantingArgsSchema.safeParse(args)
        if (!result.success) {
          return {
            valid: false,
            error: result.error.issues.map((i) => i.message).join(', '),
          }
        }
        return { valid: true, data: result.data }
      }

      case 'update_planting': {
        const result = updatePlantingArgsSchema.safeParse(args)
        if (!result.success) {
          return {
            valid: false,
            error: result.error.issues.map((i) => i.message).join(', '),
          }
        }
        return { valid: true, data: result.data }
      }

      case 'remove_planting': {
        const result = removePlantingArgsSchema.safeParse(args)
        if (!result.success) {
          return {
            valid: false,
            error: result.error.issues.map((i) => i.message).join(', '),
          }
        }
        return { valid: true, data: result.data }
      }

      case 'list_areas': {
        const result = listAreasArgsSchema.safeParse(args)
        if (!result.success) {
          return {
            valid: false,
            error: result.error.issues.map((i) => i.message).join(', '),
          }
        }
        return { valid: true, data: result.data }
      }

      default:
        return { valid: false, error: `Unknown function: ${functionName}` }
    }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Validation failed',
    }
  }
}

/**
 * Parse tool call arguments from JSON string with validation
 */
export function parseToolCallArgs(
  functionName: string,
  argsJson: string
): { valid: true; data: unknown } | { valid: false; error: string } {
  try {
    const args = JSON.parse(argsJson)
    return validateToolCallArgs(functionName, args)
  } catch {
    return { valid: false, error: 'Invalid JSON in function arguments' }
  }
}

/**
 * Check if a tool call requires user confirmation
 * Read-only operations (list_areas) don't need confirmation
 */
export function requiresConfirmation(functionName: string): boolean {
  switch (functionName) {
    case 'add_planting':
    case 'update_planting':
    case 'remove_planting':
      return true
    case 'list_areas':
      return false
    default:
      return true // Default to requiring confirmation for unknown functions
  }
}

/**
 * Format a tool call for human-readable display
 */
export function formatToolCallForUser(toolCall: ToolCall): string {
  try {
    const args = JSON.parse(toolCall.function.arguments)

    switch (toolCall.function.name) {
      case 'add_planting':
        return `Add ${args.varietyName || args.plantId} to ${args.areaId}${
          args.sowDate ? ` (sowing: ${args.sowDate})` : ''
        }`
      case 'update_planting':
        return `Update ${args.plantId} in ${args.areaId}`
      case 'remove_planting':
        return `Remove ${args.plantId} from ${args.areaId}`
      case 'list_areas':
        return args.kind ? `List ${args.kind} areas` : 'List all areas'
      default:
        return `Execute ${toolCall.function.name}`
    }
  } catch {
    return `Execute ${toolCall.function.name}`
  }
}
