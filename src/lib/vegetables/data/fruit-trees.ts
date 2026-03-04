/**
 * Fruit Trees - Vegetable Database
 * Planting times adjusted for Scotland / Edinburgh climate
 */

import { Vegetable } from '@/types/garden-planner'

export const fruitTrees: Vegetable[] = [
  {
    id: 'apple-tree',
    name: 'Apple Tree',
    category: 'fruit-trees',
    description: 'Classic fruit tree. Choose dwarf rootstocks for smaller spaces.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [11, 12, 1, 2, 3],
      transplantMonths: [11, 12, 1, 2, 3],
      harvestMonths: [8, 9, 10, 11],
      daysToHarvest: { min: 730, max: 1825 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 300, rows: 400 },
      depth: 0,
      difficulty: 'intermediate',
      tips: [
        'M26 or M27 rootstock for small gardens',
        'Most need a pollination partner',
        'Prune in winter when dormant',
        'Scottish varieties like Discovery do well'
      ]
    },
    enhancedCompanions: [
      { plantId: 'chives', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'nasturtium', confidence: 'traditional', mechanism: 'pest_trap', bidirectional: true },
      { plantId: 'garlic', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'potato', confidence: 'traditional', mechanism: 'disease_suppression', bidirectional: false }
    ],
    maintenance: {
      pruneMonths: [12, 1, 2],
      feedMonths: [3],
      mulchMonths: [11],
      notes: ['Winter prune when dormant', 'Summer prune water shoots in July-Aug']
    },
    perennialInfo: {
      yearsToFirstHarvest: { min: 3, max: 5 },
      productiveYears: { min: 30, max: 50 }
    },
    rhsUrl: 'https://www.rhs.org.uk/fruit/apples/grow-your-own',
    botanicalName: 'Malus domestica',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Malus_domestica'
  },
  {
    id: 'cherry-tree',
    name: 'Cherry Tree',
    category: 'fruit-trees',
    description: 'Beautiful blossom and delicious fruit. Sweet and sour varieties available.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [11, 12, 1, 2, 3],
      transplantMonths: [11, 12, 1, 2, 3],
      harvestMonths: [7, 8],
      daysToHarvest: { min: 730, max: 1825 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 400, rows: 500 },
      depth: 0,
      difficulty: 'intermediate',
      tips: [
        'Choose self-fertile varieties like Stella',
        'Gisela rootstocks keep trees smaller',
        'Net against birds - they love cherries!',
        'Prune only in summer to avoid disease'
      ]
    },
    enhancedCompanions: [
      { plantId: 'garlic', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'chives', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'marigold', confidence: 'traditional', mechanism: 'pest_trap', bidirectional: true }
    ],
    maintenance: {
      pruneMonths: [7, 8],
      feedMonths: [3],
      notes: ['ONLY prune in summer to avoid silver leaf and bacterial canker']
    },
    perennialInfo: {
      yearsToFirstHarvest: { min: 3, max: 5 },
      productiveYears: { min: 20, max: 30 }
    },
    rhsUrl: 'https://www.rhs.org.uk/fruit/cherries/grow-your-own',
    botanicalName: 'Prunus avium',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Prunus_avium',
    enhancedAvoid: []
  },
  {
    id: 'damson-tree',
    name: 'Damson Tree',
    category: 'fruit-trees',
    description: 'Hardy plum relative. Self-fertile and excellent for Scottish gardens.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [11, 12, 1, 2, 3],
      transplantMonths: [11, 12, 1, 2, 3],
      harvestMonths: [9, 10],
      daysToHarvest: { min: 730, max: 1825 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 350, rows: 400 },
      depth: 0,
      difficulty: 'beginner',
      tips: [
        'Self-fertile - no pollination partner needed',
        'Very hardy - ideal for Scottish climate',
        'Perfect for jam and gin',
        'Minimal pruning required'
      ]
    },
    enhancedCompanions: [
      { plantId: 'garlic', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'chives', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'comfrey', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    maintenance: {
      pruneMonths: [2, 3],
      feedMonths: [3],
      notes: ['Minimal pruning needed - just remove dead/crossing branches']
    },
    perennialInfo: {
      yearsToFirstHarvest: { min: 3, max: 5 },
      productiveYears: { min: 20, max: 30 }
    },
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Damson',
    enhancedAvoid: []
  },
  {
    id: 'plum-tree',
    name: 'Plum Tree',
    category: 'fruit-trees',
    description: 'Delicious stone fruit. Victoria is self-fertile and reliable.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [11, 12, 1, 2, 3],
      transplantMonths: [11, 12, 1, 2, 3],
      harvestMonths: [8, 9],
      daysToHarvest: { min: 730, max: 1825 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 350, rows: 400 },
      depth: 0,
      difficulty: 'intermediate',
      tips: [
        'Victoria is self-fertile and popular',
        'Prune in summer to avoid silver leaf',
        'May need thinning if heavy crop',
        'Late frost can damage blossom in Scotland'
      ]
    },
    enhancedCompanions: [
      { plantId: 'garlic', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'chives', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'comfrey', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    maintenance: {
      pruneMonths: [6, 7],
      feedMonths: [3],
      notes: ['Prune in summer to avoid silver leaf disease']
    },
    perennialInfo: {
      yearsToFirstHarvest: { min: 3, max: 5 },
      productiveYears: { min: 20, max: 30 }
    },
    rhsUrl: 'https://www.rhs.org.uk/fruit/plums/grow-your-own',
    botanicalName: 'Prunus domestica',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Prunus_domestica',
    enhancedAvoid: []
  },
  {
    id: 'pear-tree',
    name: 'Pear Tree',
    category: 'fruit-trees',
    description: 'Classic dessert fruit. Conference and Concorde are reliable self-fertile varieties.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [11, 12, 1, 2, 3],
      transplantMonths: [11, 12, 1, 2, 3],
      harvestMonths: [9, 10],
      daysToHarvest: { min: 730, max: 1825 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 350, rows: 400 },
      depth: 0,
      difficulty: 'intermediate',
      tips: [
        'Conference is self-fertile and reliable',
        'Needs warm wall in Scotland for best results',
        'Prune in winter when dormant',
        'Pick before fully ripe and ripen indoors'
      ]
    },
    enhancedCompanions: [
      { plantId: 'garlic', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'chives', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'nasturtium', confidence: 'traditional', mechanism: 'pest_trap', bidirectional: true }
    ],
    maintenance: {
      pruneMonths: [12, 1, 2],
      feedMonths: [3],
      notes: ['Winter prune when dormant', 'May need thinning if heavy crop']
    },
    perennialInfo: {
      yearsToFirstHarvest: { min: 4, max: 6 },
      productiveYears: { min: 35, max: 50 }
    },
    rhsUrl: 'https://www.rhs.org.uk/fruit/pears/grow-your-own',
    botanicalName: 'Pyrus communis',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Pyrus_communis',
    enhancedAvoid: []
  },
  {
    id: 'greengage-tree',
    name: 'Greengage Tree',
    category: 'fruit-trees',
    description: 'Sweet green plum variety. Cambridge Gage is hardiest for Scottish gardens.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [11, 12, 1, 2, 3],
      transplantMonths: [11, 12, 1, 2, 3],
      harvestMonths: [8, 9],
      daysToHarvest: { min: 730, max: 1825 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 350, rows: 400 },
      depth: 0,
      difficulty: 'intermediate',
      tips: [
        'Cambridge Gage most reliable for Scotland',
        'Needs pollination partner (other plum)',
        'Excellent for eating fresh or jam',
        'Prune in summer to avoid disease'
      ]
    },
    enhancedCompanions: [
      { plantId: 'garlic', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'chives', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'comfrey', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    maintenance: {
      pruneMonths: [6, 7],
      feedMonths: [3],
      notes: ['Prune in summer to avoid silver leaf disease']
    },
    perennialInfo: {
      yearsToFirstHarvest: { min: 3, max: 5 },
      productiveYears: { min: 20, max: 30 }
    },
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Greengages',
    enhancedAvoid: []
  },
  {
    id: 'medlar-tree',
    name: 'Medlar Tree',
    category: 'fruit-trees',
    description: 'Unusual historic fruit tree. Extremely hardy and self-fertile - perfect for Scottish climate.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [11, 12, 1, 2, 3],
      transplantMonths: [11, 12, 1, 2, 3],
      harvestMonths: [10, 11],
      daysToHarvest: { min: 730, max: 1825 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 400, rows: 500 },
      depth: 0,
      difficulty: 'beginner',
      tips: [
        'Very hardy - one of easiest fruit trees',
        'Self-fertile - no partner needed',
        'Must "blet" (soften) before eating',
        'Beautiful autumn color and spring blossom'
      ]
    },
    enhancedCompanions: [
      { plantId: 'garlic', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'chives', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'comfrey', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    maintenance: {
      pruneMonths: [12, 1, 2],
      feedMonths: [3],
      notes: ['Minimal pruning needed - very low maintenance']
    },
    perennialInfo: {
      yearsToFirstHarvest: { min: 3, max: 5 },
      productiveYears: { min: 30, max: 50 }
    },
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Medlar',
    enhancedAvoid: []
  },
  {
    id: 'quince-tree',
    name: 'Quince Tree',
    category: 'fruit-trees',
    description: 'Historic cooking fruit. Hardy and self-fertile with beautiful blossom.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [11, 12, 1, 2, 3],
      transplantMonths: [11, 12, 1, 2, 3],
      harvestMonths: [10, 11],
      daysToHarvest: { min: 730, max: 1825 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 350, rows: 400 },
      depth: 0,
      difficulty: 'beginner',
      tips: [
        'Self-fertile and hardy',
        'Perfect for jelly, jam, and membrillo',
        'Fragrant fruit in autumn',
        'Low maintenance - rarely needs pruning'
      ]
    },
    enhancedCompanions: [
      { plantId: 'garlic', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'chives', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'comfrey', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    maintenance: {
      pruneMonths: [12, 1, 2],
      feedMonths: [3],
      notes: ['Minimal pruning - just remove dead/crossing branches']
    },
    perennialInfo: {
      yearsToFirstHarvest: { min: 3, max: 5 },
      productiveYears: { min: 30, max: 50 }
    },
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Quince',
    enhancedAvoid: []
  },
  {
    id: 'fig-tree',
    name: 'Fig Tree',
    category: 'fruit-trees',
    description: 'Mediterranean fruit increasingly viable in UK. Brown Turkey is hardiest variety.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [11, 12, 1, 2, 3],
      transplantMonths: [11, 12, 1, 2, 3],
      harvestMonths: [8, 9],
      daysToHarvest: { min: 365, max: 730 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 400, rows: 500 },
      depth: 0,
      difficulty: 'intermediate',
      tips: [
        'Brown Turkey is hardiest for Scotland',
        'Needs warm south-facing wall',
        'Restrict roots to encourage fruiting',
        'Protect from hard frost in winter'
      ]
    },
    enhancedCompanions: [
      { plantId: 'comfrey', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'nasturtium', confidence: 'traditional', mechanism: 'pest_trap', bidirectional: true }
    ],
    maintenance: {
      pruneMonths: [3, 4],
      feedMonths: [4, 5],
      notes: ['Prune in early spring', 'May need winter protection in cold areas']
    },
    perennialInfo: {
      yearsToFirstHarvest: { min: 2, max: 3 },
      productiveYears: { min: 30, max: 50 }
    },
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Common_fig',
    enhancedAvoid: []
  },
  {
    id: 'mulberry-tree',
    name: 'Mulberry Tree',
    category: 'fruit-trees',
    description: 'Hardy long-lived fruit tree. Black mulberry is sweetest and most productive.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [11, 12, 1, 2, 3],
      transplantMonths: [11, 12, 1, 2, 3],
      harvestMonths: [8, 9],
      daysToHarvest: { min: 1095, max: 1825 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 500, rows: 600 },
      depth: 0,
      difficulty: 'beginner',
      tips: [
        'Very hardy and long-lived (centuries!)',
        'Self-fertile - no partner needed',
        'Slow to start but productive once established',
        'Fruit stains - plant away from paths'
      ]
    },
    enhancedCompanions: [
      { plantId: 'garlic', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'chives', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'comfrey', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    maintenance: {
      pruneMonths: [12, 1],
      feedMonths: [3],
      notes: ['Minimal pruning needed - bleeds sap if cut in growing season']
    },
    perennialInfo: {
      yearsToFirstHarvest: { min: 3, max: 5 },
      productiveYears: { min: 50, max: 100 }
    },
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Mulberry',
    enhancedAvoid: []
  }
]
