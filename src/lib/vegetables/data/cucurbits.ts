/**
 * Cucurbits - Vegetable Database
 * Planting times adjusted for Scotland / Edinburgh climate
 */

import { Vegetable } from '@/types/garden-planner'

export const cucurbits: Vegetable[] = [
  {
    id: 'courgette',
    name: 'Courgettes (Zucchini)',
    category: 'cucurbits',
    description: 'Prolific summer squash. Start indoors and plant out after frost.',
    planting: {
      sowIndoorsMonths: [4, 5],
      sowOutdoorsMonths: [],
      transplantMonths: [6],
      harvestMonths: [7, 8, 9, 10],
      daysToHarvest: { min: 45, max: 60 }
    },
    care: {
      sun: 'full-sun',
      water: 'high',
      spacing: { between: 90, rows: 90 },
      depth: 2,
      difficulty: 'beginner',
      tips: [
        'Frost tender - harden off well',
        'Pick when 10-15cm long',
        'One or two plants is enough!'
      ]
    },
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'nasturtium', confidence: 'traditional', mechanism: 'pest_trap', bidirectional: true },
      { plantId: 'radish', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'potato', confidence: 'likely', mechanism: 'disease_suppression', bidirectional: false }
    ],
    rhsUrl: 'https://www.rhs.org.uk/vegetables/courgettes/grow-your-own',
    botanicalName: 'Cucurbita pepo',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Zucchini'
  },
  {
    id: 'squash',
    name: 'Winter Squash',
    category: 'cucurbits',
    description: 'Includes butternut, crown prince. Start indoors for Scotland.',
    planting: {
      sowIndoorsMonths: [4, 5],
      sowOutdoorsMonths: [],
      transplantMonths: [6],
      harvestMonths: [9, 10],
      daysToHarvest: { min: 85, max: 110 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 90, rows: 120 },
      depth: 2,
      difficulty: 'beginner',
      tips: [
        'Choose shorter-season varieties (Crown Prince)',
        'Harden off well before planting out',
        'Cure in any late sunshine before storing'
      ]
    },
    enhancedCompanions: [
      { plantId: 'sweetcorn', confidence: 'proven', mechanism: 'physical_support', bidirectional: true, source: 'Three Sisters' },
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'nasturtium', confidence: 'traditional', mechanism: 'pest_trap', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'potato', confidence: 'likely', mechanism: 'disease_suppression', bidirectional: true }
    ],
    rhsUrl: 'https://www.rhs.org.uk/vegetables/squash/grow-your-own',
    botanicalName: 'Cucurbita maxima',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Cucurbita'
  },
  {
    id: 'pumpkin',
    name: 'Pumpkin',
    category: 'cucurbits',
    description: 'Traditional autumn favourite. Need warm start indoors.',
    planting: {
      sowIndoorsMonths: [4, 5],
      sowOutdoorsMonths: [],
      transplantMonths: [6],
      harvestMonths: [9, 10],
      daysToHarvest: { min: 90, max: 120 }
    },
    care: {
      sun: 'full-sun',
      water: 'high',
      spacing: { between: 120, rows: 180 },
      depth: 2,
      difficulty: 'beginner',
      tips: [
        'Choose smaller varieties for reliability',
        'Need sheltered sunny spot',
        'Cut with stem attached for storage'
      ]
    },
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'nasturtium', confidence: 'traditional', mechanism: 'pest_trap', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'potato', confidence: 'likely', mechanism: 'disease_suppression', bidirectional: false }
    ],
    rhsUrl: 'https://www.rhs.org.uk/vegetables/pumpkins/grow-your-own',
    botanicalName: 'Cucurbita pepo',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Pumpkin'
  },
  {
    id: 'patty-pan-squash',
    name: 'Patty Pan Squash',
    category: 'cucurbits',
    description: 'UFO-shaped summer squash. Compact plants ideal for small Scottish allotments.',
    planting: {
      sowIndoorsMonths: [4, 5],
      sowOutdoorsMonths: [5, 6],
      transplantMonths: [6],
      harvestMonths: [7, 8, 9, 10],
      daysToHarvest: { min: 50, max: 60 }
    },
    care: {
      sun: 'full-sun',
      water: 'high',
      spacing: { between: 90, rows: 120 },
      depth: 2,
      difficulty: 'beginner',
      tips: [
        'Harvest when 5-8cm diameter for best flavor',
        'More compact than courgettes',
        'Beautiful scalloped edges',
        'Yellow, green, or white varieties'
      ]
    },
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'nasturtium', confidence: 'traditional', mechanism: 'pest_trap', bidirectional: true },
      { plantId: 'sweetcorn', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'potato', confidence: 'likely', mechanism: 'disease_suppression', bidirectional: false }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Pattypan_squash'
  },
  {
    id: 'butternut-squash',
    name: 'Butternut Squash',
    category: 'cucurbits',
    description: 'Popular winter squash. Needs long warm season but possible in Scotland.',
    planting: {
      sowIndoorsMonths: [4],
      sowOutdoorsMonths: [],
      transplantMonths: [5, 6],
      harvestMonths: [9, 10],
      daysToHarvest: { min: 95, max: 110 }
    },
    care: {
      sun: 'full-sun',
      water: 'high',
      spacing: { between: 120, rows: 180 },
      depth: 2,
      difficulty: 'intermediate',
      tips: [
        'Choose early varieties for Scotland',
        'Start indoors for best results',
        'Harvest before first frost',
        'Cure for 2 weeks before storage'
      ]
    },
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'nasturtium', confidence: 'traditional', mechanism: 'pest_trap', bidirectional: true },
      { plantId: 'sweetcorn', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'potato', confidence: 'likely', mechanism: 'disease_suppression', bidirectional: false }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Butternut_squash'
  },
  {
    id: 'spaghetti-squash',
    name: 'Spaghetti Squash',
    category: 'cucurbits',
    description: 'Winter squash with stringy flesh. Unique texture when cooked.',
    planting: {
      sowIndoorsMonths: [4],
      sowOutdoorsMonths: [],
      transplantMonths: [5, 6],
      harvestMonths: [9, 10],
      daysToHarvest: { min: 90, max: 100 }
    },
    care: {
      sun: 'full-sun',
      water: 'high',
      spacing: { between: 120, rows: 180 },
      depth: 2,
      difficulty: 'intermediate',
      tips: [
        'Flesh separates into spaghetti-like strands',
        'Good low-carb pasta substitute',
        'Needs warm sheltered spot in Scotland',
        'Harvest when rind hard to fingernail'
      ]
    },
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'nasturtium', confidence: 'traditional', mechanism: 'pest_trap', bidirectional: true },
      { plantId: 'sweetcorn', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'potato', confidence: 'likely', mechanism: 'disease_suppression', bidirectional: false }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Spaghetti_squash'
  },
  {
    id: 'acorn-squash',
    name: 'Acorn Squash',
    category: 'cucurbits',
    description: 'Compact winter squash with ridged shape. More reliable than butternut in Scotland.',
    planting: {
      sowIndoorsMonths: [4],
      sowOutdoorsMonths: [],
      transplantMonths: [5, 6],
      harvestMonths: [9, 10],
      daysToHarvest: { min: 80, max: 100 }
    },
    care: {
      sun: 'full-sun',
      water: 'high',
      spacing: { between: 90, rows: 120 },
      depth: 2,
      difficulty: 'beginner',
      tips: [
        'Earlier maturing than butternut',
        'Smaller plants fit Scottish allotments',
        'Sweet nutty flavor',
        'Good for stuffing and roasting'
      ]
    },
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'nasturtium', confidence: 'traditional', mechanism: 'pest_trap', bidirectional: true },
      { plantId: 'sweetcorn', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'potato', confidence: 'likely', mechanism: 'disease_suppression', bidirectional: false }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Acorn_squash'
  }
]
