/**
 * Alliums - Vegetable Database
 * Planting times adjusted for Scotland / Edinburgh climate
 */

import { Vegetable } from '@/types/garden-planner'

export const alliums: Vegetable[] = [
  {
    id: 'onion',
    name: 'Onion',
    category: 'alliums',
    description: 'Kitchen essential. Sets easier than seed in Scotland.',
    planting: {
      sowIndoorsMonths: [2, 3],
      sowOutdoorsMonths: [4],
      transplantMonths: [4, 5],
      harvestMonths: [8, 9],
      daysToHarvest: { min: 100, max: 175 }
    },
    care: {
      sun: 'full-sun',
      water: 'low',
      spacing: { between: 10, rows: 30 },
      depth: 2,
      difficulty: 'beginner',
      tips: [
        'Sets are more reliable than seed in Scotland',
        'Japanese sets can be autumn planted',
        'Cure well in any dry weather'
      ]
    },
    rhsUrl: 'https://www.rhs.org.uk/vegetables/onions/grow-your-own',
    botanicalName: 'Allium cepa',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Allium_cepa',
    enhancedCompanions: [
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true, source: 'Classic pairing - onion scent may deter carrot fly (mixed research)' },
      { plantId: 'beetroot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'lettuce', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'broad-beans', confidence: 'likely', mechanism: 'allelopathy', bidirectional: true },
      { plantId: 'peas', confidence: 'likely', mechanism: 'allelopathy', bidirectional: true },
      { plantId: 'runner-beans', confidence: 'likely', mechanism: 'allelopathy', bidirectional: true }
    ]
  },
  {
    id: 'garlic',
    name: 'Garlic',
    category: 'alliums',
    description: 'Plant in autumn for best bulbs. Needs cold period.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [10, 11, 2, 3],
      transplantMonths: [],
      harvestMonths: [7, 8],
      daysToHarvest: { min: 180, max: 270 }
    },
    care: {
      sun: 'full-sun',
      water: 'low',
      spacing: { between: 15, rows: 30 },
      depth: 5,
      difficulty: 'beginner',
      tips: [
        'Autumn planting essential for best bulbs',
        'Scottish winters provide needed cold',
        'Hardneck varieties most reliable'
      ]
    },
    rhsUrl: 'https://www.rhs.org.uk/vegetables/garlic/grow-your-own',
    botanicalName: 'Allium sativum',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Allium_sativum',
    enhancedCompanions: [
      { plantId: 'beetroot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'broad-beans', confidence: 'likely', mechanism: 'allelopathy', bidirectional: true },
      { plantId: 'peas', confidence: 'likely', mechanism: 'allelopathy', bidirectional: true }
    ]
  },
  {
    id: 'leek',
    name: 'Leek',
    category: 'alliums',
    description: 'Hardy winter vegetable. Excellent for Scottish gardens!',
    planting: {
      sowIndoorsMonths: [2, 3, 4],
      sowOutdoorsMonths: [4, 5],
      transplantMonths: [6, 7],
      harvestMonths: [10, 11, 12, 1, 2, 3, 4],
      daysToHarvest: { min: 120, max: 150 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 15, rows: 30 },
      depth: 15,
      difficulty: 'beginner',
      tips: [
        'Drop seedlings in deep holes for blanched stems',
        'Very hardy - harvest all winter',
        'Musselburgh variety bred for Scottish climate!'
      ]
    },
    rhsUrl: 'https://www.rhs.org.uk/vegetables/leeks/grow-your-own',
    botanicalName: 'Allium ampeloprasum',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Allium_ampeloprasum',
    enhancedCompanions: [
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true, source: 'Leek scent may deter carrot fly' },
      { plantId: 'celery', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'onion', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'broad-beans', confidence: 'likely', mechanism: 'allelopathy', bidirectional: true },
      { plantId: 'peas', confidence: 'likely', mechanism: 'allelopathy', bidirectional: true }
    ]
  },
  {
    id: 'spring-onion',
    name: 'Spring Onions',
    category: 'alliums',
    description: 'Quick-growing salad onion. Sow successionally.',
    planting: {
      sowIndoorsMonths: [3],
      sowOutdoorsMonths: [4, 5, 6, 7, 8],
      transplantMonths: [],
      harvestMonths: [6, 7, 8, 9, 10],
      daysToHarvest: { min: 60, max: 80 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 2, rows: 15 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Sow every 3 weeks for continuous harvest',
        'Can be grown in containers',
        'White Lisbon is reliable for Scotland'
      ]
    },
    enhancedCompanions: [
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'lettuce', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'peas', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    rhsUrl: 'https://www.rhs.org.uk/vegetables/spring-onions/grow-your-own',
    botanicalName: 'Allium fistulosum',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Allium_fistulosum'
  },
  {
    id: 'shallot',
    name: 'Shallot',
    category: 'alliums',
    description: 'Milder than onions, easier to grow from sets. Good for Scottish climate.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [2, 3, 4, 10, 11],
      transplantMonths: [],
      harvestMonths: [7, 8],
      daysToHarvest: { min: 90, max: 120 }
    },
    care: {
      sun: 'full-sun',
      water: 'low',
      spacing: { between: 15, rows: 30 },
      depth: 2,
      difficulty: 'beginner',
      tips: [
        'Plant sets just below soil surface',
        'Autumn planting gives larger bulbs',
        'Each set produces cluster of 6-12 bulbs',
        'Store well over winter'
      ]
    },
    enhancedCompanions: [
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'beetroot', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'strawberry', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'peas', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    rhsUrl: 'https://www.rhs.org.uk/vegetables/shallots/grow-your-own',
    botanicalName: 'Allium cepa var. aggregatum',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Shallot'
  },
  {
    id: 'welsh-onion',
    name: 'Welsh Onion',
    category: 'alliums',
    description: 'Perennial bunching onion. Harvest year-round in Scotland.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [4, 5, 6, 7, 8],
      transplantMonths: [5, 6],
      harvestMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      daysToHarvest: { min: 60, max: 365 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 15, rows: 30 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Perennial - lasts many years',
        'Harvest green tops year-round',
        'Very hardy - survives Scottish winters',
        'Also called Japanese bunching onion'
      ]
    },
    enhancedCompanions: [
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'lettuce', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'peas', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Allium_fistulosum'
  },
  {
    id: 'elephant-garlic',
    name: 'Elephant Garlic',
    category: 'alliums',
    description: 'Giant mild garlic. Actually closer to leek than true garlic.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [],
      transplantMonths: [10, 11],
      harvestMonths: [6, 7],
      daysToHarvest: { min: 240, max: 270 }
    },
    care: {
      sun: 'full-sun',
      water: 'low',
      spacing: { between: 15, rows: 30 },
      depth: 8,
      difficulty: 'beginner',
      tips: [
        'Plant cloves in autumn',
        'Much larger and milder than regular garlic',
        'Can be 10cm diameter',
        'Very hardy for Scottish winters'
      ]
    },
    enhancedCompanions: [],
    enhancedAvoid: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'peas', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Elephant_garlic'
  },
  {
    id: 'walking-onion',
    name: 'Walking Onion (Tree Onion)',
    category: 'alliums',
    description: 'Perennial onion with top-setting bulbils. Quirky and productive.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [],
      transplantMonths: [3, 4, 9, 10],
      harvestMonths: [5, 6, 7, 8, 9],
      daysToHarvest: { min: 365, max: 730 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 20, rows: 30 },
      depth: 5,
      difficulty: 'beginner',
      tips: [
        'Produces bulbs at top of stalks',
        'Stalks bend and "walk" planting new bulbs',
        'Perennial - very low maintenance',
        'Harvest bulbils or green tops'
      ]
    },
    enhancedCompanions: [
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'lettuce', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'peas', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Allium_%C3%97_proliferum'
  },
  {
    id: 'potato-onion',
    name: 'Potato Onion',
    category: 'alliums',
    description: 'Multiplier onion forming clusters. Heritage variety very hardy.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [],
      transplantMonths: [2, 3, 10],
      harvestMonths: [7, 8],
      daysToHarvest: { min: 120, max: 150 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 15, rows: 30 },
      depth: 5,
      difficulty: 'beginner',
      tips: [
        'Plant one bulb, harvest 5-10',
        'Very hardy heritage variety',
        'Good storage onion',
        'Ideal for Scottish allotments'
      ]
    },
    enhancedCompanions: [
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'lettuce', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'peas', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Potato_onion'
  },
  {
    id: 'garlic-chives',
    name: 'Garlic Chives',
    category: 'alliums',
    description: 'Flat-leaved chives with garlic flavor. Perennial herb.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [4, 5],
      transplantMonths: [5, 6],
      harvestMonths: [5, 6, 7, 8, 9, 10],
      daysToHarvest: { min: 365, max: 730 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 25, rows: 30 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Perennial - lasts many years',
        'White flowers edible and ornamental',
        'Stronger flavor than regular chives',
        'Cut and come again harvesting'
      ]
    },
    enhancedCompanions: [
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'peas', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Allium_tuberosum'
  },
  {
    id: 'ramps',
    name: 'Ramps (Wild Leeks)',
    category: 'alliums',
    description: 'Woodland perennial leek. Spring ephemeral with garlicky flavor.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [9, 10],
      transplantMonths: [9, 10],
      harvestMonths: [4, 5],
      daysToHarvest: { min: 730, max: 1095 }
    },
    care: {
      sun: 'partial-shade',
      water: 'moderate',
      spacing: { between: 10, rows: 15 },
      depth: 2,
      difficulty: 'intermediate',
      tips: [
        'Needs woodland conditions - shade and leaf mold',
        'Slow to establish - 2-3 years',
        'Harvest sustainably - leaves only',
        'Spring delicacy with intense flavor'
      ]
    },
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Allium_tricoccum',
    enhancedCompanions: [],
    enhancedAvoid: []
  }
]
