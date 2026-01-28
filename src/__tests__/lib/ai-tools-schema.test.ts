import { describe, it, expect } from 'vitest'
import {
  PLANTING_TOOLS,
  validateToolCallArgs,
  parseToolCallArgs,
  requiresConfirmation,
  formatToolCallForUser,
  addPlantingArgsSchema,
  updatePlantingArgsSchema,
  removePlantingArgsSchema,
  listAreasArgsSchema,
  type ToolCall,
} from '@/lib/ai-tools-schema'

describe('PLANTING_TOOLS', () => {
  it('should have 4 tools defined', () => {
    expect(PLANTING_TOOLS).toHaveLength(4)
  })

  it('should have correct tool names', () => {
    const toolNames = PLANTING_TOOLS.map((t) => t.function.name)
    expect(toolNames).toContain('add_planting')
    expect(toolNames).toContain('update_planting')
    expect(toolNames).toContain('remove_planting')
    expect(toolNames).toContain('list_areas')
  })

  it('should have type "function" for all tools', () => {
    PLANTING_TOOLS.forEach((tool) => {
      expect(tool.type).toBe('function')
    })
  })

  it('add_planting should require areaId and plantId', () => {
    const addPlanting = PLANTING_TOOLS.find((t) => t.function.name === 'add_planting')
    expect(addPlanting?.function.parameters.required).toContain('areaId')
    expect(addPlanting?.function.parameters.required).toContain('plantId')
  })

  it('update_planting should require areaId, plantId, and updates', () => {
    const updatePlanting = PLANTING_TOOLS.find((t) => t.function.name === 'update_planting')
    expect(updatePlanting?.function.parameters.required).toContain('areaId')
    expect(updatePlanting?.function.parameters.required).toContain('plantId')
    expect(updatePlanting?.function.parameters.required).toContain('updates')
  })

  it('remove_planting should require areaId and plantId', () => {
    const removePlanting = PLANTING_TOOLS.find((t) => t.function.name === 'remove_planting')
    expect(removePlanting?.function.parameters.required).toContain('areaId')
    expect(removePlanting?.function.parameters.required).toContain('plantId')
  })

  it('list_areas should have no required parameters', () => {
    const listAreas = PLANTING_TOOLS.find((t) => t.function.name === 'list_areas')
    expect(listAreas?.function.parameters.required).toBeUndefined()
  })
})

describe('addPlantingArgsSchema', () => {
  it('should validate valid args with required fields only', () => {
    const result = addPlantingArgsSchema.safeParse({
      areaId: 'bed-a',
      plantId: 'tomato',
    })
    expect(result.success).toBe(true)
  })

  it('should validate valid args with all fields', () => {
    const result = addPlantingArgsSchema.safeParse({
      areaId: 'bed-a',
      plantId: 'tomato',
      varietyName: 'San Marzano',
      sowDate: '2026-03-15',
      sowMethod: 'indoor',
      quantity: 12,
      notes: 'Test notes',
    })
    expect(result.success).toBe(true)
  })

  it('should reject missing areaId', () => {
    const result = addPlantingArgsSchema.safeParse({
      plantId: 'tomato',
    })
    expect(result.success).toBe(false)
  })

  it('should reject missing plantId', () => {
    const result = addPlantingArgsSchema.safeParse({
      areaId: 'bed-a',
    })
    expect(result.success).toBe(false)
  })

  it('should reject empty areaId', () => {
    const result = addPlantingArgsSchema.safeParse({
      areaId: '',
      plantId: 'tomato',
    })
    expect(result.success).toBe(false)
  })

  it('should reject invalid sowDate format', () => {
    const result = addPlantingArgsSchema.safeParse({
      areaId: 'bed-a',
      plantId: 'tomato',
      sowDate: '15-03-2026',
    })
    expect(result.success).toBe(false)
  })

  it('should reject invalid sowMethod', () => {
    const result = addPlantingArgsSchema.safeParse({
      areaId: 'bed-a',
      plantId: 'tomato',
      sowMethod: 'invalid',
    })
    expect(result.success).toBe(false)
  })

  it('should reject negative quantity', () => {
    const result = addPlantingArgsSchema.safeParse({
      areaId: 'bed-a',
      plantId: 'tomato',
      quantity: -5,
    })
    expect(result.success).toBe(false)
  })
})

