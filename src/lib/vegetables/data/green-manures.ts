/**
 * Green Manures - Vegetable Database
 * Planting times adjusted for Scotland / Edinburgh climate
 */

import { Vegetable } from '@/types/garden-planner'

export const greenManures: Vegetable[] = [
  {
    id: 'crimson-clover',
    name: 'Crimson Clover',
    category: 'green-manures',
    description: 'Nitrogen-fixing spring green manure with beautiful crimson flowers. Improves soil structure.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [3, 4, 5, 8, 9],
      transplantMonths: [],
      harvestMonths: [],
      daysToHarvest: { min: 90, max: 120 }
    },
    care: {
      sun: 'full-sun',
      water: 'low',
      spacing: { between: 0, rows: 0 },
      depth: 2,
      difficulty: 'beginner',
      tips: [
        'Broadcast seed and rake in',
        'Fixes nitrogen - excellent before brassicas',
        'Cut before flowering and dig in',
        'Attracts bees if allowed to flower'
      ]
    },
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Trifolium_incarnatum',
    enhancedCompanions: [],
    enhancedAvoid: []
  },
  {
    id: 'white-clover',
    name: 'White Clover',
    category: 'green-manures',
    description: 'Perennial low-growing clover. Perfect as living mulch or lawn alternative.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [3, 4, 5, 8, 9],
      transplantMonths: [],
      harvestMonths: [],
      daysToHarvest: { min: 60, max: 90 }
    },
    care: {
      sun: 'full-sun',
      water: 'low',
      spacing: { between: 0, rows: 0 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Can be mown as lawn alternative',
        'Fixes nitrogen continuously',
        'Use as living mulch under fruit trees',
        'Attracts bees and beneficial insects'
      ]
    },
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Trifolium_repens',
    enhancedCompanions: [],
    enhancedAvoid: []
  },
  {
    id: 'winter-field-beans',
    name: 'Winter Field Beans',
    category: 'green-manures',
    description: 'Hardy autumn-sown green manure. Deep roots break up compacted soil.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [10, 11],
      transplantMonths: [],
      harvestMonths: [],
      daysToHarvest: { min: 180, max: 210 }
    },
    care: {
      sun: 'full-sun',
      water: 'low',
      spacing: { between: 0, rows: 0 },
      depth: 5,
      difficulty: 'beginner',
      tips: [
        'Very hardy - overwinters well in Scotland',
        'Deep roots improve drainage',
        'Fixes large amounts of nitrogen',
        'Dig in before flowering in spring'
      ]
    },
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Vicia_faba',
    enhancedCompanions: [],
    enhancedAvoid: []
  },
  {
    id: 'winter-rye',
    name: 'Winter Rye (Grazing Rye)',
    category: 'green-manures',
    description: 'Fast-growing winter cover crop. Suppresses weeds and prevents nutrient leaching.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [8, 9, 10],
      transplantMonths: [],
      harvestMonths: [],
      daysToHarvest: { min: 120, max: 180 }
    },
    care: {
      sun: 'full-sun',
      water: 'low',
      spacing: { between: 0, rows: 0 },
      depth: 2,
      difficulty: 'beginner',
      tips: [
        'Excellent weed suppressor',
        'Dense root system improves structure',
        'Cut down before flowering',
        'Can be difficult to dig in - chop finely first'
      ]
    },
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Rye',
    enhancedCompanions: [],
    enhancedAvoid: []
  },
  {
    id: 'buckwheat',
    name: 'Buckwheat',
    category: 'green-manures',
    description: 'Fast summer green manure. Flowers attract beneficial insects and suppress weeds.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [5, 6, 7],
      transplantMonths: [],
      harvestMonths: [],
      daysToHarvest: { min: 40, max: 60 }
    },
    care: {
      sun: 'full-sun',
      water: 'low',
      spacing: { between: 0, rows: 0 },
      depth: 2,
      difficulty: 'beginner',
      tips: [
        'Very fast growing - good for short gaps',
        'Excellent bee plant',
        'Suppresses weeds effectively',
        'Not frost hardy - summer use only'
      ]
    },
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Buckwheat',
    enhancedCompanions: [],
    enhancedAvoid: []
  },
  {
    id: 'white-mustard',
    name: 'White Mustard',
    category: 'green-manures',
    description: 'Fast-growing green manure with biofumigant properties. Suppresses soil pests and diseases.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [3, 4, 5, 6, 7, 8],
      transplantMonths: [],
      harvestMonths: [],
      daysToHarvest: { min: 30, max: 45 }
    },
    care: {
      sun: 'full-sun',
      water: 'low',
      spacing: { between: 0, rows: 0 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Fastest green manure - ready in 4-6 weeks',
        'Natural biofumigant suppresses soil pests',
        'Dig in before flowering',
        'Excellent for short gaps between crops'
      ]
    },
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Mustard_plant',
    enhancedCompanions: [],
    enhancedAvoid: []
  }
]
