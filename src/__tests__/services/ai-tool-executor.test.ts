import { describe, it, expect, beforeEach } from 'vitest'
import {
  executeToolCall,
  executeToolCalls,
  formatResultsForAI,
} from '@/services/ai-tool-executor'
import type { AllotmentData } from '@/types/unified-allotment'
import type { ToolCall } from '@/lib/ai-tools-schema'

// Mock allotment data for testing
function createMockAllotmentData(): AllotmentData {
  return {
    version: 16,
    currentYear: 2026,
    meta: {
      name: 'Test Allotment',
      location: 'Edinburgh, Scotland',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    layout: {
      areas: [
        {
          id: 'bed-a',
          name: 'Bed A',
          kind: 'rotation-bed',
          canHavePlantings: true,
        },
        {
          id: 'bed-b',
          name: 'Bed B',
          kind: 'rotation-bed',
          canHavePlantings: true,
        },
        {
          id: 'shed',
          name: 'Garden Shed',
          kind: 'infrastructure',
          canHavePlantings: false,
        },
      ],
    },
    seasons: [
      {
        year: 2026,
        status: 'current',
        areas: [
          {
            areaId: 'bed-a',
            plantings: [
              {
                id: 'planting-1',
                plantId: 'tomato',
                varietyName: 'San Marzano',
                sowDate: '2026-03-15',
                status: 'active',
              },
            ],
          },
          {
            areaId: 'bed-b',
            plantings: [],
          },
        ],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ],
    varieties: [],
  }
}

function createToolCall(
  name: string,
  args: Record<string, unknown>,
  id?: string
): ToolCall {
  return {
    id: id || `call_${Math.random().toString(36).substr(2, 9)}`,
    type: 'function',
    function: {
      name,
      arguments: JSON.stringify(args),
    },
  }
}

describe('executeToolCall', () => {
  let mockData: AllotmentData

  beforeEach(() => {
    mockData = createMockAllotmentData()
  })

  describe('add_planting', () => {
    it('should add a planting to a valid area', () => {
      const toolCall = createToolCall('add_planting', {
        areaId: 'bed-b',
        plantId: 'carrot',
        varietyName: 'Nantes 2',
        sowDate: '2026-04-01',
      })

      const { updatedData, result } = executeToolCall(toolCall, mockData, 2026)

      expect(result.success).toBe(true)
      expect(result.result).toBeDefined()
      expect((result.result as { message: string }).message).toContain('Carrot') // Plant name is capitalized
      expect((result.result as { message: string }).message).toContain('Bed B')

      // Check the planting was added
      const bedB = updatedData.seasons[0].areas.find(a => a.areaId === 'bed-b')
      expect(bedB?.plantings).toHaveLength(1)
      expect(bedB?.plantings[0].plantId).toBe('carrot')
      expect(bedB?.plantings[0].varietyName).toBe('Nantes 2')
    })

    it('should reject planting to non-existent area', () => {
      const toolCall = createToolCall('add_planting', {
        areaId: 'bed-z',
        plantId: 'tomato',
      })

      const { updatedData, result } = executeToolCall(toolCall, mockData, 2026)

      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
      // Data should be unchanged
      expect(updatedData).toEqual(mockData)
    })

    it('should reject planting to area that cannot have plantings', () => {
      const toolCall = createToolCall('add_planting', {
        areaId: 'shed',
        plantId: 'tomato',
      })

      const { updatedData, result } = executeToolCall(toolCall, mockData, 2026)

      expect(result.success).toBe(false)
      expect(result.error).toContain('cannot have plantings')
      expect(updatedData).toEqual(mockData)
    })

    it('should reject invalid plant ID', () => {
      const toolCall = createToolCall('add_planting', {
        areaId: 'bed-b',
        plantId: 'nonexistent-plant-xyz',
      })

      const { updatedData, result } = executeToolCall(toolCall, mockData, 2026)

      expect(result.success).toBe(false)
      expect(result.error).toContain('not found in the database')
      expect(updatedData).toEqual(mockData)
    })

    it('should set status to active when sowDate is provided', () => {
      const toolCall = createToolCall('add_planting', {
        areaId: 'bed-b',
        plantId: 'lettuce',
        sowDate: '2026-04-15',
      })

      const { updatedData, result } = executeToolCall(toolCall, mockData, 2026)

      expect(result.success).toBe(true)
      const bedB = updatedData.seasons[0].areas.find(a => a.areaId === 'bed-b')
      expect(bedB?.plantings[0].status).toBe('active')
    })

    it('should set status to planned when no sowDate', () => {
      const toolCall = createToolCall('add_planting', {
        areaId: 'bed-b',
        plantId: 'lettuce',
      })

      const { updatedData, result } = executeToolCall(toolCall, mockData, 2026)

      expect(result.success).toBe(true)
      const bedB = updatedData.seasons[0].areas.find(a => a.areaId === 'bed-b')
      expect(bedB?.plantings[0].status).toBe('planned')
    })
  })

  describe('update_planting', () => {
    it('should update an existing planting', () => {
      const toolCall = createToolCall('update_planting', {
        areaId: 'bed-a',
        plantId: 'tomato',
        updates: {
          notes: 'Growing well!',
          success: 'good',
        },
      })

      const { updatedData, result } = executeToolCall(toolCall, mockData, 2026)

      expect(result.success).toBe(true)
      const bedA = updatedData.seasons[0].areas.find(a => a.areaId === 'bed-a')
      expect(bedA?.plantings[0].notes).toBe('Growing well!')
      expect(bedA?.plantings[0].success).toBe('good')
    })

    it('should reject update for non-existent planting', () => {
      const toolCall = createToolCall('update_planting', {
        areaId: 'bed-a',
        plantId: 'carrot', // Not in bed-a
        updates: { notes: 'test' },
      })

      const { updatedData, result } = executeToolCall(toolCall, mockData, 2026)

      expect(result.success).toBe(false)
      expect(result.error).toMatch(/not found|No .*carrot/i)
      expect(updatedData).toEqual(mockData)
    })

    it('should reject update for non-existent area', () => {
      const toolCall = createToolCall('update_planting', {
        areaId: 'bed-z',
        plantId: 'tomato',
        updates: { notes: 'test' },
      })

      const { result } = executeToolCall(toolCall, mockData, 2026)

      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })
  })

  describe('remove_planting', () => {
    it('should remove an existing planting', () => {
      const toolCall = createToolCall('remove_planting', {
        areaId: 'bed-a',
        plantId: 'tomato',
      })

      const { updatedData, result } = executeToolCall(toolCall, mockData, 2026)

      expect(result.success).toBe(true)
      const bedA = updatedData.seasons[0].areas.find(a => a.areaId === 'bed-a')
      expect(bedA?.plantings).toHaveLength(0)
    })

    it('should reject removal of non-existent planting', () => {
      const toolCall = createToolCall('remove_planting', {
        areaId: 'bed-b',
        plantId: 'tomato', // Not in bed-b
      })

      const { updatedData, result } = executeToolCall(toolCall, mockData, 2026)

      expect(result.success).toBe(false)
      expect(result.error).toMatch(/not found|No .*tomato|empty/i)
      expect(updatedData).toEqual(mockData)
    })
  })

  describe('list_areas', () => {
    it('should list all areas', () => {
      const toolCall = createToolCall('list_areas', {})

      const { updatedData, result } = executeToolCall(toolCall, mockData, 2026)

      expect(result.success).toBe(true)
      const areas = (result.result as { areas: unknown[] }).areas
      expect(areas).toHaveLength(3)
      // Data should be unchanged
      expect(updatedData).toEqual(mockData)
    })

    it('should filter areas by kind', () => {
      const toolCall = createToolCall('list_areas', {
        kind: 'rotation-bed',
      })

      const { result } = executeToolCall(toolCall, mockData, 2026)

      expect(result.success).toBe(true)
      const areas = (result.result as { areas: unknown[] }).areas
      expect(areas).toHaveLength(2)
    })

    it('should exclude archived areas', () => {
      // Add an archived area
      const dataWithArchived = {
        ...mockData,
        layout: {
          areas: [
            ...mockData.layout.areas,
            {
              id: 'bed-c',
              name: 'Bed C (Archived)',
              kind: 'rotation-bed' as const,
              canHavePlantings: true,
              isArchived: true,
            },
          ],
        },
      }

      const toolCall = createToolCall('list_areas', {})

      const { result } = executeToolCall(toolCall, dataWithArchived, 2026)

      expect(result.success).toBe(true)
      const areas = (result.result as { areas: { id: string }[] }).areas
      expect(areas).toHaveLength(3) // Should not include archived
      expect(areas.find(a => a.id === 'bed-c')).toBeUndefined()
    })
  })

  describe('invalid arguments', () => {
    it('should reject invalid JSON arguments', () => {
      const toolCall: ToolCall = {
        id: 'test-call',
        type: 'function',
        function: {
          name: 'add_planting',
          arguments: 'not valid json',
        },
      }

      const { result } = executeToolCall(toolCall, mockData, 2026)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid')
    })

    it('should reject missing required fields', () => {
      const toolCall = createToolCall('add_planting', {
        // Missing areaId and plantId
      })

      const { result } = executeToolCall(toolCall, mockData, 2026)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid arguments')
    })
  })

  describe('unknown function', () => {
    it('should reject unknown function names', () => {
      const toolCall = createToolCall('unknown_function', {})

      const { result } = executeToolCall(toolCall, mockData, 2026)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Unknown function')
    })
  })
})

describe('executeToolCalls', () => {
  let mockData: AllotmentData

  beforeEach(() => {
    mockData = createMockAllotmentData()
  })

  it('should execute multiple tool calls in sequence', () => {
    const toolCalls = [
      createToolCall('add_planting', {
        areaId: 'bed-b',
        plantId: 'carrot',
      }),
      createToolCall('add_planting', {
        areaId: 'bed-b',
        plantId: 'lettuce',
      }),
    ]

    const { updatedData, results } = executeToolCalls(toolCalls, mockData, 2026)

    expect(results).toHaveLength(2)
    expect(results[0].success).toBe(true)
    expect(results[1].success).toBe(true)

    const bedB = updatedData.seasons[0].areas.find(a => a.areaId === 'bed-b')
    expect(bedB?.plantings).toHaveLength(2)
  })

  it('should accumulate changes across calls', () => {
    const toolCalls = [
      createToolCall('add_planting', {
        areaId: 'bed-b',
        plantId: 'carrot',
      }),
      createToolCall('update_planting', {
        areaId: 'bed-b',
        plantId: 'carrot',
        updates: { notes: 'Added via batch' },
      }),
    ]

    const { updatedData, results } = executeToolCalls(toolCalls, mockData, 2026)

    expect(results[0].success).toBe(true)
    expect(results[1].success).toBe(true)

    const bedB = updatedData.seasons[0].areas.find(a => a.areaId === 'bed-b')
    expect(bedB?.plantings[0].notes).toBe('Added via batch')
  })

  it('should continue after failures', () => {
    const toolCalls = [
      createToolCall('add_planting', {
        areaId: 'bed-z', // Invalid
        plantId: 'carrot',
      }),
      createToolCall('add_planting', {
        areaId: 'bed-b', // Valid
        plantId: 'lettuce',
      }),
    ]

    const { updatedData, results } = executeToolCalls(toolCalls, mockData, 2026)

    expect(results[0].success).toBe(false)
    expect(results[1].success).toBe(true)

    const bedB = updatedData.seasons[0].areas.find(a => a.areaId === 'bed-b')
    expect(bedB?.plantings).toHaveLength(1)
  })
})

describe('formatResultsForAI', () => {
  it('should format successful results', () => {
    const results = [
      {
        tool_call_id: 'call-1',
        success: true,
        result: { message: 'Added tomato to Bed A' },
      },
    ]

    const formatted = formatResultsForAI(results)

    expect(formatted).toContain('Successfully completed 1 operation')
    expect(formatted).toContain('Added tomato to Bed A')
  })

  it('should format failed results', () => {
    const results = [
      {
        tool_call_id: 'call-1',
        success: false,
        error: 'Area not found',
      },
    ]

    const formatted = formatResultsForAI(results)

    expect(formatted).toContain('Failed 1 operation')
    expect(formatted).toContain('Area not found')
  })

  it('should format mixed results', () => {
    const results = [
      {
        tool_call_id: 'call-1',
        success: true,
        result: { message: 'Added tomato' },
      },
      {
        tool_call_id: 'call-2',
        success: false,
        error: 'Area not found',
      },
    ]

    const formatted = formatResultsForAI(results)

    expect(formatted).toContain('Successfully completed 1 operation')
    expect(formatted).toContain('Failed 1 operation')
  })
})

// ============ NEW EDGE CASE TESTS ============

describe('plural form handling', () => {
  let mockData: AllotmentData

  beforeEach(() => {
    mockData = createMockAllotmentData()
    // Update mock data to use 'carrot' instead of 'tomato' for testing
    // since 'carrot' exists in the database
    const bedA = mockData.seasons[0].areas.find(a => a.areaId === 'bed-a')
    if (bedA && bedA.plantings.length > 0) {
      bedA.plantings[0].plantId = 'carrot'
      bedA.plantings[0].varietyName = 'Nantes 2'
    }
  })

  it('should handle plural plant names when adding (carrots -> carrot)', () => {
    const toolCall = createToolCall('add_planting', {
      areaId: 'bed-b',
      plantId: 'carrots', // Plural form
    })

    const { result } = executeToolCall(toolCall, mockData, 2026)

    expect(result.success).toBe(true)
    // The normalized ID should be 'carrot'
    expect((result.result as { plantId: string }).plantId).toBe('carrot')
  })

  it('should handle case-insensitive plant names', () => {
    const toolCall = createToolCall('add_planting', {
      areaId: 'bed-b',
      plantId: 'CARROT', // Uppercase
    })

    const { result } = executeToolCall(toolCall, mockData, 2026)

    expect(result.success).toBe(true)
  })

  it('should find existing planting with plural form (remove carrots -> carrot)', () => {
    const toolCall = createToolCall('remove_planting', {
      areaId: 'bed-a',
      plantId: 'carrots', // Plural form, existing plant is 'carrot'
    })

    const { result } = executeToolCall(toolCall, mockData, 2026)

    expect(result.success).toBe(true)
  })

  it('should update existing planting with uppercase name', () => {
    const toolCall = createToolCall('update_planting', {
      areaId: 'bed-a',
      plantId: 'CARROT', // Uppercase
      updates: { notes: 'Updated via case-insensitive match' },
    })

    const { result } = executeToolCall(toolCall, mockData, 2026)

    expect(result.success).toBe(true)
  })
})

describe('error messages with recovery suggestions', () => {
  let mockData: AllotmentData

  beforeEach(() => {
    mockData = createMockAllotmentData()
  })

  it('should include suggestions for invalid area', () => {
    const toolCall = createToolCall('add_planting', {
      areaId: 'invalid-bed',
      plantId: 'carrot',
    })

    const { result } = executeToolCall(toolCall, mockData, 2026)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Suggestion')
    expect(result.error).toContain('bed-a') // Should suggest available beds
  })

  it('should include suggestions for invalid plant', () => {
    const toolCall = createToolCall('add_planting', {
      areaId: 'bed-b',
      plantId: 'xyznonexistent', // Completely invalid plant
    })

    const { result } = executeToolCall(toolCall, mockData, 2026)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Suggestion')
  })

  it('should suggest available plants when updating non-existent planting', () => {
    const toolCall = createToolCall('update_planting', {
      areaId: 'bed-a',
      plantId: 'lettuce', // Not in bed-a (which has tomato)
      updates: { notes: 'test' },
    })

    const { result } = executeToolCall(toolCall, mockData, 2026)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Suggestion')
    // Mock data has 'tomato' in bed-a, so should mention that
    expect(result.error?.toLowerCase()).toContain('tomato')
  })

  it('should indicate empty bed when removing from empty area', () => {
    const toolCall = createToolCall('remove_planting', {
      areaId: 'bed-b', // Empty bed
      plantId: 'carrot',
    })

    const { result } = executeToolCall(toolCall, mockData, 2026)

    expect(result.success).toBe(false)
    expect(result.error).toContain('empty')
  })

  it('should reject infrastructure areas with helpful suggestion', () => {
    const toolCall = createToolCall('add_planting', {
      areaId: 'shed',
      plantId: 'carrot',
    })

    const { result } = executeToolCall(toolCall, mockData, 2026)

    expect(result.success).toBe(false)
    expect(result.error).toContain('infrastructure')
    expect(result.error).toContain('Suggestion')
    expect(result.error).toContain('bed-a') // Should suggest a plantable bed
  })
})

describe('batch operations', () => {
  let mockData: AllotmentData

  beforeEach(() => {
    mockData = createMockAllotmentData()
  })

  it('should handle "planted 3 carrots" scenario - multiple plants same type', () => {
    // This simulates adding multiple plants of the same type
    const toolCalls = [
      createToolCall('add_planting', {
        areaId: 'bed-b',
        plantId: 'carrot',
        quantity: 3,
        notes: 'First batch',
      }),
    ]

    const { updatedData, results } = executeToolCalls(toolCalls, mockData, 2026)

    expect(results[0].success).toBe(true)
    const bedB = updatedData.seasons[0].areas.find(a => a.areaId === 'bed-b')
    expect(bedB?.plantings[0].quantity).toBe(3)
  })

  it('should handle "sowed carrots and beans in bed B" scenario - multiple plant types', () => {
    const toolCalls = [
      createToolCall('add_planting', {
        areaId: 'bed-b',
        plantId: 'carrot',
      }),
      createToolCall('add_planting', {
        areaId: 'bed-b',
        plantId: 'broad-beans', // Note: database uses 'broad-beans' (plural)
      }),
    ]

    const { updatedData, results } = executeToolCalls(toolCalls, mockData, 2026)

    expect(results[0].success).toBe(true)
    expect(results[1].success).toBe(true)

    const bedB = updatedData.seasons[0].areas.find(a => a.areaId === 'bed-b')
    expect(bedB?.plantings).toHaveLength(2)
    expect(bedB?.plantings.map(p => p.plantId)).toContain('carrot')
    expect(bedB?.plantings.map(p => p.plantId)).toContain('broad-beans')
  })

  it('should handle mixed operations in batch', () => {
    // First update mock data to use a plant that exists in the database
    const bedA = mockData.seasons[0].areas.find(a => a.areaId === 'bed-a')
    if (bedA && bedA.plantings.length > 0) {
      bedA.plantings[0].plantId = 'carrot'
    }

    const toolCalls = [
      createToolCall('add_planting', {
        areaId: 'bed-b',
        plantId: 'lettuce',
      }),
      createToolCall('update_planting', {
        areaId: 'bed-a',
        plantId: 'carrot',
        updates: { status: 'harvested' },
      }),
      createToolCall('list_areas', {}),
    ]

    const { results } = executeToolCalls(toolCalls, mockData, 2026)

    expect(results[0].success).toBe(true) // Add succeeded
    expect(results[1].success).toBe(true) // Update succeeded
    expect(results[2].success).toBe(true) // List succeeded
  })
})
