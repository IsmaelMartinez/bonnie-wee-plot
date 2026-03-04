/**
 * Annual Flowers - Vegetable Database
 * Planting times adjusted for Scotland / Edinburgh climate
 */

import { Vegetable } from '@/types/garden-planner'

export const annualFlowers: Vegetable[] = [
  {
    id: 'cosmos',
    name: 'Cosmos',
    category: 'annual-flowers',
    description: 'Easy-growing annual flower with feathery foliage and daisy-like blooms. Attracts pollinators and beneficial insects.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [5],
      transplantMonths: [5, 6],
      harvestMonths: [7, 8, 9, 10],
      daysToHarvest: { min: 70, max: 90 }
    },
    care: {
      sun: 'full-sun',
      water: 'low',
      spacing: { between: 30, rows: 30 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Deadhead regularly for continuous blooms',
        'Tolerates poor soil - avoid over-fertilizing',
        'Self-seeds readily for next year',
        'Excellent cut flower with long vase life'
      ]
    },
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Cosmos_(plant)',
    enhancedAvoid: []
  },
  {
    id: 'sunflower',
    name: 'Sunflower',
    category: 'annual-flowers',
    description: 'Tall annual with large yellow flower heads. Provides food for birds and beneficial insects.',
    planting: {
      sowIndoorsMonths: [4],
      sowOutdoorsMonths: [5, 6],
      transplantMonths: [5, 6],
      harvestMonths: [8, 9, 10],
      daysToHarvest: { min: 80, max: 120 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 45, rows: 60 },
      depth: 2,
      difficulty: 'beginner',
      tips: [
        'Stake tall varieties in exposed Scottish sites',
        'Attracts bees and provides food for birds',
        'Harvest seeds when back of flower turns brown',
        'Can be used as living supports for climbing beans'
      ]
    },
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'potato', confidence: 'traditional', mechanism: 'nutrient_competition', bidirectional: false }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Helianthus_annuus'
  },
  {
    id: 'zinnia',
    name: 'Zinnia',
    category: 'annual-flowers',
    description: 'Vibrant annual flower with long-lasting blooms. Excellent pollinator attractor and cut flower.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [5],
      transplantMonths: [5, 6],
      harvestMonths: [7, 8, 9, 10],
      daysToHarvest: { min: 60, max: 90 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 30, rows: 30 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Deadhead regularly to promote blooming',
        'Water at base to prevent mildew',
        'Choose mildew-resistant varieties for Scotland',
        'Excellent cut flower - harvest when fully open'
      ]
    },
    enhancedCompanions: [
      { plantId: 'pumpkin', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Zinnia',
    enhancedAvoid: []
  },
  {
    id: 'marigold',
    name: 'Marigold',
    category: 'annual-flowers',
    description: 'Hardy annual with bright orange or yellow flowers. Repels pests and attracts beneficial insects.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [5],
      transplantMonths: [5, 6],
      harvestMonths: [6, 7, 8, 9, 10],
      daysToHarvest: { min: 50, max: 70 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 25, rows: 25 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'French marigolds deter aphids and whitefly',
        'Plant throughout vegetable beds for pest control',
        'Deadhead to prolong flowering season',
        'Self-seeds readily - save seeds for next year'
      ]
    },
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Tagetes',
    enhancedAvoid: []
  },
  {
    id: 'calendula',
    name: 'Calendula',
    category: 'annual-flowers',
    description: 'Pot marigold with edible flowers. Attracts beneficial insects and has medicinal properties.',
    planting: {
      sowIndoorsMonths: [3],
      sowOutdoorsMonths: [4, 5, 9],
      transplantMonths: [4, 5],
      harvestMonths: [6, 7, 8, 9, 10, 11],
      daysToHarvest: { min: 50, max: 65 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 25, rows: 30 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Edible flowers - use petals in salads',
        'Very cold-hardy - can flower into winter in Scotland',
        'Attracts hoverflies that eat aphids',
        'Self-seeds prolifically - allow some to set seed'
      ]
    },
    enhancedCompanions: [
      { plantId: 'asparagus', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'lettuce', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Calendula_officinalis',
    enhancedAvoid: []
  },
  {
    id: 'nasturtium',
    name: 'Nasturtium',
    category: 'annual-flowers',
    description: 'Fast-growing annual with edible flowers and leaves. Attracts aphids away from crops.',
    planting: {
      sowIndoorsMonths: [4],
      sowOutdoorsMonths: [5, 6],
      transplantMonths: [5, 6],
      harvestMonths: [6, 7, 8, 9, 10],
      daysToHarvest: { min: 50, max: 65 }
    },
    care: {
      sun: 'full-sun',
      water: 'low',
      spacing: { between: 30, rows: 30 },
      depth: 2,
      difficulty: 'beginner',
      tips: [
        'Entire plant is edible - peppery flavor',
        'Acts as sacrificial crop for aphids',
        'Trailing varieties can cover bare soil',
        'Thrives in poor soil - avoid over-feeding'
      ]
    },
    enhancedCompanions: [
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'pumpkin', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'radish', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Tropaeolum',
    enhancedAvoid: []
  },
  {
    id: 'cornflower',
    name: 'Cornflower',
    category: 'annual-flowers',
    description: 'Native British wildflower with blue flowers. Excellent for pollinators and cut flowers.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [3, 4, 9],
      transplantMonths: [],
      harvestMonths: [6, 7, 8, 9],
      daysToHarvest: { min: 70, max: 90 }
    },
    care: {
      sun: 'full-sun',
      water: 'low',
      spacing: { between: 20, rows: 30 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Very hardy - can sow in autumn for early flowers',
        'Native British wildflower - supports local wildlife',
        'Excellent cut flower with long vase life',
        'Self-seeds readily - allow some to set seed'
      ]
    },
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Centaurea_cyanus',
    enhancedCompanions: [],
    enhancedAvoid: []
  },
  {
    id: 'sweet-alyssum',
    name: 'Sweet Alyssum',
    category: 'annual-flowers',
    description: 'Low-growing carpet of tiny fragrant flowers. Attracts beneficial insects.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [5],
      transplantMonths: [5, 6],
      harvestMonths: [6, 7, 8, 9, 10],
      daysToHarvest: { min: 50, max: 70 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 15, rows: 20 },
      depth: 0.5,
      difficulty: 'beginner',
      tips: [
        'Perfect ground cover under vegetables',
        'Attracts hoverflies and lacewings',
        'Self-seeds readily',
        'Honey-scented flowers'
      ]
    },
    enhancedCompanions: [
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'lettuce', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Lobularia_maritima',
    enhancedAvoid: []
  },
  {
    id: 'phacelia',
    name: 'Phacelia',
    category: 'annual-flowers',
    description: 'Blue-flowered green manure and bee plant. Fast-growing and easy.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [3, 4, 5, 6, 7, 8],
      transplantMonths: [],
      harvestMonths: [5, 6, 7, 8, 9],
      daysToHarvest: { min: 45, max: 60 }
    },
    care: {
      sun: 'full-sun',
      water: 'low',
      spacing: { between: 20, rows: 30 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'One of the best bee plants',
        'Use as green manure',
        'Fast growing - good for gaps',
        'Attracts beneficial predatory insects'
      ]
    },
    enhancedCompanions: [
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Phacelia',
    enhancedAvoid: []
  },
  {
    id: 'cleome',
    name: 'Cleome (Spider Flower)',
    category: 'annual-flowers',
    description: 'Tall architectural annual with unusual spider-like flowers. Self-seeds readily.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [],
      transplantMonths: [5, 6],
      harvestMonths: [7, 8, 9, 10],
      daysToHarvest: { min: 80, max: 100 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 30, rows: 40 },
      depth: 0.5,
      difficulty: 'beginner',
      tips: [
        'Tall (1.5m) - provides height in borders',
        'Self-seeds prolifically',
        'Attracts butterflies and bees',
        'Thorny stems - handle carefully'
      ]
    },
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Cleome',
    enhancedAvoid: []
  },
  {
    id: 'nigella',
    name: 'Love-in-a-Mist (Nigella)',
    category: 'annual-flowers',
    description: 'Delicate blue flowers in feathery foliage. Self-seeds and easy to grow.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [3, 4, 9],
      transplantMonths: [],
      harvestMonths: [6, 7, 8],
      daysToHarvest: { min: 60, max: 80 }
    },
    care: {
      sun: 'full-sun',
      water: 'low',
      spacing: { between: 20, rows: 30 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Direct sow - dislikes transplanting',
        'Self-seeds readily for next year',
        'Seed pods attractive in dried arrangements',
        'Very easy and low maintenance'
      ]
    },
    enhancedCompanions: [
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'onion', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'calendula', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Nigella_damascena',
    enhancedAvoid: []
  },
  {
    id: 'poppy',
    name: 'Field Poppy',
    category: 'annual-flowers',
    description: 'Classic red wildflower poppy. Attracts pollinators and self-seeds.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [3, 4, 9],
      transplantMonths: [],
      harvestMonths: [6, 7, 8],
      daysToHarvest: { min: 60, max: 80 }
    },
    care: {
      sun: 'full-sun',
      water: 'low',
      spacing: { between: 20, rows: 30 },
      depth: 0.5,
      difficulty: 'beginner',
      tips: [
        'Direct sow - hates being moved',
        'Self-seeds prolifically',
        'Short-lived but beautiful display',
        'Edible seeds for baking'
      ]
    },
    enhancedCompanions: [
      { plantId: 'cornflower', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'calendula', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Papaver_rhoeas',
    enhancedAvoid: []
  }
]
