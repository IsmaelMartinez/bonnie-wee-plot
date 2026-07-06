/**
 * Mushrooms - Vegetable Database
 * Planting times adjusted for Scotland / Edinburgh climate
 */

import { Vegetable } from '@/types/garden-planner'

export const mushrooms: Vegetable[] = [
  {
    id: 'oyster-mushroom',
    storage: {
      methods: ['dry', 'fridge', 'freeze'],
      freshDays: 5,
      tip: 'Use fresh within a few days; slice and dry, or cook first then freeze.',
    },
    name: 'Oyster Mushroom',
    category: 'mushrooms',
    description: 'Easy-to-grow gourmet mushroom. Grows on straw or coffee grounds indoors or outdoors.',
    planting: {
      sowIndoorsMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      sowOutdoorsMonths: [4, 5, 6, 7, 8, 9],
      transplantMonths: [],
      harvestMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      daysToHarvest: { min: 7, max: 21 }
    },
    care: {
      sun: 'shade',
      water: 'high',
      spacing: { between: 0, rows: 0 },
      depth: 0,
      difficulty: 'beginner',
      tips: [
        'Easiest mushroom for beginners',
        'Grows on straw, coffee grounds, or sawdust',
        'Can fruit multiple times (flushes)',
        'Keep substrate moist and humid'
      ]
    },
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Pleurotus_ostreatus',
    hardiness: 'H4',
    enhancedCompanions: [],
    enhancedAvoid: []
  },
  {
    id: 'shiitake',
    storage: {
      methods: ['dry', 'fridge', 'freeze'],
      freshDays: 7,
      tip: 'Dries superbly and the flavour deepens — thread caps to dry then store airtight; keep fresh caps a week in a paper bag.',
    },
    name: 'Shiitake',
    category: 'mushrooms',
    description: 'Premium medicinal mushroom. Grows on hardwood logs or sawdust blocks.',
    planting: {
      sowIndoorsMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      sowOutdoorsMonths: [3, 4, 5, 6, 7, 8],
      transplantMonths: [],
      harvestMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      daysToHarvest: { min: 90, max: 180 }
    },
    care: {
      sun: 'shade',
      water: 'moderate',
      spacing: { between: 0, rows: 0 },
      depth: 0,
      difficulty: 'intermediate',
      tips: [
        'Grows best on oak, beech, or birch logs',
        'Logs can produce for 4-6 years',
        'Needs cool shock to trigger fruiting',
        'High medicinal value'
      ]
    },
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Lentinula_edodes',
    hardiness: 'H4',
    enhancedCompanions: [],
    enhancedAvoid: []
  },
  {
    id: 'lions-mane',
    storage: {
      methods: ['fridge', 'freeze', 'dry'],
      freshDays: 4,
      tip: 'Browns and sours fast — use within days; saute then freeze, or dry chunks and blitz to powder for broths.',
    },
    name: "Lion's Mane",
    category: 'mushrooms',
    description: 'Unusual white cascading mushroom. Medicinal benefits for brain health.',
    planting: {
      sowIndoorsMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      sowOutdoorsMonths: [4, 5, 6, 7, 8],
      transplantMonths: [],
      harvestMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      daysToHarvest: { min: 14, max: 21 }
    },
    care: {
      sun: 'shade',
      water: 'high',
      spacing: { between: 0, rows: 0 },
      depth: 0,
      difficulty: 'intermediate',
      tips: [
        'Striking white cascading appearance',
        'Known for cognitive health benefits',
        'Grows on hardwood sawdust',
        'Needs high humidity (90%+)'
      ]
    },
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Hericium_erinaceus',
    hardiness: 'H4',
    enhancedCompanions: [],
    enhancedAvoid: []
  },
  {
    id: 'king-oyster',
    storage: {
      methods: ['fridge', 'dry', 'freeze'],
      freshDays: 8,
      tip: 'Dense flesh keeps a week or more in a paper bag in the fridge; slice thick to dry, or saute then freeze.',
    },
    name: 'King Oyster',
    category: 'mushrooms',
    description: 'Large meaty mushroom with thick stem. Excellent texture for cooking.',
    planting: {
      sowIndoorsMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      sowOutdoorsMonths: [],
      transplantMonths: [],
      harvestMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      daysToHarvest: { min: 10, max: 21 }
    },
    care: {
      sun: 'shade',
      water: 'high',
      spacing: { between: 0, rows: 0 },
      depth: 0,
      difficulty: 'intermediate',
      tips: [
        'Thick meaty stem with small cap',
        'Excellent meat substitute texture',
        'Needs cooler temperatures (10-15°C)',
        'Grows indoors year-round'
      ]
    },
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Pleurotus_eryngii',
    hardiness: 'H4',
    enhancedCompanions: [],
    enhancedAvoid: []
  },
  {
    id: 'button-mushroom',
    storage: {
      methods: ['fridge', 'freeze', 'dry'],
      freshDays: 6,
      tip: 'Keep in a paper bag in the fridge and use within the week; saute then freeze the surplus, or dry slices for powder.',
    },
    name: 'Button Mushroom',
    category: 'mushrooms',
    description: 'Classic white mushroom. Grows on composted manure substrate.',
    planting: {
      sowIndoorsMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      sowOutdoorsMonths: [],
      transplantMonths: [],
      harvestMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      daysToHarvest: { min: 21, max: 35 }
    },
    care: {
      sun: 'shade',
      water: 'high',
      spacing: { between: 0, rows: 0 },
      depth: 0,
      difficulty: 'advanced',
      tips: [
        'Needs specific composted manure substrate',
        'Requires pasteurization of substrate',
        'Controlled temperature critical (15-18°C)',
        'Most challenging for home growers'
      ]
    },
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Agaricus_bisporus',
    hardiness: 'H4',
    enhancedCompanions: [],
    enhancedAvoid: []
  }
]
