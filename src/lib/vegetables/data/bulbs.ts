/**
 * Bulbs - Vegetable Database
 * Planting times adjusted for Scotland / Edinburgh climate
 */

import { Vegetable } from '@/types/garden-planner'

export const bulbs: Vegetable[] = [
  {
    id: 'tulip',
    name: 'Tulip',
    category: 'bulbs',
    description: 'Spring-flowering bulb with vibrant colors. Plant in autumn for spring display.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [],
      transplantMonths: [10, 11],
      harvestMonths: [3, 4, 5],
      daysToHarvest: { min: 120, max: 180 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 10, rows: 15 },
      depth: 15,
      difficulty: 'beginner',
      tips: [
        'Plant bulbs in November for best results',
        'Well-drained soil essential - avoid waterlogging',
        'Lift and dry bulbs after flowering or leave in ground',
        'Deer and rabbit resistant'
      ]
    },
    enhancedCompanions: [
      { plantId: 'daffodil', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Tulip',
    enhancedAvoid: []
  },
  {
    id: 'daffodil',
    name: 'Daffodil',
    category: 'bulbs',
    description: 'Hardy spring bulb with yellow or white flowers. Naturalizes well and returns year after year.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [],
      transplantMonths: [9, 10, 11],
      harvestMonths: [2, 3, 4],
      daysToHarvest: { min: 120, max: 180 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 10, rows: 15 },
      depth: 15,
      difficulty: 'beginner',
      tips: [
        'Very hardy - perfect for Scottish gardens',
        'Plant early (September) for best results',
        'Allow foliage to die back naturally after flowering',
        'Naturalizes in grass and woodland areas'
      ]
    },
    enhancedCompanions: [
      { plantId: 'tulip', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'crocus', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Narcissus_(plant)',
    enhancedAvoid: []
  },
  {
    id: 'allium-flower',
    name: 'Ornamental Allium',
    category: 'bulbs',
    description: 'Dramatic spherical flower heads on tall stems. Excellent architectural plant and bee attractor.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [],
      transplantMonths: [9, 10, 11],
      harvestMonths: [5, 6, 7],
      daysToHarvest: { min: 180, max: 240 }
    },
    care: {
      sun: 'full-sun',
      water: 'low',
      spacing: { between: 20, rows: 25 },
      depth: 15,
      difficulty: 'beginner',
      tips: [
        'Plant bulbs in autumn for early summer flowers',
        'Leave seed heads for winter interest',
        'Deer and rabbit resistant',
        'Excellent cut or dried flowers'
      ]
    },
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Allium',
    enhancedCompanions: [],
    enhancedAvoid: []
  },
  {
    id: 'crocus',
    name: 'Crocus',
    category: 'bulbs',
    description: 'Early spring bulb with cup-shaped flowers. One of the first flowers to bloom in Scottish gardens.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [],
      transplantMonths: [9, 10],
      harvestMonths: [2, 3, 4],
      daysToHarvest: { min: 90, max: 120 }
    },
    care: {
      sun: 'full-sun',
      water: 'low',
      spacing: { between: 7, rows: 10 },
      depth: 10,
      difficulty: 'beginner',
      tips: [
        'Very early flowering - valuable for early bees',
        'Naturalizes in lawns and under trees',
        'Plant in drifts for best effect',
        'Multiplies over time'
      ]
    },
    enhancedCompanions: [
      { plantId: 'daffodil', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Crocus',
    enhancedAvoid: []
  },
  {
    id: 'dahlia',
    name: 'Dahlia',
    category: 'bulbs',
    description: 'Tender tuber with spectacular summer flowers. Lift and store over winter in Scotland.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [],
      transplantMonths: [5, 6],
      harvestMonths: [7, 8, 9, 10],
      daysToHarvest: { min: 90, max: 120 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 45, rows: 60 },
      depth: 10,
      difficulty: 'intermediate',
      tips: [
        'Not frost-hardy - plant after last frost',
        'Lift tubers in autumn and store frost-free',
        'Stake tall varieties to prevent wind damage',
        'Excellent cut flower with long vase life'
      ]
    },
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Dahlia',
    enhancedCompanions: [],
    enhancedAvoid: []
  }
]