describe('updatePlantingArgsSchema', () => {
  it('should validate valid args with empty updates', () => {
    const result = updatePlantingArgsSchema.safeParse({
      areaId: 'bed-a',
      plantId: 'tomato',
      updates: {},
    })
    expect(result.success).toBe(true)
  })

  it('should validate valid args with multiple updates', () => {
    const result = updatePlantingArgsSchema.safeParse({
      areaId: 'bed-a',
      plantId: 'tomato',
      updates: {
        varietyName: 'Roma',
        sowDate: '2026-03-20',
        success: 'excellent',
        notes: 'Great crop this year',
        status: 'harvested',
      },
    })
    expect(result.success).toBe(true)
  })

  it('should reject missing updates object', () => {
    const result = updatePlantingArgsSchema.safeParse({
      areaId: 'bed-a',
      plantId: 'tomato',
    })
    expect(result.success).toBe(false)
  })

  it('should reject invalid success value', () => {
    const result = updatePlantingArgsSchema.safeParse({
      areaId: 'bed-a',
      plantId: 'tomato',
      updates: { success: 'amazing' },
    })
    expect(result.success).toBe(false)
  })

  it('should reject invalid status value', () => {
    const result = updatePlantingArgsSchema.safeParse({
      areaId: 'bed-a',
      plantId: 'tomato',
      updates: { status: 'unknown' },
    })
    expect(result.success).toBe(false)
  })

  it('should validate all valid sowMethod values', () => {
    const methods = ['indoor', 'outdoor', 'transplant-purchased']
    methods.forEach((method) => {
      const result = updatePlantingArgsSchema.safeParse({
        areaId: 'bed-a',
        plantId: 'tomato',
        updates: { sowMethod: method },
      })
      expect(result.success).toBe(true)
    })
  })
})

describe('removePlantingArgsSchema', () => {
  it('should validate valid args', () => {
    const result = removePlantingArgsSchema.safeParse({
      areaId: 'bed-a',
      plantId: 'tomato',
    })
    expect(result.success).toBe(true)
  })

  it('should reject missing areaId', () => {
    const result = removePlantingArgsSchema.safeParse({
      plantId: 'tomato',
    })
    expect(result.success).toBe(false)
  })

  it('should reject missing plantId', () => {
    const result = removePlantingArgsSchema.safeParse({
      areaId: 'bed-a',
    })
    expect(result.success).toBe(false)
  })
})

describe('listAreasArgsSchema', () => {
  it('should validate empty object', () => {
    const result = listAreasArgsSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('should validate valid kind filter', () => {
    const kinds = ['rotation-bed', 'perennial-bed', 'tree', 'berry', 'herb', 'infrastructure', 'other']
    kinds.forEach((kind) => {
      const result = listAreasArgsSchema.safeParse({ kind })
      expect(result.success).toBe(true)
    })
  })

  it('should reject invalid kind', () => {
    const result = listAreasArgsSchema.safeParse({ kind: 'invalid-kind' })
    expect(result.success).toBe(false)
  })
})

describe('validateToolCallArgs', () => {
  it('should validate add_planting args', () => {
    const result = validateToolCallArgs('add_planting', {
      areaId: 'bed-a',
      plantId: 'tomato',
    })
    expect(result.valid).toBe(true)
  })

  it('should return error for invalid add_planting args', () => {
    const result = validateToolCallArgs('add_planting', {
      plantId: 'tomato',
    })
    expect(result.valid).toBe(false)
    if (!result.valid) {
      // Zod error messages may vary, just check there is an error
      expect(result.error.length).toBeGreaterThan(0)
    }
  })

  it('should validate update_planting args', () => {
    const result = validateToolCallArgs('update_planting', {
      areaId: 'bed-a',
      plantId: 'tomato',
      updates: { notes: 'test' },
    })
    expect(result.valid).toBe(true)
  })

  it('should validate remove_planting args', () => {
    const result = validateToolCallArgs('remove_planting', {
      areaId: 'bed-a',
      plantId: 'tomato',
    })
    expect(result.valid).toBe(true)
  })

  it('should validate list_areas args', () => {
    const result = validateToolCallArgs('list_areas', {})
    expect(result.valid).toBe(true)
  })

  it('should reject unknown function name', () => {
    const result = validateToolCallArgs('unknown_function', {})
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.error).toContain('Unknown function')
    }
  })
})

