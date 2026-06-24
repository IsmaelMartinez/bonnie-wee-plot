/**
 * Leafy Greens - Vegetable Database
 * Planting times adjusted for Scotland / Edinburgh climate
 */

import { Vegetable } from '@/types/garden-planner'

export const leafyGreens: Vegetable[] = [
  {
    id: 'lettuce',
    storage: {
      methods: ['fridge', 'fresh'],
      freshDays: 5,
      tip: 'Pick leaves cool in the morning; keep in a sealed bag in the salad drawer.',
    },
    name: 'Lettuce',
    category: 'leafy-greens',
    description: 'Fast-growing salad crop. Start indoors in Scotland for earlier harvest.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [5, 6, 7, 8],
      transplantMonths: [5, 6, 7, 8],
      harvestMonths: [6, 7, 8, 9, 10],
      daysToHarvest: { min: 45, max: 75 }
    },
    care: {
      sun: 'partial-shade',
      water: 'moderate',
      spacing: { between: 25, rows: 30 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Sow little and often for continuous harvest',
        'Scottish summers rarely cause bolting - bonus!',
        'Harvest outer leaves for cut-and-come-again'
      ]
    },
    enhancedCompanions: [
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'radish', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'strawberry', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'chives', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true }
    ],
    rhsUrl: 'https://www.rhs.org.uk/vegetables/lettuce/grow-your-own',
    botanicalName: 'Lactuca sativa',
    hardiness: 'H4',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Lactuca_sativa',
    enhancedAvoid: []
  },
  {
    id: 'spinach',
    storage: {
      methods: ['fresh', 'fridge', 'freeze'],
      freshDays: 3,
      tip: 'Wilts fast — use within a few days or blanch and freeze; bolts quickly in dry spells, so pick young.',
    },
    name: 'Spinach',
    category: 'leafy-greens',
    description: 'Nutritious leafy green. Thrives in cool Scottish climate.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [4, 5, 8, 9],
      transplantMonths: [5, 6],
      harvestMonths: [5, 6, 7, 8, 10, 11],
      daysToHarvest: { min: 40, max: 50 }
    },
    care: {
      sun: 'partial-shade',
      water: 'moderate',
      spacing: { between: 15, rows: 30 },
      depth: 2,
      difficulty: 'beginner',
      tips: [
        'Perfect for Scottish climate - rarely bolts',
        'Autumn sowings can overwinter with protection',
        'Pick outer leaves regularly'
      ]
    },
    enhancedCompanions: [
      { plantId: 'strawberry', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'peas', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    rhsUrl: 'https://www.rhs.org.uk/vegetables/spinach/grow-your-own',
    botanicalName: 'Spinacia oleracea',
    hardiness: 'H5',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Spinacia_oleracea',
    enhancedAvoid: []
  },
  {
    id: 'perpetual-spinach',
    storage: {
      methods: ['fridge', 'freeze'],
      freshDays: 6,
      tip: 'Use fresh within days; blanch and freeze any glut from a heavy cut.',
    },
    name: 'Perpetual Spinach',
    category: 'leafy-greens',
    description: 'Hardy leaf beet that survives Scottish winters. Cut-and-come-again.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [4, 5, 6, 7, 8],
      transplantMonths: [5, 6],
      harvestMonths: [6, 7, 8, 9, 10, 11, 12, 1, 2, 3, 4],
      daysToHarvest: { min: 50, max: 60 }
    },
    care: {
      sun: 'partial-shade',
      water: 'moderate',
      spacing: { between: 30, rows: 40 },
      depth: 2,
      difficulty: 'beginner',
      tips: [
        'Survives Scottish winters with minimal protection',
        'Pick regularly to prevent bolting',
        'One of the most productive greens for Scotland'
      ]
    },
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'onion', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Chard',
    hardiness: 'H4',
    enhancedAvoid: []
  },
  {
    id: 'kale',
    storage: {
      methods: ['fresh', 'fridge', 'freeze'],
      freshDays: 5,
      tip: 'Very hardy — pick leaves through autumn and winter; blanch and freeze a glut.',
    },
    name: 'Kale',
    category: 'leafy-greens',
    description: 'Hardy winter green - a Scottish staple! Improves after frost.',
    planting: {
      sowIndoorsMonths: [4, 5],
      sowOutdoorsMonths: [5, 6, 7],
      transplantMonths: [6, 7, 8],
      harvestMonths: [9, 10, 11, 12, 1, 2, 3, 4],
      daysToHarvest: { min: 55, max: 75 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 45, rows: 60 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Frost sweetens the leaves - perfect for Scotland',
        'Harvest lower leaves first',
        'Net against pigeons'
      ]
    },
    rhsUrl: 'https://www.rhs.org.uk/vegetables/kale/grow-your-own',
    botanicalName: 'Brassica oleracea var. sabellica',
    hardiness: 'H6',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Kale',
    enhancedCompanions: [
      { plantId: 'beetroot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'celery', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'onion', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true, source: 'Allium scent deters brassica pests' },
      { plantId: 'potato', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'strawberry', confidence: 'traditional', mechanism: 'nutrient_competition', bidirectional: true }
    ]
  },
  {
    id: 'chard',
    storage: {
      methods: ['fresh', 'fridge', 'freeze'],
      freshDays: 4,
      tip: 'Cut outer leaves regularly to keep it coming; blanch and freeze a glut like spinach.',
    },
    name: 'Swiss Chard',
    category: 'leafy-greens',
    description: 'Colorful, productive leafy green with edible stems. Hardy in mild winters.',
    planting: {
      sowIndoorsMonths: [4, 5],
      sowOutdoorsMonths: [5, 6, 7],
      transplantMonths: [6, 7],
      harvestMonths: [7, 8, 9, 10, 11],
      daysToHarvest: { min: 50, max: 60 }
    },
    care: {
      sun: 'partial-shade',
      water: 'moderate',
      spacing: { between: 30, rows: 45 },
      depth: 2,
      difficulty: 'beginner',
      tips: [
        'Cut-and-come-again harvesting',
        'Rainbow varieties brighten Scottish gardens',
        'May overwinter in sheltered spots'
      ]
    },
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'onion', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true }
    ],
    rhsUrl: 'https://www.rhs.org.uk/vegetables/swiss-chard/grow-your-own',
    botanicalName: 'Beta vulgaris subsp. cicla',
    hardiness: 'H4',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Chard',
    enhancedAvoid: []
  },
  {
    id: 'rocket',
    storage: {
      methods: ['fridge', 'fresh'],
      freshDays: 4,
      tip: 'Best eaten fresh; store dry in a sealed bag and use within a few days.',
    },
    name: 'Rocket (Arugula)',
    category: 'leafy-greens',
    description: 'Peppery salad leaf that grows quickly. Less likely to bolt in Scotland.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [5, 6, 7, 8, 9],
      transplantMonths: [],
      harvestMonths: [5, 6, 7, 8, 9, 10],
      daysToHarvest: { min: 21, max: 40 }
    },
    care: {
      sun: 'partial-shade',
      water: 'moderate',
      spacing: { between: 15, rows: 20 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Wild rocket is hardier than salad rocket',
        'Sow every 3 weeks for continuous harvest',
        'Pick leaves young for milder flavor'
      ]
    },
    enhancedCompanions: [
      { plantId: 'french-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'beetroot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'lettuce', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    botanicalName: 'Eruca vesicaria',
    hardiness: 'H5',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Eruca_vesicaria',
    enhancedAvoid: []
  },
  {
    id: 'mizuna',
    storage: {
      methods: ['fridge', 'fresh'],
      freshDays: 5,
      tip: 'Crisp peppery leaf; keep in the salad drawer and pick young for best flavour.',
    },
    name: 'Mizuna',
    category: 'leafy-greens',
    description: 'Japanese mustard green with frilly leaves. Very cold-hardy, ideal for Scotland.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [4, 5, 6, 7, 8, 9],
      transplantMonths: [5, 6, 7],
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
        'Extremely frost-hardy - overwinters in Scotland',
        'Mild mustard flavor, great for salads',
        'Fast-growing, harvest as baby leaves or mature',
        'Sow autumn crops for winter harvest'
      ]
    },
    enhancedCompanions: [
      { plantId: 'lettuce', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'spinach', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'radish', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    botanicalName: 'Brassica rapa var. nipposinica',
    hardiness: 'H5',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Brassica_rapa',
    enhancedAvoid: []
  },
  {
    id: 'land-cress',
    storage: {
      methods: ['fridge', 'fresh'],
      freshDays: 4,
      tip: 'Peppery wee leaf best eaten fresh; keep cool and use within days.',
    },
    name: 'Land Cress',
    category: 'leafy-greens',
    description: 'Peppery like watercress but grows in soil. Very hardy.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [3, 4, 5, 8, 9],
      transplantMonths: [],
      harvestMonths: [5, 6, 10, 11, 12, 1, 2, 3],
      daysToHarvest: { min: 50, max: 70 }
    },
    care: {
      sun: 'partial-shade',
      water: 'high',
      spacing: { between: 15, rows: 20 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Tastes like watercress without needing water',
        'Thrives in cooler Scottish temperatures',
        'Harvest outer leaves regularly'
      ]
    },
    enhancedCompanions: [
      { plantId: 'lettuce', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'radish', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Barbarea_verna',
    hardiness: 'H4',
    enhancedAvoid: []
  },
  {
    id: 'corn-salad',
    storage: {
      methods: ['fridge', 'fresh'],
      freshDays: 5,
      tip: 'A hardy winter salad; pick rosettes fresh and keep cool in a sealed bag.',
    },
    name: 'Corn Salad (Lamb\'s Lettuce)',
    category: 'leafy-greens',
    description: 'Hardy winter salad green. Perfect for Scottish winters, survives frost.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [8, 9, 10],
      transplantMonths: [],
      harvestMonths: [11, 12, 1, 2, 3, 4],
      daysToHarvest: { min: 60, max: 80 }
    },
    care: {
      sun: 'partial-shade',
      water: 'moderate',
      spacing: { between: 10, rows: 15 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Sow in late summer for winter harvest',
        'Extremely frost-hardy - survives Scottish winters',
        'Self-seeds readily for continuous supply'
      ]
    },
    enhancedCompanions: [
      { plantId: 'lettuce', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'spinach', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Valerianella_locusta',
    hardiness: 'H6',
    enhancedAvoid: []
  },
  {
    id: 'winter-purslane',
    storage: {
      methods: ['fridge', 'fresh'],
      freshDays: 5,
      tip: 'Succulent winter leaf; eat fresh and keep cool in the salad drawer.',
    },
    name: 'Winter Purslane (Claytonia)',
    category: 'leafy-greens',
    description: 'Succulent winter salad. Thrives in cold wet Scottish conditions.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [8, 9, 10],
      transplantMonths: [],
      harvestMonths: [11, 12, 1, 2, 3, 4, 5],
      daysToHarvest: { min: 50, max: 70 }
    },
    care: {
      sun: 'partial-shade',
      water: 'moderate',
      spacing: { between: 15, rows: 20 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Grows through winter in Scotland',
        'Self-seeds for year-round supply',
        'Mild, slightly lemony flavor'
      ]
    },
    enhancedCompanions: [
      { plantId: 'lettuce', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Claytonia_perfoliata',
    hardiness: 'H6',
    enhancedAvoid: []
  },
  {
    id: 'mustard-greens',
    storage: {
      methods: ['fridge', 'freeze', 'ferment'],
      freshDays: 6,
      tip: 'Eat young leaves fresh; blanch and freeze a glut, or ferment kimchi-style.',
    },
    name: 'Mustard Greens',
    category: 'leafy-greens',
    description: 'Fast-growing spicy greens. Very cold-tolerant for Scottish winters.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [4, 5, 6, 7, 8, 9],
      transplantMonths: [5, 6],
      harvestMonths: [6, 7, 8, 9, 10, 11, 12, 1, 2],
      daysToHarvest: { min: 30, max: 50 }
    },
    care: {
      sun: 'partial-shade',
      water: 'moderate',
      spacing: { between: 20, rows: 25 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Very fast growing - ready in 4-5 weeks',
        'Spicy mustard flavor intensifies in cold',
        'Sow succession crops for continuous harvest',
        'Overwinters well in Scotland'
      ]
    },
    enhancedCompanions: [
      { plantId: 'lettuce', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'spinach', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'radish', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Mustard_greens',
    hardiness: 'H4',
    enhancedAvoid: []
  },
  {
    id: 'watercress',
    storage: {
      methods: ['fridge', 'fresh'],
      freshDays: 3,
      tip: 'Best fresh; stand stems in water or wrap damp in the fridge and use quickly.',
    },
    name: 'Watercress',
    category: 'leafy-greens',
    description: 'Aquatic or marginal plant with peppery leaves. Thrives in Scottish dampness.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [5, 6],
      transplantMonths: [5, 6, 7],
      harvestMonths: [6, 7, 8, 9, 10, 11],
      daysToHarvest: { min: 50, max: 70 }
    },
    care: {
      sun: 'partial-shade',
      water: 'high',
      spacing: { between: 15, rows: 20 },
      depth: 1,
      difficulty: 'intermediate',
      tips: [
        'Needs constant moisture - grow in trays of water',
        'Partial shade prevents bolting',
        'Cut and come again harvesting',
        'Can grow in shallow streams or ponds'
      ]
    },
    enhancedCompanions: [
      { plantId: 'mint', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Watercress',
    hardiness: 'H4',
    enhancedAvoid: []
  },
  {
    id: 'salad-burnet',
    storage: {
      methods: ['fridge', 'fresh'],
      freshDays: 4,
      tip: 'Cucumber-flavoured leaf best fresh; pick young sprigs and keep cool.',
    },
    name: 'Salad Burnet',
    category: 'leafy-greens',
    description: 'Perennial herb with cucumber-flavored leaves. Very hardy for Scottish winters.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [4, 5, 9],
      transplantMonths: [5, 6],
      harvestMonths: [4, 5, 6, 7, 8, 9, 10, 11],
      daysToHarvest: { min: 365, max: 730 }
    },
    care: {
      sun: 'full-sun',
      water: 'low',
      spacing: { between: 30, rows: 30 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Perennial - lasts many years',
        'Cucumber flavor great for salads',
        'Very drought-tolerant once established',
        'Evergreen in mild Scottish winters'
      ]
    },
    enhancedCompanions: [
      { plantId: 'thyme', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'oregano', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Sanguisorba_minor',
    hardiness: 'H4',
    enhancedAvoid: []
  },
  {
    id: 'orache',
    storage: {
      methods: ['fridge', 'freeze'],
      freshDays: 5,
      tip: 'Cook like spinach; use fresh or blanch and freeze a heavy cut.',
    },
    name: 'Orache (Mountain Spinach)',
    category: 'leafy-greens',
    description: 'Colorful spinach substitute. Salt-tolerant and good for Scottish coastal gardens.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [4, 5, 6],
      transplantMonths: [5, 6],
      harvestMonths: [6, 7, 8, 9, 10],
      daysToHarvest: { min: 40, max: 60 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 30, rows: 40 },
      depth: 2,
      difficulty: 'beginner',
      tips: [
        'Red and gold varieties very ornamental',
        'Tolerates salt spray in coastal areas',
        'Pick young leaves before plants bolt',
        'Self-seeds readily for next year'
      ]
    },
    enhancedCompanions: [
      { plantId: 'spinach', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'beetroot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Atriplex_hortensis',
    hardiness: 'H4',
    enhancedAvoid: []
  },
  {
    id: 'new-zealand-spinach',
    storage: {
      methods: ['fridge', 'freeze'],
      freshDays: 6,
      tip: 'Pick tips often; cook like spinach or blanch and freeze a summer glut.',
    },
    name: 'New Zealand Spinach',
    category: 'leafy-greens',
    description: 'Heat-tolerant spinach substitute. Sprawling plant good for Scottish summers.',
    planting: {
      sowIndoorsMonths: [4],
      sowOutdoorsMonths: [5],
      transplantMonths: [5, 6],
      harvestMonths: [7, 8, 9, 10],
      daysToHarvest: { min: 50, max: 70 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 45, rows: 60 },
      depth: 2,
      difficulty: 'beginner',
      tips: [
        'Soak seeds 24 hours before sowing',
        'Sprawling habit - needs space',
        'Pick regularly to encourage branching',
        'More heat-tolerant than true spinach'
      ]
    },
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'pumpkin', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Tetragonia_tetragonioides',
    hardiness: 'H2',
    enhancedAvoid: []
  },
  {
    id: 'good-king-henry',
    storage: {
      methods: ['fridge', 'freeze'],
      freshDays: 6,
      tip: 'Cook the spinach-like leaves fresh, or blanch and freeze a spring glut.',
    },
    name: 'Good King Henry',
    category: 'leafy-greens',
    description: 'Perennial vegetable with spinach-like leaves. Very hardy traditional Scottish plant.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [4, 5],
      transplantMonths: [5, 6, 9],
      harvestMonths: [4, 5, 6, 7, 8, 9],
      daysToHarvest: { min: 365, max: 730 }
    },
    care: {
      sun: 'partial-shade',
      water: 'moderate',
      spacing: { between: 45, rows: 60 },
      depth: 2,
      difficulty: 'beginner',
      tips: [
        'Perennial - harvest for years',
        'Young shoots like asparagus in spring',
        'Leaves like spinach through summer',
        'Native to Britain - very hardy'
      ]
    },
    enhancedCompanions: [
      { plantId: 'rhubarb', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'asparagus', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Blitum_bonus-henricus',
    hardiness: 'H4',
    enhancedAvoid: []
  },
  {
    id: 'radicchio',
    storage: {
      methods: ['fridge', 'fresh'],
      freshDays: 7,
      tip: 'Firm heads keep a week in the fridge; trim the base and use the crisp leaves.',
    },
    name: 'Radicchio',
    category: 'leafy-greens',
    description: 'Italian chicory with burgundy leaves. Very cold-hardy for Scottish winters.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [6, 7, 8],
      transplantMonths: [],
      harvestMonths: [10, 11, 12, 1, 2],
      daysToHarvest: { min: 80, max: 100 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 25, rows: 30 },
      depth: 1,
      difficulty: 'intermediate',
      tips: [
        'Sow mid-summer for autumn/winter harvest',
        'Frost intensifies color and sweetens flavor',
        'Cut whole heads or pick outer leaves',
        'Very ornamental in winter garden'
      ]
    },
    enhancedCompanions: [
      { plantId: 'endive', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'lettuce', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Radicchio',
    hardiness: 'H4',
    enhancedAvoid: []
  },
  {
    id: 'endive',
    storage: {
      methods: ['fridge', 'fresh'],
      freshDays: 6,
      tip: 'Keep heads in the salad drawer; blanching in the plot cuts the bitterness.',
    },
    name: 'Endive',
    category: 'leafy-greens',
    description: 'Bitter salad green for autumn/winter. More cold-tolerant than lettuce.',
    planting: {
      sowIndoorsMonths: [4, 5],
      sowOutdoorsMonths: [6, 7, 8],
      transplantMonths: [6, 7, 8],
      harvestMonths: [9, 10, 11, 12, 1],
      daysToHarvest: { min: 80, max: 100 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 30, rows: 35 },
      depth: 1,
      difficulty: 'intermediate',
      tips: [
        'Blanch hearts 2 weeks before harvest to reduce bitterness',
        'Frost-hardy - continues through Scottish winter',
        'Tie up outer leaves to blanch center',
        'Curly and broad-leaved varieties available'
      ]
    },
    enhancedCompanions: [
      { plantId: 'radicchio', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'lettuce', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Endive',
    hardiness: 'H4',
    enhancedAvoid: []
  },
  {
    id: 'ice-plant',
    storage: {
      methods: ['fridge', 'fresh'],
      freshDays: 4,
      tip: 'Succulent crunchy leaf best eaten fresh; keep cool and use within days.',
    },
    name: 'Ice Plant',
    category: 'leafy-greens',
    description: 'Succulent salad plant with glistening leaves. Drought-tolerant and unusual.',
    planting: {
      sowIndoorsMonths: [4],
      sowOutdoorsMonths: [5, 6],
      transplantMonths: [6],
      harvestMonths: [7, 8, 9, 10],
      daysToHarvest: { min: 60, max: 80 }
    },
    care: {
      sun: 'full-sun',
      water: 'low',
      spacing: { between: 30, rows: 40 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Succulent leaves with salty flavor',
        'Very drought-tolerant once established',
        'Pick tender shoot tips',
        'Good for coastal Scottish gardens'
      ]
    },
    enhancedCompanions: [
      { plantId: 'winter-purslane', confidence: 'traditional', mechanism: 'unknown', bidirectional: false }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Mesembryanthemum_crystallinum',
    hardiness: 'H7',
    enhancedAvoid: []
  },
  {
    id: 'pak-choi',
    storage: {
      methods: ['fridge', 'ferment'],
      freshDays: 5,
      tip: 'Keeps a few days in the fridge; ferment a glut kimchi-style for the winter.',
    },
    name: 'Pak Choi',
    category: 'leafy-greens',
    description: 'Fast-growing Asian green. Thrives in cool Scottish weather - less prone to bolting.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [5, 6, 7, 8],
      transplantMonths: [5, 6, 7],
      harvestMonths: [6, 7, 8, 9, 10],
      daysToHarvest: { min: 30, max: 45 }
    },
    care: {
      sun: 'partial-shade',
      water: 'moderate',
      spacing: { between: 20, rows: 30 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Perfect for Scottish climate - rarely bolts',
        'Sow late summer for autumn harvest',
        'Harvest baby leaves or full heads',
        'Protect from slugs'
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
    botanicalName: 'Brassica rapa subsp. chinensis',
    hardiness: 'H4',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Bok_choy'
  },
  {
    id: 'cavolo-nero',
    storage: {
      methods: ['fresh', 'fridge', 'freeze'],
      freshDays: 5,
      tip: 'Pick leaves from the bottom up as needed; freezes well blanched.',
    },
    name: 'Cavolo Nero (Black Kale)',
    category: 'leafy-greens',
    description: 'Italian black kale. Extremely hardy and improves with frost - perfect for Scotland.',
    planting: {
      sowIndoorsMonths: [3, 4, 5],
      sowOutdoorsMonths: [5, 6, 7],
      transplantMonths: [5, 6, 7, 8],
      harvestMonths: [9, 10, 11, 12, 1, 2, 3, 4],
      daysToHarvest: { min: 60, max: 90 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 45, rows: 60 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'One of the hardiest brassicas',
        'Frost sweetens the leaves',
        'Pick lower leaves first',
        'Can crop through entire Scottish winter'
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
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Kale',
    hardiness: 'H6'
  }
]
