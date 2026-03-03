/**
 * Climbers - Vegetable Database
 * Planting times adjusted for Scotland / Edinburgh climate
 */

import { Vegetable } from '@/types/garden-planner'

export const climbers: Vegetable[] = [
  {
    id: 'sweet-pea',
    name: 'Sweet Pea',
    category: 'climbers',
    description: 'Fragrant climbing annual with colorful flowers. Excellent cut flower and pollinator attractor.',
    planting: {
      sowIndoorsMonths: [2, 3, 10],
      sowOutdoorsMonths: [4],
      transplantMonths: [4, 5],
      harvestMonths: [6, 7, 8, 9],
      daysToHarvest: { min: 90, max: 120 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 15, rows: 30 },
      depth: 2,
      difficulty: 'intermediate',
      tips: [
        'Sow in autumn for earlier, stronger plants',
        'Pinch out growing tips when 10cm tall',
        'Pick flowers regularly to prolong blooming',
        'Provide tall supports (2m) for climbing varieties'
      ]
    },
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'peas', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Lathyrus_odoratus',
    enhancedAvoid: []
  },
  {
    id: 'clematis',
    name: 'Clematis',
    category: 'climbers',
    description: 'Versatile climbing perennial with large flowers. Wide range of varieties for different seasons.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [],
      transplantMonths: [3, 4, 5, 9, 10],
      harvestMonths: [5, 6, 7, 8, 9],
      daysToHarvest: { min: 365, max: 730 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 100, rows: 100 },
      depth: 10,
      difficulty: 'intermediate',
      tips: [
        'Plant with roots in shade, top in sun',
        'Mulch base to keep roots cool',
        'Choose hardy varieties for Scotland',
        'Prune according to variety group (1, 2, or 3)'
      ]
    },
    enhancedCompanions: [
      { plantId: 'honeysuckle', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Clematis',
    enhancedAvoid: []
  },
  {
    id: 'honeysuckle',
    name: 'Honeysuckle',
    category: 'climbers',
    description: 'Fragrant climbing perennial native to UK. Attracts moths and provides wildlife habitat.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [],
      transplantMonths: [3, 4, 5, 9, 10, 11],
      harvestMonths: [6, 7, 8, 9],
      daysToHarvest: { min: 365, max: 730 }
    },
    care: {
      sun: 'partial-shade',
      water: 'moderate',
      spacing: { between: 100, rows: 100 },
      depth: 10,
      difficulty: 'beginner',
      tips: [
        'Native climber - supports local wildlife',
        'Very hardy - tolerates Scottish climate well',
        'Fragrant evening flowers attract moths',
        'Can become vigorous - prune after flowering'
      ]
    },
    enhancedCompanions: [
      { plantId: 'clematis', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Honeysuckle',
    enhancedAvoid: []
  },
  {
    id: 'morning-glory',
    name: 'Morning Glory',
    category: 'climbers',
    description: 'Fast-growing annual climber with trumpet flowers. Opens in morning, closes by afternoon.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [5],
      transplantMonths: [5, 6],
      harvestMonths: [7, 8, 9, 10],
      daysToHarvest: { min: 70, max: 90 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 15, rows: 30 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Soak seeds overnight before sowing',
        'Fast-growing - can cover 3m in one season',
        'Self-seeds readily in mild areas',
        'Provide strong supports for vigorous growth'
      ]
    },
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Ipomoea',
    enhancedAvoid: []
  },
  {
    id: 'hops',
    name: 'Hops',
    category: 'climbers',
    description: 'Vigorous perennial vine for brewing and ornament. Edible young shoots.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [],
      transplantMonths: [3, 4],
      harvestMonths: [8, 9],
      daysToHarvest: { min: 120, max: 150 }
    },
    care: {
      sun: 'full-sun',
      water: 'high',
      spacing: { between: 100, rows: 100 },
      depth: 5,
      difficulty: 'intermediate',
      tips: [
        'Very vigorous - can grow 6m in one season',
        'Needs strong support structure',
        'Female plants produce hops for brewing',
        'Young shoots edible like asparagus'
      ]
    },
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Humulus_lupulus',
    enhancedAvoid: []
  },
  {
    id: 'hardy-kiwi',
    name: 'Hardy Kiwi',
    category: 'climbers',
    description: 'Arctic kiwi variety hardy for Scotland. Grape-sized smooth-skinned fruit.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [],
      transplantMonths: [11, 12, 1, 2, 3],
      harvestMonths: [9, 10],
      daysToHarvest: { min: 1095, max: 1825 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 300, rows: 400 },
      depth: 5,
      difficulty: 'intermediate',
      tips: [
        'Much hardier than fuzzy kiwis',
        'Need male and female plants',
        'Takes 3-5 years to fruit',
        'Very vigorous - needs strong support'
      ]
    },
    enhancedCompanions: [
      { plantId: 'comfrey', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'nasturtium', confidence: 'traditional', mechanism: 'pest_trap', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Actinidia_arguta',
    enhancedAvoid: []
  }
]