describe('parseToolCallArgs', () => {
  it('should parse valid JSON and validate', () => {
    const result = parseToolCallArgs(
      'add_planting',
      '{"areaId":"bed-a","plantId":"tomato"}'
    )
    expect(result.valid).toBe(true)
  })

  it('should return error for invalid JSON', () => {
    const result = parseToolCallArgs('add_planting', 'not valid json')
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.error).toContain('Invalid JSON')
    }
  })

  it('should return validation error for valid JSON but invalid args', () => {
    const result = parseToolCallArgs('add_planting', '{"plantId":"tomato"}')
    expect(result.valid).toBe(false)
    if (!result.valid) {
      // Zod error messages may vary, just check there is an error
      expect(result.error.length).toBeGreaterThan(0)
    }
  })
})

describe('requiresConfirmation', () => {
  it('should return true for add_planting', () => {
    expect(requiresConfirmation('add_planting')).toBe(true)
  })

  it('should return true for update_planting', () => {
    expect(requiresConfirmation('update_planting')).toBe(true)
  })

  it('should return true for remove_planting', () => {
    expect(requiresConfirmation('remove_planting')).toBe(true)
  })

  it('should return false for list_areas', () => {
    expect(requiresConfirmation('list_areas')).toBe(false)
  })

  it('should return true for unknown functions', () => {
    expect(requiresConfirmation('unknown_function')).toBe(true)
  })
})

describe('formatToolCallForUser', () => {
  it('should format add_planting with variety', () => {
    const toolCall: ToolCall = {
      id: 'call_123',
      type: 'function',
      function: {
        name: 'add_planting',
        arguments: '{"areaId":"bed-a","plantId":"tomato","varietyName":"San Marzano","sowDate":"2026-03-15"}',
      },
    }
    const result = formatToolCallForUser(toolCall)
    expect(result).toBe('Add San Marzano to bed-a (sowing: 2026-03-15)')
  })

  it('should format add_planting without variety', () => {
    const toolCall: ToolCall = {
      id: 'call_123',
      type: 'function',
      function: {
        name: 'add_planting',
        arguments: '{"areaId":"bed-a","plantId":"tomato"}',
      },
    }
    const result = formatToolCallForUser(toolCall)
    expect(result).toBe('Add tomato to bed-a')
  })

  it('should format update_planting', () => {
    const toolCall: ToolCall = {
      id: 'call_123',
      type: 'function',
      function: {
        name: 'update_planting',
        arguments: '{"areaId":"bed-a","plantId":"tomato","updates":{"notes":"test"}}',
      },
    }
    const result = formatToolCallForUser(toolCall)
    expect(result).toBe('Update tomato in bed-a')
  })

  it('should format remove_planting', () => {
    const toolCall: ToolCall = {
      id: 'call_123',
      type: 'function',
      function: {
        name: 'remove_planting',
        arguments: '{"areaId":"bed-a","plantId":"tomato"}',
      },
    }
    const result = formatToolCallForUser(toolCall)
    expect(result).toBe('Remove tomato from bed-a')
  })

  it('should format list_areas with kind', () => {
    const toolCall: ToolCall = {
      id: 'call_123',
      type: 'function',
      function: {
        name: 'list_areas',
        arguments: '{"kind":"rotation-bed"}',
      },
    }
    const result = formatToolCallForUser(toolCall)
    expect(result).toBe('List rotation-bed areas')
  })

  it('should format list_areas without kind', () => {
    const toolCall: ToolCall = {
      id: 'call_123',
      type: 'function',
      function: {
        name: 'list_areas',
        arguments: '{}',
      },
    }
    const result = formatToolCallForUser(toolCall)
    expect(result).toBe('List all areas')
  })

  it('should handle unknown function', () => {
    const toolCall: ToolCall = {
      id: 'call_123',
      type: 'function',
      function: {
        name: 'unknown_function',
        arguments: '{}',
      },
    }
    const result = formatToolCallForUser(toolCall)
    expect(result).toBe('Execute unknown_function')
  })

  it('should handle invalid JSON gracefully', () => {
    const toolCall: ToolCall = {
      id: 'call_123',
      type: 'function',
      function: {
        name: 'add_planting',
        arguments: 'not valid json',
      },
    }
    const result = formatToolCallForUser(toolCall)
    expect(result).toBe('Execute add_planting')
  })
})
