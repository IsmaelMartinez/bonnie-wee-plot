/**
 * Berries - Vegetable Database
 * Planting times adjusted for Scotland / Edinburgh climate
 */

import { Vegetable } from '@/types/garden-planner'

export const berries: Vegetable[] = [
  {
    id: 'strawberry',
    name: 'Strawberry',
    category: 'berries',
    description: 'Beloved summer fruit. Grows well in Scottish climate with protection.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [4, 5, 8, 9],
      transplantMonths: [4, 5, 8, 9],
      harvestMonths: [6, 7, 8, 9],
      daysToHarvest: { min: 60, max: 90 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 35, rows: 75 },
      depth: 0,
      difficulty: 'beginner',
      tips: [
        'Plant with crown at soil level',
        'Replace plants every 3-4 years',
        'Net against birds',
        'Straw mulch keeps fruit clean'
      ]
    },
    enhancedCompanions: [
      { plantId: 'lettuce', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'spinach', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'borage', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    perennialInfo: {
      yearsToFirstHarvest: { min: 1, max: 1 },
      productiveYears: { min: 3, max: 4 }
    },
    rhsUrl: 'https://www.rhs.org.uk/fruit/strawberries/grow-your-own',
    botanicalName: 'Fragaria × ananassa',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Fragaria_%C3%97_ananassa'
  },
  {
    id: 'raspberry',
    name: 'Raspberry',
    category: 'berries',
    description: 'Prolific soft fruit. Summer and autumn varieties give extended harvest.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [11, 12, 1, 2, 3],
      transplantMonths: [11, 12, 1, 2, 3],
      harvestMonths: [7, 8, 9, 10],
      daysToHarvest: { min: 365, max: 730 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 45, rows: 180 },
      depth: 5,
      difficulty: 'beginner',
      tips: [
        'Autumn varieties fruit on new canes',
        'Summer varieties need support wires',
        'Prune summer types after fruiting',
        'Scottish climate is ideal for raspberries'
      ]
    },
    enhancedCompanions: [
      { plantId: 'garlic', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'tansy', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'turnip', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'blackberry', confidence: 'likely', mechanism: 'disease_suppression', bidirectional: true },
      { plantId: 'potato', confidence: 'traditional', mechanism: 'disease_suppression', bidirectional: false }
    ],
    maintenance: {
      pruneMonths: [2, 8, 9],
      feedMonths: [3],
      mulchMonths: [3],
      notes: ['Summer types: cut fruited canes after harvest', 'Autumn types: cut all canes to ground in Feb']
    },
    perennialInfo: {
      yearsToFirstHarvest: { min: 2, max: 2 },
      productiveYears: { min: 10, max: 15 }
    },
    rhsUrl: 'https://www.rhs.org.uk/fruit/raspberries/grow-your-own',
    botanicalName: 'Rubus idaeus',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Rubus_idaeus'
  },
  {
    id: 'blackberry',
    name: 'Blackberry',
    category: 'berries',
    description: 'Hardy bramble fruit. Thornless varieties easier to manage.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [11, 12, 1, 2, 3],
      transplantMonths: [11, 12, 1, 2, 3],
      harvestMonths: [8, 9, 10],
      daysToHarvest: { min: 365, max: 730 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 250, rows: 250 },
      depth: 5,
      difficulty: 'beginner',
      tips: [
        'Thornless varieties much easier',
        'Train along wires or fence',
        'Cut out fruited canes after harvest',
        'Very vigorous - needs space'
      ]
    },
    enhancedCompanions: [
      { plantId: 'tansy', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'hyssop', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'raspberry', confidence: 'likely', mechanism: 'disease_suppression', bidirectional: true }
    ],
    perennialInfo: {
      yearsToFirstHarvest: { min: 2, max: 3 },
      productiveYears: { min: 10, max: 15 }
    },
    rhsUrl: 'https://www.rhs.org.uk/fruit/blackberries/grow-your-own',
    botanicalName: 'Rubus fruticosus',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Blackberry'
  },
  {
    id: 'blueberry',
    name: 'Blueberry',
    category: 'berries',
    description: 'Acid-loving shrub with delicious berries. Needs ericaceous soil.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [10, 11, 3, 4],
      transplantMonths: [10, 11, 3, 4],
      harvestMonths: [7, 8, 9],
      daysToHarvest: { min: 730, max: 1095 }
    },
    care: {
      sun: 'full-sun',
      water: 'high',
      spacing: { between: 150, rows: 200 },
      depth: 5,
      difficulty: 'intermediate',
      tips: [
        'Must have acidic soil (pH 4.5-5.5)',
        'Use ericaceous compost in containers',
        'Water with rainwater not tap water',
        'Net against birds'
      ]
    },
    perennialInfo: {
      yearsToFirstHarvest: { min: 2, max: 3 },
      productiveYears: { min: 15, max: 25 }
    },
    rhsUrl: 'https://www.rhs.org.uk/fruit/blueberries/grow-your-own',
    botanicalName: 'Vaccinium corymbosum',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Vaccinium_corymbosum',
    enhancedCompanions: [],
    enhancedAvoid: []
  },
  {
    id: 'gooseberry',
    name: 'Gooseberry',
    category: 'berries',
    description: 'Traditional Scottish soft fruit. Hardy and productive.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [11, 12, 1, 2, 3],
      transplantMonths: [11, 12, 1, 2, 3],
      harvestMonths: [6, 7, 8],
      daysToHarvest: { min: 365, max: 730 }
    },
    care: {
      sun: 'partial-shade',
      water: 'moderate',
      spacing: { between: 150, rows: 150 },
      depth: 5,
      difficulty: 'beginner',
      tips: [
        'Tolerates shade better than other fruits',
        'Prune to open goblet shape',
        'Pick early for cooking, ripe for dessert',
        'Watch for sawfly caterpillars'
      ]
    },
    enhancedCompanions: [
      { plantId: 'tansy', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    maintenance: {
      pruneMonths: [11, 12, 1, 2],
      feedMonths: [3],
      notes: ['Prune to open goblet shape in winter', 'Watch for sawfly in spring']
    },
    perennialInfo: {
      yearsToFirstHarvest: { min: 2, max: 3 },
      productiveYears: { min: 15, max: 20 }
    },
    rhsUrl: 'https://www.rhs.org.uk/fruit/gooseberries/grow-your-own',
    botanicalName: 'Ribes uva-crispa',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Gooseberry',
    enhancedAvoid: []
  },
  {
    id: 'blackcurrant',
    name: 'Blackcurrant',
    category: 'berries',
    description: 'Very hardy soft fruit packed with vitamin C. Thrives in Scotland!',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [11, 12, 1, 2, 3],
      transplantMonths: [11, 12, 1, 2, 3],
      harvestMonths: [7, 8],
      daysToHarvest: { min: 365, max: 730 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 150, rows: 180 },
      depth: 5,
      difficulty: 'beginner',
      tips: [
        'Plant 5cm deeper than nursery level',
        'Cut all stems to ground after planting',
        'Remove a third of old wood each year',
        'High in vitamin C - perfect for Scottish winters'
      ]
    },
    enhancedCompanions: [
      { plantId: 'tansy', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    maintenance: {
      pruneMonths: [11, 12],
      feedMonths: [3],
      mulchMonths: [3],
      notes: ['Remove a third of oldest wood each year after fruiting']
    },
    perennialInfo: {
      yearsToFirstHarvest: { min: 2, max: 3 },
      productiveYears: { min: 10, max: 15 }
    },
    botanicalName: 'Ribes nigrum',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Blackcurrant',
    enhancedAvoid: []
  },
  {
    id: 'redcurrant',
    name: 'Redcurrant',
    category: 'berries',
    description: 'Ornamental and productive soft fruit. Easy to grow in Scotland.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [11, 12, 1, 2, 3],
      transplantMonths: [11, 12, 1, 2, 3],
      harvestMonths: [7, 8],
      daysToHarvest: { min: 365, max: 730 }
    },
    care: {
      sun: 'partial-shade',
      water: 'moderate',
      spacing: { between: 150, rows: 150 },
      depth: 5,
      difficulty: 'beginner',
      tips: [
        'Can be trained as cordons against walls',
        'Tolerates shade well',
        'Prune like gooseberries',
        'Beautiful when fruiting'
      ]
    },
    enhancedCompanions: [
      { plantId: 'tansy', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    maintenance: {
      pruneMonths: [11, 12, 1, 2],
      feedMonths: [3],
      notes: ['Prune to open goblet shape like gooseberries']
    },
    perennialInfo: {
      yearsToFirstHarvest: { min: 2, max: 3 },
      productiveYears: { min: 15, max: 20 }
    },
    botanicalName: 'Ribes rubrum',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Redcurrant',
    enhancedAvoid: []
  },
  {
    id: 'tayberry',
    name: 'Tayberry',
    category: 'berries',
    description: 'Raspberry-blackberry hybrid from Scotland. Large aromatic berries.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [],
      transplantMonths: [11, 12, 1, 2, 3],
      harvestMonths: [7, 8],
      daysToHarvest: { min: 365, max: 730 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 200, rows: 200 },
      depth: 10,
      difficulty: 'intermediate',
      tips: [
        'Bred in Scotland - perfect for climate',
        'Large aromatic berries',
        'More disease-resistant than loganberry',
        'Tie canes to wires like raspberries'
      ]
    },
    enhancedCompanions: [
      { plantId: 'garlic', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'chives', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true }
    ],
    maintenance: {
      pruneMonths: [8, 9],
      feedMonths: [3],
      notes: ['Remove fruited canes after harvest']
    },
    perennialInfo: {
      yearsToFirstHarvest: { min: 2, max: 2 },
      productiveYears: { min: 10, max: 15 }
    },
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Tayberry',
    enhancedAvoid: []
  },
  {
    id: 'loganberry',
    name: 'Loganberry',
    category: 'berries',
    description: 'Another raspberry-blackberry hybrid. Tart flavor good for cooking.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [],
      transplantMonths: [11, 12, 1, 2, 3],
      harvestMonths: [7, 8],
      daysToHarvest: { min: 365, max: 730 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 200, rows: 200 },
      depth: 10,
      difficulty: 'intermediate',
      tips: [
        'Tart flavor - excellent for jams',
        'Vigorous - needs strong supports',
        'Thornless varieties available',
        'Tie to wires like blackberries'
      ]
    },
    enhancedCompanions: [
      { plantId: 'garlic', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'chives', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true }
    ],
    maintenance: {
      pruneMonths: [8, 9],
      feedMonths: [3],
      notes: ['Remove fruited canes after harvest']
    },
    perennialInfo: {
      yearsToFirstHarvest: { min: 2, max: 2 },
      productiveYears: { min: 10, max: 15 }
    },
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Loganberry',
    enhancedAvoid: []
  },
  {
    id: 'jostaberry',
    name: 'Jostaberry',
    category: 'berries',
    description: 'Blackcurrant-gooseberry hybrid. Thornless and productive.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [],
      transplantMonths: [11, 12, 1, 2, 3],
      harvestMonths: [7, 8],
      daysToHarvest: { min: 730, max: 1095 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 150, rows: 200 },
      depth: 10,
      difficulty: 'beginner',
      tips: [
        'Thornless - easier to pick than gooseberries',
        'Very hardy for Scottish gardens',
        'Large berries with blackcurrant flavor',
        'Self-fertile'
      ]
    },
    enhancedCompanions: [
      { plantId: 'tansy', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    maintenance: {
      pruneMonths: [11, 12, 1, 2],
      feedMonths: [3],
      notes: ['Minimal pruning needed - remove dead wood']
    },
    perennialInfo: {
      yearsToFirstHarvest: { min: 2, max: 3 },
      productiveYears: { min: 15, max: 20 }
    },
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Jostaberry',
    enhancedAvoid: []
  },
  {
    id: 'honeyberry',
    name: 'Honeyberry (Haskap)',
    category: 'berries',
    description: 'Blue honeysuckle berry. Extremely cold-hardy superfruit.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [],
      transplantMonths: [11, 12, 1, 2, 3],
      harvestMonths: [5, 6],
      daysToHarvest: { min: 730, max: 1095 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 150, rows: 200 },
      depth: 10,
      difficulty: 'beginner',
      tips: [
        'Extremely cold-hardy - ideal for Scotland',
        'Very early fruiting - before strawberries',
        'Plant 2 varieties for cross-pollination',
        'High in antioxidants'
      ]
    },
    maintenance: {
      pruneMonths: [11, 12, 1, 2],
      feedMonths: [3],
      notes: ['Minimal pruning - remove dead wood only']
    },
    perennialInfo: {
      yearsToFirstHarvest: { min: 2, max: 3 },
      productiveYears: { min: 20, max: 30 }
    },
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Lonicera_caerulea',
    enhancedCompanions: [],
    enhancedAvoid: []
  },
  {
    id: 'goji-berry',
    name: 'Goji Berry',
    category: 'berries',
    description: 'Superfood shrub from Asia. Hardy and productive in Scotland.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [],
      transplantMonths: [4, 5],
      harvestMonths: [8, 9, 10],
      daysToHarvest: { min: 730, max: 1095 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 150, rows: 200 },
      depth: 10,
      difficulty: 'beginner',
      tips: [
        'Very hardy - tolerates -25°C',
        'Fruits from second year',
        'Can be invasive - suckers freely',
        'Dry berries for winter superfood'
      ]
    },
    maintenance: {
      pruneMonths: [2, 3],
      feedMonths: [3],
      notes: ['Control suckers to prevent spread']
    },
    perennialInfo: {
      yearsToFirstHarvest: { min: 2, max: 2 },
      productiveYears: { min: 15, max: 20 }
    },
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Goji',
    enhancedCompanions: [],
    enhancedAvoid: []
  },
  {
    id: 'aronia',
    name: 'Aronia (Chokeberry)',
    category: 'berries',
    description: 'Antioxidant-rich native American berry. Very hardy shrub.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [],
      transplantMonths: [11, 12, 1, 2, 3],
      harvestMonths: [9, 10],
      daysToHarvest: { min: 730, max: 1095 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 150, rows: 200 },
      depth: 10,
      difficulty: 'beginner',
      tips: [
        'Extremely hardy - survives -35°C',
        'High in anthocyanins - superfood',
        'Beautiful autumn color',
        'Birds leave berries alone due to astringency'
      ]
    },
    maintenance: {
      pruneMonths: [11, 12, 1, 2],
      feedMonths: [3],
      notes: ['Minimal pruning needed']
    },
    perennialInfo: {
      yearsToFirstHarvest: { min: 2, max: 3 },
      productiveYears: { min: 20, max: 30 }
    },
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Aronia',
    enhancedCompanions: [],
    enhancedAvoid: []
  },
  {
    id: 'elderberry',
    name: 'Elderberry',
    category: 'berries',
    description: 'Native British shrub. Flowers and berries both useful.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [],
      transplantMonths: [11, 12, 1, 2, 3],
      harvestMonths: [8, 9],
      daysToHarvest: { min: 730, max: 1095 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 250, rows: 300 },
      depth: 10,
      difficulty: 'beginner',
      tips: [
        'Native to Britain - very hardy',
        'Flowers for cordial in June',
        'Berries for wine/syrup in September',
        'Fast-growing - can be 3m tall'
      ]
    },
    maintenance: {
      pruneMonths: [11, 12, 1],
      feedMonths: [3],
      notes: ['Prune to maintain size and shape']
    },
    perennialInfo: {
      yearsToFirstHarvest: { min: 2, max: 3 },
      productiveYears: { min: 20, max: 30 }
    },
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Sambucus',
    enhancedCompanions: [],
    enhancedAvoid: []
  },
  {
    id: 'sea-buckthorn',
    name: 'Sea Buckthorn',
    category: 'berries',
    description: 'Coastal native with vitamin C-rich berries. Fixes nitrogen.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [],
      transplantMonths: [11, 12, 1, 2, 3],
      harvestMonths: [9, 10],
      daysToHarvest: { min: 1095, max: 1460 }
    },
    care: {
      sun: 'full-sun',
      water: 'low',
      spacing: { between: 200, rows: 300 },
      depth: 10,
      difficulty: 'intermediate',
      tips: [
        'Native to Scottish coasts',
        'Need male and female plants',
        'Fixes nitrogen - good for poor soil',
        'Extremely high vitamin C content'
      ]
    },
    maintenance: {
      pruneMonths: [11, 12, 1],
      feedMonths: [],
      notes: ['Minimal care - very tough plant']
    },
    perennialInfo: {
      yearsToFirstHarvest: { min: 3, max: 4 },
      productiveYears: { min: 20, max: 30 }
    },
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Hippophae',
    enhancedCompanions: [],
    enhancedAvoid: []
  }
]
