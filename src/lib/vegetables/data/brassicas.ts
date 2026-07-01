/**
 * Brassicas - Vegetable Database
 * Planting times adjusted for Scotland / Edinburgh climate
 */

import { Vegetable } from '@/types/garden-planner'

export const brassicas: Vegetable[] = [
  {
    id: 'swede',
    storage: {
      methods: ['store-cool', 'fresh'],
      tip: 'Very hardy — leave in the ground and lift as needed, or store the roots in boxes of damp sand somewhere cool and frost-free.',
    },
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
    hardiness: 'H6',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Rutabaga'
  },
  {
    id: 'turnip',
    storage: {
      methods: ['store-cool', 'fridge'],
      tip: 'Eat small ones fresh; twist the tops off maincrop turnips and store in boxes of damp sand somewhere cool.',
    },
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
    hardiness: 'H5',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Turnip'
  },
  {
    id: 'radish',
    storage: {
      methods: ['fridge', 'pickle', 'fresh'],
      freshDays: 10,
      tip: 'Best eaten fresh from the plot; quick-pickle a glut of summer radish.',
    },
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
    hardiness: 'H4',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Radish'
  },
  {
    id: 'cabbage',
    storage: {
      methods: ['fridge', 'store-cool', 'ferment'],
      tip: 'Firm heads keep for weeks in a cool shed; shred the glut into sauerkraut.',
    },
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
    maintenance: {
      feedMonths: [6, 7],
      feedFrequencyDays: 28,
      feedType: 'high-nitrogen',
      notes: ['Top-dress with a high-nitrogen feed monthly during active growth']
    },
    rhsUrl: 'https://www.rhs.org.uk/vegetables/cabbages/grow-your-own',
    botanicalName: 'Brassica oleracea var. capitata',
    hardiness: 'H5',
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
    storage: {
      methods: ['fresh', 'fridge', 'freeze'],
      freshDays: 7,
      tip: 'Cut the main head then keep picking side shoots; blanch and freeze any glut.',
    },
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
    maintenance: {
      feedMonths: [6, 7],
      feedFrequencyDays: 28,
      feedType: 'high-nitrogen',
      notes: ['Top-dress with a high-nitrogen feed monthly during active growth']
    },
    rhsUrl: 'https://www.rhs.org.uk/vegetables/broccoli/grow-your-own',
    botanicalName: 'Brassica oleracea var. italica',
    hardiness: 'H4',
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
    storage: {
      methods: ['fresh', 'freeze'],
      freshDays: 5,
      tip: 'Pick spears regularly to keep them coming; blanch and freeze a glut.',
    },
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
    maintenance: {
      feedMonths: [7, 8, 9],
      feedFrequencyDays: 28,
      feedType: 'high-nitrogen',
      notes: ['Top-dress with a high-nitrogen feed monthly during active growth']
    },
    enhancedCompanions: [
      { plantId: 'beetroot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'onion', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'strawberry', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Broccoli',
    hardiness: 'H6'
  },
  {
    id: 'cauliflower',
    storage: {
      methods: ['fresh', 'fridge', 'freeze', 'pickle'],
      freshDays: 7,
      tip: 'Curds don’t hold long once ready — break into florets and freeze, or make piccalilli with a glut.',
    },
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
    maintenance: {
      feedMonths: [6, 7],
      feedFrequencyDays: 28,
      feedType: 'high-nitrogen',
      notes: ['Top-dress with a high-nitrogen feed monthly during active growth']
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
    hardiness: 'H4',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Cauliflower'
  },
  {
    id: 'brussels-sprouts',
    storage: {
      methods: ['fresh', 'freeze'],
      freshDays: 7,
      tip: 'Stands through hard frost — pick up the stalk as needed; freezes well blanched.',
    },
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
    maintenance: {
      feedMonths: [7, 8],
      feedFrequencyDays: 28,
      feedType: 'high-nitrogen',
      notes: ['Top-dress with a high-nitrogen feed monthly during summer growth']
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
    hardiness: 'H6',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Brussels_sprout'
  },
  {
    id: 'kohlrabi',
    storage: {
      methods: ['fridge', 'store-cool', 'freeze'],
      freshDays: 21,
      tip: 'Keeps well in the fridge or a cool shed; dice and freeze a surplus.',
    },
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
    hardiness: 'H4',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Kohlrabi'
  },
  {
    id: 'savoy-cabbage',
    storage: {
      methods: ['fresh', 'store-cool', 'freeze'],
      tip: 'Very hardy — stands in the ground through frost; shred and freeze any surplus.',
    },
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
    maintenance: {
      feedMonths: [7, 8],
      feedFrequencyDays: 28,
      feedType: 'high-nitrogen',
      notes: ['Top-dress with a high-nitrogen feed monthly during active growth']
    },
    enhancedCompanions: [
      { plantId: 'beetroot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'celery', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'onion', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'strawberry', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Savoy_cabbage',
    hardiness: 'H5'
  },
  {
    id: 'red-cabbage',
    storage: {
      methods: ['fridge', 'store-cool', 'pickle'],
      tip: 'Keeps for weeks somewhere cool; classic pickled or cooked into chutney.',
    },
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
    maintenance: {
      feedMonths: [7, 8],
      feedFrequencyDays: 28,
      feedType: 'high-nitrogen',
      notes: ['Top-dress with a high-nitrogen feed monthly during active growth']
    },
    enhancedCompanions: [
      { plantId: 'beetroot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'celery', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'onion', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'strawberry', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Red_cabbage',
    hardiness: 'H5'
  },
  {
    id: 'chinese-broccoli',
    storage: {
      methods: ['fridge', 'freeze'],
      freshDays: 5,
      tip: 'Best used fresh; blanch florets before freezing any extra.',
    },
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
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Gai_lan',
    hardiness: 'H4'
  },
  {
    id: 'romanesco',
    storage: {
      methods: ['fridge', 'freeze'],
      freshDays: 7,
      tip: 'Treat like cauliflower; blanch florets to freeze a glut.',
    },
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
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Romanesco_broccoli',
    hardiness: 'H4'
  },
  {
    id: 'turnip-tops',
    storage: {
      methods: ['fridge', 'freeze'],
      freshDays: 4,
      tip: 'Cook the greens soon after picking; blanch and freeze extras.',
    },
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
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Rapini',
    hardiness: 'H4'
  },
  {
    id: 'mibuna',
    storage: {
      methods: ['fridge', 'fresh'],
      freshDays: 5,
      tip: 'Pick young leaves for the salad bowl; does not freeze well.',
    },
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
    hardiness: 'H4',
    enhancedAvoid: []
  },
  {
    id: 'seakale',
    storage: {
      methods: ['fresh', 'fridge'],
      freshDays: 3,
      tip: 'Eat the blanched spring shoots straight away; they wilt fast.',
    },
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
      feedFrequencyDays: 60,
      feedType: 'balanced',
      waterFrequencyDays: 10,
      notes: ['Cover crowns to blanch shoots']
    },
    careTips: [
      { months: [2, 3], tip: 'Cover the crown with a bucket or forcing pot to produce pale tender shoots', category: 'protect' },
      { months: [3, 4, 5], tip: 'Harvest the blanched shoots, then remove the cover and let the leaves grow', category: 'harvest' },
      { months: [5], tip: 'Stop cutting and let the foliage feed the crown after spring', category: 'care' },
      { months: [3], tip: 'Feed and mulch the crown in spring', category: 'care' },
      { months: [6, 7], tip: 'Remove flowering stems to keep the plant productive', category: 'care' },
      { months: [10, 11, 12], tip: 'Propagate from root cuttings (thongs) taken in autumn or winter', category: 'propagate' },
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Crambe_maritima',
    hardiness: 'H7'
  }
]
