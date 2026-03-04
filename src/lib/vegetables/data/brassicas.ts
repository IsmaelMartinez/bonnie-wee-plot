/**
 * Brassicas - Vegetable Database
 * Planting times adjusted for Scotland / Edinburgh climate
 */

import { Vegetable } from '@/types/garden-planner'

export const brassicas: Vegetable[] = [
  {
    id: 'swede',
    name: 'Swede (Neeps)',
    category: 'brassicas',
    description: 'Essential for Burns Night! Hardy Scottish favorite that loves cool weather.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [5, 6],
      transplantMonths: [],
      harvestMonths: [10, 11, 12, 1, 2, 3],
      daysToHarvest: { min: 90, max: 120 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 23, rows: 38 },
      depth: 2,
      difficulty: 'beginner',
      tips: [
        'Essential for Burns Night neeps & tatties!',
        'Frost sweetens the roots',
        'Can leave in ground all winter'
      ]
    },
    enhancedCompanions: [
      { plantId: 'peas', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'onion', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'cabbage', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'cauliflower', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    rhsUrl: 'https://www.rhs.org.uk/vegetables/swede/grow-your-own',
    botanicalName: 'Brassica napus',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Rutabaga'
  },
  {
    id: 'turnip',
    name: 'Turnip',
    category: 'brassicas',
    description: 'Fast-growing root with edible greens. Best harvested young.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [4, 5, 7, 8],
      transplantMonths: [],
      harvestMonths: [6, 7, 8, 10, 11],
      daysToHarvest: { min: 40, max: 60 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 15, rows: 30 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Harvest when golf ball sized',
        'Young leaves are edible (turnip tops)',
        'Quick maturing varieties best for short season'
      ]
    },
    enhancedCompanions: [
      { plantId: 'peas', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'potato', confidence: 'traditional', mechanism: 'nutrient_competition', bidirectional: false }
    ],
    rhsUrl: 'https://www.rhs.org.uk/vegetables/turnips/grow-your-own',
    botanicalName: 'Brassica rapa',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Turnip'
  },
  {
    id: 'radish',
    name: 'Radish',
    category: 'brassicas',
    description: 'Quick-growing root crop. Ready in weeks - ideal for Scottish summer.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [4, 5, 6, 7, 8, 9],
      transplantMonths: [],
      harvestMonths: [5, 6, 7, 8, 9, 10],
      daysToHarvest: { min: 25, max: 35 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 3, rows: 15 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Harvest promptly to avoid woodiness',
        'Great for intercropping',
        'Less likely to bolt in cool Scottish weather'
      ]
    },
    enhancedCompanions: [
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'lettuce', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'peas', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'spinach', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'hyssop', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    rhsUrl: 'https://www.rhs.org.uk/vegetables/radish/grow-your-own',
    botanicalName: 'Raphanus sativus',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Radish'
  },
  {
    id: 'cabbage',
    name: 'Cabbage',
    category: 'brassicas',
    description: 'Classic vegetable. Spring and winter varieties excellent for Scotland.',
    planting: {
      sowIndoorsMonths: [3, 4, 5],
      sowOutdoorsMonths: [5, 6],
      transplantMonths: [5, 6, 7],
      harvestMonths: [7, 8, 9, 10, 11, 12, 1, 2, 3],
      daysToHarvest: { min: 70, max: 120 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 45, rows: 60 },
      depth: 1,
      difficulty: 'intermediate',
      tips: [
        'Net against pigeons - they love it!',
        'Firm soil well when transplanting',
        'Collar against cabbage root fly'
      ]
    },
    rhsUrl: 'https://www.rhs.org.uk/vegetables/cabbages/grow-your-own',
    botanicalName: 'Brassica oleracea var. capitata',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Brassica_oleracea',
    enhancedCompanions: [
      { plantId: 'beetroot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'celery', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'onion', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true, source: 'Allium scent deters cabbage pests' },
      { plantId: 'potato', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'strawberry', confidence: 'traditional', mechanism: 'nutrient_competition', bidirectional: true }
    ]
  },
  {
    id: 'broccoli',
    name: 'Calabrese (Broccoli)',
    category: 'brassicas',
    description: 'Quick maturing broccoli. Start indoors for best results in Scotland.',
    planting: {
      sowIndoorsMonths: [4, 5],
      sowOutdoorsMonths: [],
      transplantMonths: [5, 6, 7],
      harvestMonths: [7, 8, 9, 10],
      daysToHarvest: { min: 60, max: 90 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 45, rows: 60 },
      depth: 1,
      difficulty: 'intermediate',
      tips: [
        'Start early indoors for longer season',
        'Cut main head to encourage side shoots',
        'Net against cabbage white butterflies'
      ]
    },
    rhsUrl: 'https://www.rhs.org.uk/vegetables/broccoli/grow-your-own',
    botanicalName: 'Brassica oleracea var. italica',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Broccoli',
    enhancedCompanions: [
      { plantId: 'beetroot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'celery', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'onion', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true, source: 'Allium scent deters cabbage pests' },
      { plantId: 'potato', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'strawberry', confidence: 'traditional', mechanism: 'nutrient_competition', bidirectional: true }
    ]
  },
  {
    id: 'purple-sprouting-broccoli',
    name: 'Purple Sprouting Broccoli',
    category: 'brassicas',
    description: 'Hardy winter broccoli - harvests when little else is available!',
    planting: {
      sowIndoorsMonths: [4, 5],
      sowOutdoorsMonths: [5],
      transplantMonths: [6, 7],
      harvestMonths: [2, 3, 4, 5],
      daysToHarvest: { min: 220, max: 280 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 60, rows: 75 },
      depth: 1,
      difficulty: 'intermediate',
      tips: [
        'Perfect for hungry gap (Feb-April)',
        'Very hardy - survives Scottish winters',
        'Stake plants as they get tall'
      ]
    },
    enhancedCompanions: [
      { plantId: 'beetroot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'onion', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'strawberry', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Broccoli'
  },
  {
    id: 'cauliflower',
    name: 'Cauliflower',
    category: 'brassicas',
    description: 'Demanding but rewarding. Choose varieties suited to Scotland.',
    planting: {
      sowIndoorsMonths: [2, 3, 4, 5],
      sowOutdoorsMonths: [],
      transplantMonths: [5, 6, 7],
      harvestMonths: [7, 8, 9, 10, 11],
      daysToHarvest: { min: 80, max: 120 }
    },
    care: {
      sun: 'full-sun',
      water: 'high',
      spacing: { between: 60, rows: 60 },
      depth: 1,
      difficulty: 'advanced',
      tips: [
        'Consistent watering crucial',
        'Bend leaves over curd to protect',
        'Autumn/winter varieties more reliable in Scotland'
      ]
    },
    enhancedCompanions: [
      { plantId: 'beetroot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'celery', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'strawberry', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    rhsUrl: 'https://www.rhs.org.uk/vegetables/cauliflowers/grow-your-own',
    botanicalName: 'Brassica oleracea var. botrytis',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Cauliflower'
  },
  {
    id: 'brussels-sprouts',
    name: 'Brussels Sprouts',
    category: 'brassicas',
    description: 'Christmas dinner essential! Improves after frost.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [],
      transplantMonths: [5, 6],
      harvestMonths: [10, 11, 12, 1, 2, 3],
      daysToHarvest: { min: 150, max: 180 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 60, rows: 75 },
      depth: 1,
      difficulty: 'intermediate',
      tips: [
        'Frost sweetens the sprouts',
        'Stake tall plants against Scottish winds',
        'Harvest from bottom up'
      ]
    },
    enhancedCompanions: [
      { plantId: 'beetroot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'onion', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'strawberry', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    rhsUrl: 'https://www.rhs.org.uk/vegetables/brussels-sprouts/grow-your-own',
    botanicalName: 'Brassica oleracea var. gemmifera',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Brussels_sprout'
  },
  {
    id: 'kohlrabi',
    name: 'Kohlrabi',
    category: 'brassicas',
    description: 'Fast-growing unusual brassica. Very cold-hardy, perfect for Scotland.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [5, 6, 7],
      transplantMonths: [5, 6],
      harvestMonths: [6, 7, 8, 9, 10],
      daysToHarvest: { min: 55, max: 70 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 23, rows: 30 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Harvest when tennis ball sized',
        'Very tolerant of Scottish weather',
        'Crisp, mild cabbage-like flavor'
      ]
    },
    enhancedCompanions: [
      { plantId: 'beetroot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'onion', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'dill', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'strawberry', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    rhsUrl: 'https://www.rhs.org.uk/vegetables/kohlrabi/grow-your-own',
    botanicalName: 'Brassica oleracea var. gongylodes',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Kohlrabi'
  },
  {
    id: 'savoy-cabbage',
    name: 'Savoy Cabbage',
    category: 'brassicas',
    description: 'Frost-hardy winter cabbage with crinkled leaves. Traditional Scottish winter vegetable.',
    planting: {
      sowIndoorsMonths: [4, 5],
      sowOutdoorsMonths: [],
      transplantMonths: [6, 7],
      harvestMonths: [10, 11, 12, 1, 2, 3],
      daysToHarvest: { min: 120, max: 150 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 45, rows: 60 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Most frost-hardy cabbage variety',
        'Improves in flavor after frost',
        'Can harvest through Scottish winter',
        'Crinkled leaves great for stuffing'
      ]
    },
    enhancedCompanions: [
      { plantId: 'beetroot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'celery', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'onion', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'strawberry', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Savoy_cabbage'
  },
  {
    id: 'red-cabbage',
    name: 'Red Cabbage',
    category: 'brassicas',
    description: 'Purple storage cabbage. Excellent for pickling and winter storage.',
    planting: {
      sowIndoorsMonths: [4, 5],
      sowOutdoorsMonths: [],
      transplantMonths: [6, 7],
      harvestMonths: [9, 10, 11, 12],
      daysToHarvest: { min: 120, max: 150 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 45, rows: 60 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Stores well for months in cool conditions',
        'Rich in anthocyanins - very healthy',
        'Traditional for pickling and braising',
        'Frost-hardy - can leave in ground'
      ]
    },
    enhancedCompanions: [
      { plantId: 'beetroot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'celery', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'onion', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'strawberry', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Red_cabbage'
  },
  {
    id: 'chinese-broccoli',
    name: 'Chinese Broccoli (Kai Lan)',
    category: 'brassicas',
    description: 'Fast-growing Asian green. Harvest young shoots and leaves.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [5, 6, 7, 8],
      transplantMonths: [5, 6],
      harvestMonths: [6, 7, 8, 9, 10],
      daysToHarvest: { min: 50, max: 70 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 30, rows: 40 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Fast-growing - ready in 7-9 weeks',
        'Harvest young shoots before flowering',
        'Cut and come again for continuous harvest',
        'More heat-tolerant than regular broccoli'
      ]
    },
    enhancedCompanions: [
      { plantId: 'beetroot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'celery', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'onion', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'strawberry', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Gai_lan'
  },
  {
    id: 'romanesco',
    name: 'Romanesco',
    category: 'brassicas',
    description: 'Fractal cauliflower with lime-green spirals. Stunning and delicious.',
    planting: {
      sowIndoorsMonths: [4, 5],
      sowOutdoorsMonths: [],
      transplantMonths: [6, 7],
      harvestMonths: [9, 10, 11],
      daysToHarvest: { min: 80, max: 100 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 60, rows: 60 },
      depth: 1,
      difficulty: 'intermediate',
      tips: [
        'Stunning mathematical spiral pattern',
        'Needs consistent conditions - no stress',
        'Milder and nuttier than cauliflower',
        'Harvest when spirals fully formed'
      ]
    },
    enhancedCompanions: [
      { plantId: 'beetroot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'celery', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'onion', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'strawberry', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Romanesco_broccoli'
  },
  {
    id: 'turnip-tops',
    name: 'Turnip Tops (Rapini)',
    category: 'brassicas',
    description: 'Grown for leafy greens rather than roots. Italian favorite, fast-growing.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [4, 5, 6, 7, 8, 9],
      transplantMonths: [],
      harvestMonths: [6, 7, 8, 9, 10, 11, 12, 1, 2],
      daysToHarvest: { min: 30, max: 50 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 15, rows: 20 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Very fast - harvest in 4-6 weeks',
        'Sow succession crops for continuous harvest',
        'Bitter flavor like broccoli raab',
        'Overwinters well in Scotland'
      ]
    },
    enhancedCompanions: [
      { plantId: 'peas', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'onion', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'potato', confidence: 'traditional', mechanism: 'nutrient_competition', bidirectional: false }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Rapini'
  },
  {
    id: 'mibuna',
    name: 'Mibuna',
    category: 'brassicas',
    description: 'Japanese mustard green with serrated leaves. Very cold-hardy for Scotland.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [4, 5, 6, 7, 8, 9],
      transplantMonths: [5, 6],
      harvestMonths: [6, 7, 8, 9, 10, 11, 12, 1, 2],
      daysToHarvest: { min: 40, max: 50 }
    },
    care: {
      sun: 'partial-shade',
      water: 'moderate',
      spacing: { between: 20, rows: 25 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Similar to mizuna but more serrated leaves',
        'Very frost-hardy - overwinters in Scotland',
        'Milder flavor than mizuna',
        'Fast-growing for cut-and-come-again'
      ]
    },
    enhancedCompanions: [
      { plantId: 'lettuce', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'spinach', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'mizuna', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Brassica_rapa',
    enhancedAvoid: []
  },
  {
    id: 'seakale',
    name: 'Sea Kale',
    category: 'brassicas',
    description: 'Coastal native perennial vegetable. Blanched shoots eaten in spring.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [3, 4],
      transplantMonths: [3, 4, 9, 10],
      harvestMonths: [3, 4, 5],
      daysToHarvest: { min: 365, max: 730 }
    },
    care: {
      sun: 'full-sun',
      water: 'low',
      spacing: { between: 60, rows: 60 },
      depth: 2,
      difficulty: 'intermediate',
      tips: [
        'Force blanch shoots in spring',
        'Very hardy Scottish native',
        'Ornamental blue foliage',
        'Perennial - crops for many years'
      ]
    },
    enhancedCompanions: [
      { plantId: 'beetroot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'onion', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'strawberry', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    maintenance: {
      feedMonths: [3],
      notes: ['Cover crowns to blanch shoots']
    },
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Crambe_maritima'
  }
]
