/**
 * Perennial Flowers - Vegetable Database
 * Planting times adjusted for Scotland / Edinburgh climate
 */

import { Vegetable } from '@/types/garden-planner'

export const perennialFlowers: Vegetable[] = [
  {
    id: 'lavender',
    name: 'Lavender',
    category: 'perennial-flowers',
    description: 'Aromatic evergreen shrub with purple flower spikes. Excellent bee plant and culinary herb.',
    planting: {
      sowIndoorsMonths: [2, 3],
      sowOutdoorsMonths: [],
      transplantMonths: [5, 6, 9],
      harvestMonths: [6, 7, 8],
      daysToHarvest: { min: 365, max: 730 }
    },
    care: {
      sun: 'full-sun',
      water: 'low',
      spacing: { between: 45, rows: 60 },
      depth: 1,
      difficulty: 'intermediate',
      tips: [
        'Choose hardy varieties for Scotland (Lavandula angustifolia)',
        'Requires well-drained soil - raised beds ideal',
        'Prune after flowering to maintain shape',
        'Attracts bees and deters aphids'
      ]
    },
    enhancedCompanions: [
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true }
    ],
    rhsUrl: 'https://www.rhs.org.uk/herbs/lavender/grow-your-own',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Lavandula',
    enhancedAvoid: []
  },
  {
    id: 'echinacea',
    name: 'Echinacea',
    category: 'perennial-flowers',
    description: 'Purple coneflower with medicinal properties. Long-flowering and attracts butterflies.',
    planting: {
      sowIndoorsMonths: [2, 3],
      sowOutdoorsMonths: [5],
      transplantMonths: [5, 6, 9],
      harvestMonths: [7, 8, 9],
      daysToHarvest: { min: 365, max: 730 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 45, rows: 45 },
      depth: 1,
      difficulty: 'intermediate',
      tips: [
        'Very hardy perennial - survives Scottish winters',
        'Flowers from second year onwards',
        'Deadhead to prolong flowering',
        'Leave seed heads for birds in winter'
      ]
    },
    enhancedCompanions: [
      { plantId: 'rudbeckia', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'salvia', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Echinacea',
    enhancedAvoid: []
  },
  {
    id: 'rudbeckia',
    name: 'Rudbeckia',
    category: 'perennial-flowers',
    description: 'Black-eyed Susan with bright yellow flowers. Tough perennial for late summer color.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [5],
      transplantMonths: [5, 6, 9],
      harvestMonths: [7, 8, 9, 10],
      daysToHarvest: { min: 365, max: 730 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 45, rows: 45 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Very hardy and easy to grow',
        'Flowers from second year onwards',
        'Tolerates clay soil common in Scotland',
        'Spreads slowly to form clumps'
      ]
    },
    enhancedCompanions: [
      { plantId: 'echinacea', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'sedum', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Rudbeckia',
    enhancedAvoid: []
  },
  {
    id: 'sedum',
    name: 'Sedum',
    category: 'perennial-flowers',
    description: 'Stonecrop with succulent leaves and pink autumn flowers. Extremely hardy and drought-tolerant.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [],
      transplantMonths: [3, 4, 5, 9, 10],
      harvestMonths: [8, 9, 10],
      daysToHarvest: { min: 365, max: 730 }
    },
    care: {
      sun: 'full-sun',
      water: 'low',
      spacing: { between: 45, rows: 45 },
      depth: 5,
      difficulty: 'beginner',
      tips: [
        'Extremely drought-tolerant once established',
        'Flowers in late summer when little else blooms',
        'Attracts butterflies and bees',
        'Leave flower heads through winter for structure'
      ]
    },
    enhancedCompanions: [
      { plantId: 'lavender', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'thyme', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'rosemary', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Sedum',
    enhancedAvoid: []
  },
  {
    id: 'geranium',
    name: 'Hardy Geranium',
    category: 'perennial-flowers',
    description: 'True hardy geranium (not pelargonium). Long-flowering groundcover for borders.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [],
      transplantMonths: [4, 5, 9, 10],
      harvestMonths: [5, 6, 7, 8, 9],
      daysToHarvest: { min: 365, max: 730 }
    },
    care: {
      sun: 'partial-shade',
      water: 'moderate',
      spacing: { between: 40, rows: 40 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Very hardy - perfect for Scottish gardens',
        'Many varieties flower from May to September',
        'Cut back after first flush for second flowering',
        'Good groundcover to suppress weeds'
      ]
    },
    enhancedCompanions: [
      { plantId: 'lavender', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'salvia', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Geranium',
    enhancedAvoid: []
  },
  {
    id: 'salvia',
    name: 'Salvia',
    category: 'perennial-flowers',
    description: 'Ornamental sage with spikes of blue or purple flowers. Long flowering season attracts pollinators.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [],
      transplantMonths: [5, 6],
      harvestMonths: [6, 7, 8, 9, 10],
      daysToHarvest: { min: 365, max: 730 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 45, rows: 45 },
      depth: 1,
      difficulty: 'intermediate',
      tips: [
        'Choose hardy varieties for Scotland (S. nemorosa)',
        'Deadhead to prolong flowering',
        'Cut back in spring rather than autumn',
        'Attracts bees throughout summer'
      ]
    },
    enhancedCompanions: [
      { plantId: 'lavender', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'echinacea', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Salvia',
    enhancedAvoid: []
  },
  {
    id: 'yarrow',
    name: 'Yarrow (Achillea)',
    category: 'perennial-flowers',
    description: 'Hardy medicinal perennial with flat flower heads. Attracts beneficial insects and pollinators.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [5, 9],
      transplantMonths: [5, 6, 9, 10],
      harvestMonths: [6, 7, 8, 9],
      daysToHarvest: { min: 120, max: 180 }
    },
    care: {
      sun: 'full-sun',
      water: 'low',
      spacing: { between: 45, rows: 60 },
      depth: 0.5,
      difficulty: 'beginner',
      tips: [
        'Very drought-tolerant once established',
        'Attracts hoverflies and lacewings',
        'Cut flowers dry well for arrangements',
        'Can be invasive - deadhead to control spread'
      ]
    },
    enhancedCompanions: [
      { plantId: 'cabbage', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Achillea_millefolium',
    enhancedAvoid: []
  },
  {
    id: 'bergamot',
    name: 'Bergamot (Monarda)',
    category: 'perennial-flowers',
    description: 'Bee balm with aromatic leaves and showy flowers. Edible flowers and leaves for tea.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [5],
      transplantMonths: [5, 6],
      harvestMonths: [7, 8, 9],
      daysToHarvest: { min: 90, max: 120 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 45, rows: 60 },
      depth: 0.5,
      difficulty: 'beginner',
      tips: [
        'Bee and butterfly magnet',
        'Edible flowers - use in salads',
        'Aromatic leaves for tea',
        'Can spread - divide every 3 years'
      ]
    },
    enhancedCompanions: [
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Monarda',
    enhancedAvoid: []
  },
  {
    id: 'comfrey',
    name: 'Comfrey',
    category: 'perennial-flowers',
    description: 'Permaculture staple for fertilizer tea and compost activator. Deep roots mine nutrients.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [],
      transplantMonths: [3, 4, 9, 10],
      harvestMonths: [5, 6, 7, 8, 9],
      daysToHarvest: { min: 60, max: 90 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 60, rows: 90 },
      depth: 5,
      difficulty: 'beginner',
      tips: [
        'Bocking 14 variety is best (sterile)',
        'Cut leaves for compost activator',
        'Make liquid feed (comfrey tea)',
        'Deep taproot improves soil structure'
      ]
    },
    enhancedCompanions: [
      { plantId: 'potato', confidence: 'traditional', mechanism: 'unknown', bidirectional: false },
      { plantId: 'squash', confidence: 'traditional', mechanism: 'unknown', bidirectional: false }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Comfrey',
    enhancedAvoid: []
  },
  {
    id: 'tansy',
    name: 'Tansy',
    category: 'perennial-flowers',
    description: 'Historic companion plant with button-like yellow flowers. Natural pest deterrent.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [5],
      transplantMonths: [5, 6],
      harvestMonths: [7, 8, 9],
      daysToHarvest: { min: 120, max: 180 }
    },
    care: {
      sun: 'full-sun',
      water: 'low',
      spacing: { between: 45, rows: 60 },
      depth: 0.5,
      difficulty: 'beginner',
      tips: [
        'Repels ants, flies, and aphids',
        'Very hardy and drought-tolerant',
        'Can be invasive - deadhead flowers',
        'Historically used in companion planting'
      ]
    },
    enhancedCompanions: [
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Tansy',
    enhancedAvoid: []
  },
  {
    id: 'nepeta',
    name: 'Nepeta (Catmint)',
    category: 'perennial-flowers',
    description: 'Aromatic pollinator magnet with lavender-like flowers. Very hardy for Scottish gardens.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [5],
      transplantMonths: [5, 6, 9, 10],
      harvestMonths: [6, 7, 8, 9],
      daysToHarvest: { min: 90, max: 120 }
    },
    care: {
      sun: 'full-sun',
      water: 'low',
      spacing: { between: 45, rows: 60 },
      depth: 0.5,
      difficulty: 'beginner',
      tips: [
        'Excellent bee and butterfly plant',
        'Very drought-tolerant',
        'Shear after first flowering for repeat bloom',
        'Deer and rabbit resistant'
      ]
    },
    enhancedCompanions: [
      { plantId: 'lavender', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'salvia', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Nepeta',
    enhancedAvoid: []
  },
  {
    id: 'agastache',
    name: 'Agastache (Anise Hyssop)',
    category: 'perennial-flowers',
    description: 'Edible flowers and leaves with anise scent. Exceptional pollinator plant.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [5],
      transplantMonths: [5, 6],
      harvestMonths: [7, 8, 9, 10],
      daysToHarvest: { min: 90, max: 120 }
    },
    care: {
      sun: 'full-sun',
      water: 'low',
      spacing: { between: 40, rows: 50 },
      depth: 0.5,
      difficulty: 'beginner',
      tips: [
        'Edible flowers and leaves',
        'Bee and hummingbird favorite',
        'Anise-mint flavor for tea',
        'Very hardy in Scottish conditions'
      ]
    },
    enhancedCompanions: [
      { plantId: 'squash', confidence: 'traditional', mechanism: 'beneficial_attraction', bidirectional: false }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Agastache',
    enhancedAvoid: []
  }
]
