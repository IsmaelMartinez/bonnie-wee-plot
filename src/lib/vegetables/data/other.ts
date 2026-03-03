/**
 * Other (Specialty Vegetables) - Vegetable Database
 * Planting times adjusted for Scotland / Edinburgh climate
 */

import { Vegetable } from '@/types/garden-planner'

export const other: Vegetable[] = [
  {
    id: 'rhubarb',
    name: 'Rhubarb',
    category: 'other',
    description: 'Perennial vegetable (used as fruit). Thrives in Scottish climate!',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [3, 4, 10, 11],
      transplantMonths: [3, 4, 10, 11],
      harvestMonths: [4, 5, 6, 7],
      daysToHarvest: { min: 365, max: 730 }
    },
    care: {
      sun: 'partial-shade',
      water: 'moderate',
      spacing: { between: 90, rows: 90 },
      depth: 5,
      difficulty: 'beginner',
      tips: [
        'Perfect for Scottish climate',
        'Dont harvest first year',
        'Force for earlier, sweeter stems'
      ]
    },
    enhancedCompanions: [
      { plantId: 'garlic', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'onion', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true }
    ],
    rhsUrl: 'https://www.rhs.org.uk/vegetables/rhubarb/grow-your-own',
    botanicalName: 'Rheum rhabarbarum',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Rhubarb',
    maintenance: {
      feedMonths: [3],
      mulchMonths: [11],
      notes: ['Force under pot from January for early crop', 'Remove flower stalks immediately']
    },
    perennialInfo: {
      yearsToFirstHarvest: { min: 1, max: 2 },
      productiveYears: { min: 10, max: 15 }
    },
    enhancedAvoid: []
  },
  {
    id: 'jerusalem-artichoke',
    name: 'Jerusalem Artichoke',
    category: 'other',
    description: 'Perennial tuber with nutty flavor. Extremely productive and hardy in Scotland.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [2, 3, 4],
      transplantMonths: [],
      harvestMonths: [10, 11, 12, 1, 2, 3],
      daysToHarvest: { min: 110, max: 150 }
    },
    care: {
      sun: 'full-sun',
      water: 'low',
      spacing: { between: 30, rows: 90 },
      depth: 15,
      difficulty: 'beginner',
      tips: [
        'Plant tubers like potatoes',
        'Can become invasive - harvest thoroughly',
        'Tall plants (up to 3m) make good windbreak',
        'Sweeter after frost'
      ]
    },
    enhancedCompanions: [
      { plantId: 'sweetcorn', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'sunflower', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'potato', confidence: 'traditional', mechanism: 'nutrient_competition', bidirectional: false }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Jerusalem_artichoke'
  },
  {
    id: 'sweetcorn',
    name: 'Sweetcorn',
    category: 'other',
    description: 'Sweet summer treat. Choose early varieties like Swift F1 for Scottish climate.',
    planting: {
      sowIndoorsMonths: [4, 5],
      sowOutdoorsMonths: [],
      transplantMonths: [6],
      harvestMonths: [8, 9],
      daysToHarvest: { min: 70, max: 100 }
    },
    care: {
      sun: 'full-sun',
      water: 'high',
      spacing: { between: 35, rows: 60 },
      depth: 3,
      difficulty: 'intermediate',
      tips: [
        'MUST start indoors in Scotland',
        'Plant in blocks (not rows) for pollination',
        'Swift F1 or Earlybird are best for short seasons',
        'Need sheltered, sunny spot'
      ]
    },
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'runner-beans', confidence: 'proven', mechanism: 'physical_support', bidirectional: true, source: 'Three Sisters - beans climb corn stalks' }
    ],
    enhancedAvoid: [],
    rhsUrl: 'https://www.rhs.org.uk/vegetables/sweetcorn/grow-your-own',
    botanicalName: 'Zea mays',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Maize'
  },
  {
    id: 'asparagus',
    name: 'Asparagus',
    category: 'other',
    description: 'Perennial vegetable producing tender spears in spring. Takes 2-3 years to establish.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [],
      transplantMonths: [3, 4],
      harvestMonths: [4, 5, 6],
      daysToHarvest: { min: 730, max: 1095 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 45, rows: 90 },
      depth: 15,
      difficulty: 'intermediate',
      tips: [
        'Plant crowns not seeds for quicker harvest',
        'Don\'t harvest first 2 years - let establish',
        'Harvest for 6-8 weeks only each year',
        'Can produce for 20+ years'
      ]
    },
    enhancedCompanions: [
      { plantId: 'parsley', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'onion', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'garlic', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    rhsUrl: 'https://www.rhs.org.uk/vegetables/asparagus/grow-your-own',
    botanicalName: 'Asparagus officinalis',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Asparagus_officinalis',
    maintenance: {
      feedMonths: [3],
      mulchMonths: [11],
      notes: ['Cut down ferns in autumn', 'Weed regularly']
    },
    perennialInfo: {
      yearsToFirstHarvest: { min: 2, max: 3 },
      productiveYears: { min: 15, max: 20 }
    }
  },
  {
    id: 'globe-artichoke',
    name: 'Globe Artichoke',
    category: 'other',
    description: 'Architectural perennial vegetable. Edible flower buds with silvery foliage.',
    planting: {
      sowIndoorsMonths: [2, 3],
      sowOutdoorsMonths: [],
      transplantMonths: [4, 5],
      harvestMonths: [7, 8, 9],
      daysToHarvest: { min: 120, max: 180 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 90, rows: 90 },
      depth: 2,
      difficulty: 'intermediate',
      tips: [
        'Dramatic architectural plant',
        'Harvest buds before they open',
        'Protect crowns in winter in Scotland',
        'Can grow 1.5m tall and wide'
      ]
    },
    enhancedCompanions: [
      { plantId: 'sunflower', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'french-tarragon', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    maintenance: {
      feedMonths: [3, 5],
      mulchMonths: [11],
      notes: ['Protect crowns with straw in winter']
    },
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Globe_artichoke',
    enhancedAvoid: []
  },
  {
    id: 'celery',
    name: 'Celery',
    category: 'other',
    description: 'Crunchy stalks for salads and cooking. Needs consistent moisture.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [],
      transplantMonths: [5, 6],
      harvestMonths: [8, 9, 10],
      daysToHarvest: { min: 120, max: 140 }
    },
    care: {
      sun: 'full-sun',
      water: 'high',
      spacing: { between: 30, rows: 30 },
      depth: 0.5,
      difficulty: 'intermediate',
      tips: [
        'Needs constant moisture - never let dry',
        'Self-blanching varieties easier',
        'Harden off gradually before planting',
        'Can bolt if stressed'
      ]
    },
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'parsnip', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    rhsUrl: 'https://www.rhs.org.uk/vegetables/celery/grow-your-own',
    botanicalName: 'Apium graveolens',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Celery'
  },
  {
    id: 'cardoon',
    name: 'Cardoon',
    category: 'other',
    description: 'Relative of globe artichoke with edible stems. Dramatic architectural plant.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [],
      transplantMonths: [5, 6],
      harvestMonths: [10, 11],
      daysToHarvest: { min: 180, max: 210 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 90, rows: 90 },
      depth: 2,
      difficulty: 'advanced',
      tips: [
        'Blanch stems 3-4 weeks before harvest',
        'Very tall (2m+) architectural plant',
        'Purple thistle flowers if unharvested',
        'Remove outer leaves before blanching'
      ]
    },
    enhancedCompanions: [
      { plantId: 'globe-artichoke', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'sunflower', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Cardoon',
    enhancedAvoid: []
  },
  {
    id: 'mashua',
    name: 'Mashua',
    category: 'other',
    description: 'Andean climbing tuber with peppery edible tubers and flowers.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [],
      transplantMonths: [4, 5],
      harvestMonths: [11, 12],
      daysToHarvest: { min: 180, max: 210 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 45, rows: 60 },
      depth: 5,
      difficulty: 'intermediate',
      tips: [
        'Climbing habit - provide support',
        'Edible nasturtium-like flowers',
        'Peppery tubers like radish',
        'Very easy to grow'
      ]
    },
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Tropaeolum_tuberosum',
    enhancedAvoid: []
  }
]
