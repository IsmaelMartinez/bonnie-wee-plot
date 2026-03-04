/**
 * Leafy Greens - Vegetable Database
 * Planting times adjusted for Scotland / Edinburgh climate
 */

import { Vegetable } from '@/types/garden-planner'

export const leafyGreens: Vegetable[] = [
  {
    id: 'lettuce',
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
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Lactuca_sativa',
    enhancedAvoid: []
  },
  {
    id: 'spinach',
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
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Spinacia_oleracea',
    enhancedAvoid: []
  },
  {
    id: 'perpetual-spinach',
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
    enhancedAvoid: []
  },
  {
    id: 'kale',
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
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Chard',
    enhancedAvoid: []
  },
  {
    id: 'rocket',
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
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Eruca_vesicaria',
    enhancedAvoid: []
  },
  {
    id: 'mizuna',
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
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Brassica_rapa',
    enhancedAvoid: []
  },
  {
    id: 'land-cress',
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
    enhancedAvoid: []
  },
  {
    id: 'corn-salad',
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
    enhancedAvoid: []
  },
  {
    id: 'winter-purslane',
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
    enhancedAvoid: []
  },
  {
    id: 'mustard-greens',
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
    enhancedAvoid: []
  },
  {
    id: 'watercress',
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
    enhancedAvoid: []
  },
  {
    id: 'salad-burnet',
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
    enhancedAvoid: []
  },
  {
    id: 'orache',
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
    enhancedAvoid: []
  },
  {
    id: 'new-zealand-spinach',
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
    enhancedAvoid: []
  },
  {
    id: 'good-king-henry',
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
    enhancedAvoid: []
  },
  {
    id: 'radicchio',
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
    enhancedAvoid: []
  },
  {
    id: 'endive',
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
    enhancedAvoid: []
  },
  {
    id: 'ice-plant',
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
    enhancedAvoid: []
  },
  {
    id: 'pak-choi',
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
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Bok_choy'
  },
  {
    id: 'cavolo-nero',
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
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Kale'
  }
]
