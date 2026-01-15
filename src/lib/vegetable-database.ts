/**
 * Comprehensive vegetable database for the Garden Planner
 * Planting times adjusted for Scotland / Edinburgh climate
 * (Last frost ~late April/early May, first frost ~late September/October)
 */

import { Vegetable, VegetableCategory } from '@/types/garden-planner'

export const vegetables: Vegetable[] = [
  // ============ LEAFY GREENS ============
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
    companionPlants: ['Carrot', 'Radish', 'Strawberry', 'Chives'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'radish', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'strawberry', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'chives', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true }
    ],
    rhsUrl: 'https://www.rhs.org.uk/vegetables/lettuce/grow-your-own'
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
    companionPlants: ['Strawberry', 'Peas', 'Beans'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'strawberry', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'peas', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    rhsUrl: 'https://www.rhs.org.uk/vegetables/spinach/grow-your-own'
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
    companionPlants: ['Beans', 'Brassicas', 'Onion'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'onion', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true }
    ]
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
    companionPlants: ['Beetroot', 'Celery', 'Onion', 'Potato'],
    avoidPlants: ['Strawberry', 'Tomato'],
    rhsUrl: 'https://www.rhs.org.uk/vegetables/kale/grow-your-own',
    enhancedCompanions: [
      { plantId: 'beetroot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'celery', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'onion', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true, source: 'Allium scent deters brassica pests' },
      { plantId: 'potato', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'strawberry', confidence: 'traditional', mechanism: 'nutrient_competition', bidirectional: true },
      { plantId: 'tomato', confidence: 'likely', mechanism: 'nutrient_competition', bidirectional: true }
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
    companionPlants: ['Beans', 'Brassicas', 'Onion'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'onion', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true }
    ]
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
    companionPlants: ['French Beans', 'Beetroot', 'Carrot', 'Lettuce'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'french-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'beetroot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'lettuce', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
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
    companionPlants: ['Lettuce', 'Spinach', 'Radish'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'lettuce', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'spinach', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'radish', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
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
    companionPlants: ['Lettuce', 'Radish'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'lettuce', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'radish', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
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
    companionPlants: ['Lettuce', 'Spinach'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'lettuce', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'spinach', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
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
    companionPlants: ['Corn Salad', 'Lettuce'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'lettuce', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
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
    companionPlants: ['Lettuce', 'Spinach', 'Radish'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'lettuce', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'spinach', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'radish', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
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
    companionPlants: ['Mint'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'mint', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true }
    ]
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
    companionPlants: ['Thyme', 'Oregano'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'thyme', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'oregano', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true }
    ]
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
    companionPlants: ['Spinach', 'Chard', 'Beetroot'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'spinach', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'beetroot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
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
    companionPlants: ['Beans', 'Cucurbits'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'pumpkin', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
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
    companionPlants: ['Rhubarb', 'Asparagus'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'rhubarb', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'asparagus', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
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
    companionPlants: ['Endive', 'Lettuce'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'endive', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'lettuce', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
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
    companionPlants: ['Radicchio', 'Lettuce'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'radicchio', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'lettuce', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
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
    companionPlants: ['Winter Purslane'],
    avoidPlants: []
  },

  // ============ ROOT VEGETABLES ============
  {
    id: 'carrot',
    name: 'Carrot',
    category: 'root-vegetables',
    description: 'Sweet root vegetable. Sow later in Scotland after soil warms.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [4, 5, 6, 7],
      transplantMonths: [],
      harvestMonths: [7, 8, 9, 10, 11, 12],
      daysToHarvest: { min: 70, max: 80 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 5, rows: 30 },
      depth: 1,
      difficulty: 'intermediate',
      tips: [
        'Wait until soil warms to 7°C',
        'Cover with fleece against carrot fly',
        'Can leave in ground and harvest through winter'
      ]
    },
    companionPlants: ['Onion', 'Leek', 'Rosemary', 'Sage'],
    avoidPlants: ['Dill', 'Parsnip'],
    enhancedCompanions: [
      { plantId: 'onion', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'leek', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'rosemary', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'sage', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'dill', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'parsnip', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    rhsUrl: 'https://www.rhs.org.uk/vegetables/carrots/grow-your-own'
  },
  {
    id: 'potato',
    name: 'Potatoes (Tatties)',
    category: 'root-vegetables',
    description: 'Scottish staple! Plant after last frost risk around late April.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [4, 5],
      transplantMonths: [],
      harvestMonths: [7, 8, 9, 10],
      daysToHarvest: { min: 70, max: 140 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 30, rows: 60 },
      depth: 15,
      difficulty: 'beginner',
      tips: [
        'Chit from February in a cool light place',
        'Plant after last frost (late April in Edinburgh)',
        'Watch for blight - common in wet Scottish summers'
      ]
    },
    companionPlants: ['Beans', 'Cabbage', 'Horseradish'],
    avoidPlants: ['Tomato', 'Cucumber', 'Squash'],
    rhsUrl: 'https://www.rhs.org.uk/vegetables/potatoes/grow-your-own',
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'likely', mechanism: 'nitrogen_fixation', bidirectional: false },
      { plantId: 'cabbage', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'horseradish', confidence: 'traditional', mechanism: 'disease_suppression', bidirectional: false, source: 'Claimed to deter potato beetles' }
    ],
    enhancedAvoid: [
      { plantId: 'tomato', confidence: 'proven', mechanism: 'disease_suppression', bidirectional: true, source: 'Both susceptible to late blight (Phytophthora infestans)' },
      { plantId: 'cucumber', confidence: 'likely', mechanism: 'disease_suppression', bidirectional: true },
      { plantId: 'squash', confidence: 'likely', mechanism: 'disease_suppression', bidirectional: true }
    ]
  },
  {
    id: 'beetroot',
    name: 'Beetroot',
    category: 'root-vegetables',
    description: 'Versatile root vegetable. Wait for warmer soil in Scotland.',
    planting: {
      sowIndoorsMonths: [4, 5],
      sowOutdoorsMonths: [5, 6, 7],
      transplantMonths: [5, 6],
      harvestMonths: [7, 8, 9, 10, 11],
      daysToHarvest: { min: 50, max: 70 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 10, rows: 30 },
      depth: 2,
      difficulty: 'beginner',
      tips: [
        'Soak seeds before sowing',
        'Bolt-resistant varieties best for Scotland',
        'Harvest young for tender roots'
      ]
    },
    companionPlants: ['Onion', 'Brassicas', 'Lettuce'],
    avoidPlants: ['Runner beans'],
    enhancedCompanions: [
      { plantId: 'onion', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'lettuce', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'runner-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    rhsUrl: 'https://www.rhs.org.uk/vegetables/beetroot/grow-your-own'
  },
  {
    id: 'parsnip',
    name: 'Parsnip',
    category: 'root-vegetables',
    description: 'Sweet winter root. Frost improves flavor - perfect for Scotland!',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [3, 4, 5],
      transplantMonths: [],
      harvestMonths: [10, 11, 12, 1, 2, 3],
      daysToHarvest: { min: 100, max: 130 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 15, rows: 30 },
      depth: 1,
      difficulty: 'intermediate',
      tips: [
        'Use fresh seed each year - viability drops fast',
        'Be patient - can take 4 weeks to germinate',
        'Leave in ground until after frost for sweetest flavor'
      ]
    },
    companionPlants: ['Onion', 'Garlic', 'Radish'],
    avoidPlants: ['Carrot', 'Celery'],
    enhancedCompanions: [
      { plantId: 'onion', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'garlic', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'radish', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'celery', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    rhsUrl: 'https://www.rhs.org.uk/vegetables/parsnips/grow-your-own'
  },
  {
    id: 'swede',
    name: 'Swede (Neeps)',
    category: 'root-vegetables',
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
    companionPlants: ['Peas', 'Beans', 'Onion'],
    avoidPlants: ['Potato', 'Cabbage', 'Broccoli', 'Cauliflower'],
    enhancedCompanions: [
      { plantId: 'peas', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'onion', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'cabbage', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'cauliflower', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },
  {
    id: 'turnip',
    name: 'Turnip',
    category: 'root-vegetables',
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
    companionPlants: ['Peas', 'Beans'],
    avoidPlants: ['Potato'],
    enhancedCompanions: [
      { plantId: 'peas', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },
  {
    id: 'radish',
    name: 'Radish',
    category: 'root-vegetables',
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
    companionPlants: ['Carrot', 'Lettuce', 'Peas', 'Spinach'],
    avoidPlants: ['Hyssop'],
    enhancedCompanions: [
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'lettuce', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'peas', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'spinach', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'hyssop', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },
  {
    id: 'salsify',
    name: 'Salsify',
    category: 'root-vegetables',
    description: 'Oyster-flavored root vegetable. Hardy and underrated!',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [4, 5],
      transplantMonths: [],
      harvestMonths: [10, 11, 12, 1, 2, 3],
      daysToHarvest: { min: 120, max: 150 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 10, rows: 30 },
      depth: 1,
      difficulty: 'intermediate',
      tips: [
        'Subtle oyster-like flavor',
        'Frost improves flavor',
        'Leave in ground through winter'
      ]
    },
    companionPlants: ['Carrot', 'Onion'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'onion', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true }
    ]
  },
  {
    id: 'hamburg-parsley',
    name: 'Hamburg Parsley',
    category: 'root-vegetables',
    description: 'Dual-purpose parsley with edible root. Very hardy for Scottish winters.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [4, 5, 6],
      transplantMonths: [],
      harvestMonths: [10, 11, 12, 1, 2],
      daysToHarvest: { min: 120, max: 150 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 15, rows: 30 },
      depth: 2,
      difficulty: 'beginner',
      tips: [
        'Use leaves like regular parsley',
        'Harvest roots in autumn/winter',
        'Frost improves root flavor'
      ]
    },
    companionPlants: ['Carrot', 'Tomato'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'tomato', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },
  {
    id: 'early-potato',
    name: 'First Early Potato',
    category: 'root-vegetables',
    description: 'Fast-maturing new potatoes. Ready 10-12 weeks after planting, ideal for Scottish climate.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [],
      transplantMonths: [3, 4],
      harvestMonths: [6, 7],
      daysToHarvest: { min: 70, max: 90 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 30, rows: 60 },
      depth: 15,
      difficulty: 'beginner',
      tips: [
        'Chit seed potatoes indoors from February',
        'Plant after last frost in late March/early April',
        'Earth up regularly to prevent greening',
        'Harvest when flowers appear - don\'t wait for foliage to die'
      ]
    },
    companionPlants: ['Beans', 'Brassicas', 'Peas', 'Marigolds'],
    avoidPlants: ['Tomato', 'Cucumber', 'Sunflowers'],
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'peas', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'marigold', confidence: 'traditional', mechanism: 'pest_trap', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'tomato', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'cucumber', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'sunflower', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },
  {
    id: 'second-early-potato',
    name: 'Second Early Potato',
    category: 'root-vegetables',
    description: 'Mid-season potatoes with better yields than first earlies. Harvest July-August.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [],
      transplantMonths: [4],
      harvestMonths: [7, 8],
      daysToHarvest: { min: 100, max: 110 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 35, rows: 60 },
      depth: 15,
      difficulty: 'beginner',
      tips: [
        'Chit from February, plant in April',
        'Good compromise between earlies and maincrops',
        'Less blight risk than maincrops in Scotland',
        'Can leave in ground slightly longer than first earlies'
      ]
    },
    companionPlants: ['Beans', 'Brassicas', 'Peas', 'Marigolds'],
    avoidPlants: ['Tomato', 'Cucumber', 'Sunflowers'],
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'peas', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'marigold', confidence: 'traditional', mechanism: 'pest_trap', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'tomato', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'cucumber', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'sunflower', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },
  {
    id: 'maincrop-potato',
    name: 'Maincrop Potato',
    category: 'root-vegetables',
    description: 'Late season storage potatoes. Higher yields but more blight susceptible in wet Scottish summers.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [],
      transplantMonths: [4, 5],
      harvestMonths: [8, 9, 10],
      daysToHarvest: { min: 120, max: 140 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 40, rows: 75 },
      depth: 15,
      difficulty: 'intermediate',
      tips: [
        'Choose blight-resistant varieties for Scotland',
        'Watch for blight from July onwards',
        'Leave in ground until foliage dies back',
        'Cure harvested tubers before storing'
      ]
    },
    companionPlants: ['Beans', 'Brassicas', 'Peas', 'Marigolds'],
    avoidPlants: ['Tomato', 'Cucumber', 'Sunflowers'],
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'peas', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'marigold', confidence: 'traditional', mechanism: 'pest_trap', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'tomato', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'cucumber', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'sunflower', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },
  {
    id: 'florence-fennel',
    name: 'Florence Fennel',
    category: 'root-vegetables',
    description: 'Anise-flavored swollen stem base. Tricky in Scotland but possible with bolt-resistant varieties.',
    planting: {
      sowIndoorsMonths: [4, 5],
      sowOutdoorsMonths: [6, 7],
      transplantMonths: [6],
      harvestMonths: [8, 9, 10],
      daysToHarvest: { min: 80, max: 100 }
    },
    care: {
      sun: 'full-sun',
      water: 'high',
      spacing: { between: 30, rows: 30 },
      depth: 1,
      difficulty: 'intermediate',
      tips: [
        'Choose bolt-resistant varieties for Scotland',
        'Keep very well watered to prevent bolting',
        'Sow after longest day (June 21) to reduce bolting',
        'Earth up bulbs as they swell for blanching'
      ]
    },
    companionPlants: ['Lettuce', 'Peas', 'Cucumber'],
    avoidPlants: ['Tomato', 'Beans', 'Kohlrabi'],
    enhancedCompanions: [
      { plantId: 'lettuce', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'peas', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'cucumber', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'tomato', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'kohlrabi', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },
  {
    id: 'mooli',
    name: 'Mooli (Daikon)',
    category: 'root-vegetables',
    description: 'Large Asian radish for autumn/winter. Very hardy and good for Scottish climate.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [7, 8, 9],
      transplantMonths: [],
      harvestMonths: [10, 11, 12, 1, 2],
      daysToHarvest: { min: 50, max: 70 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 15, rows: 30 },
      depth: 2,
      difficulty: 'beginner',
      tips: [
        'Sow late summer for autumn/winter harvest',
        'Very frost-hardy - can overwinter in Scotland',
        'Thin seedlings to prevent forking',
        'Mild flavor compared to summer radishes'
      ]
    },
    companionPlants: ['Lettuce', 'Peas', 'Cucumber', 'Nasturtiums'],
    avoidPlants: ['Brassicas'],
    enhancedCompanions: [
      { plantId: 'lettuce', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'peas', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'cucumber', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'nasturtium', confidence: 'traditional', mechanism: 'pest_trap', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },
  {
    id: 'black-radish',
    name: 'Black Radish',
    category: 'root-vegetables',
    description: 'Winter storage radish with black skin. Very hardy for Scottish winters.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [7, 8],
      transplantMonths: [],
      harvestMonths: [10, 11, 12, 1],
      daysToHarvest: { min: 55, max: 70 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 15, rows: 30 },
      depth: 2,
      difficulty: 'beginner',
      tips: [
        'Sow July-August for winter storage',
        'Stores well in damp sand for months',
        'Pungent flavor - grate raw or cook',
        'Very cold-hardy'
      ]
    },
    companionPlants: ['Lettuce', 'Peas', 'Cucumber', 'Nasturtiums'],
    avoidPlants: ['Brassicas'],
    enhancedCompanions: [
      { plantId: 'lettuce', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'peas', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'cucumber', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'nasturtium', confidence: 'traditional', mechanism: 'pest_trap', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },
  {
    id: 'scorzonera',
    name: 'Scorzonera',
    category: 'root-vegetables',
    description: 'Black salsify with delicate flavor. Hardy perennial vegetable ideal for Scotland.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [4, 5],
      transplantMonths: [],
      harvestMonths: [10, 11, 12, 1, 2, 3],
      daysToHarvest: { min: 120, max: 150 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 10, rows: 30 },
      depth: 2,
      difficulty: 'intermediate',
      tips: [
        'Can leave in ground through winter',
        'Harvest as needed - very frost hardy',
        'Peel after cooking to avoid staining hands',
        'Can treat as perennial - leave some to flower'
      ]
    },
    companionPlants: ['Carrot', 'Onion'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'onion', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true }
    ]
  },
  {
    id: 'horseradish',
    name: 'Horseradish',
    category: 'root-vegetables',
    description: 'Perennial root for making pungent condiment. Very vigorous and hardy.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [],
      transplantMonths: [3, 4],
      harvestMonths: [10, 11, 12, 1, 2],
      daysToHarvest: { min: 180, max: 365 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 45, rows: 60 },
      depth: 10,
      difficulty: 'beginner',
      tips: [
        'Plant root cuttings in spring',
        'Extremely vigorous - can be invasive',
        'Grow in containers to control spread',
        'Harvest roots in autumn/winter for best flavor'
      ]
    },
    companionPlants: ['Potato'],
    avoidPlants: []
  },
  {
    id: 'chinese-artichoke',
    name: 'Chinese Artichoke (Crosnes)',
    category: 'root-vegetables',
    description: 'Unusual nutty-flavored tubers. Very hardy perennial for Scottish gardens.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [],
      transplantMonths: [3, 4],
      harvestMonths: [11, 12, 1, 2],
      daysToHarvest: { min: 180, max: 210 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 30, rows: 40 },
      depth: 8,
      difficulty: 'beginner',
      tips: [
        'Plant tubers in spring',
        'Very easy to grow - almost weed-like',
        'Harvest after frost improves flavor',
        'Leave some tubers for next year\'s crop'
      ]
    },
    companionPlants: ['Jerusalem Artichokes'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'jerusalem-artichoke', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },
  {
    id: 'yacon',
    name: 'Yacon',
    category: 'root-vegetables',
    description: 'Sweet crunchy tubers from South America. Frost-tender but grows well in Scottish summers.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [],
      transplantMonths: [5, 6],
      harvestMonths: [10, 11],
      daysToHarvest: { min: 150, max: 180 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 60, rows: 90 },
      depth: 10,
      difficulty: 'intermediate',
      tips: [
        'Start rhizomes indoors, plant out after frost',
        'Tall plant - needs staking in exposed sites',
        'Lift before frost and cure for sweetness',
        'Save crown for replanting next year'
      ]
    },
    companionPlants: ['Sweetcorn'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'sweetcorn', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },

  // ============ BRASSICAS ============
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
    companionPlants: ['Beetroot', 'Celery', 'Onion', 'Potato'],
    avoidPlants: ['Strawberry', 'Tomato'],
    rhsUrl: 'https://www.rhs.org.uk/vegetables/cabbages/grow-your-own',
    enhancedCompanions: [
      { plantId: 'beetroot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'celery', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'onion', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true, source: 'Allium scent deters cabbage pests' },
      { plantId: 'potato', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'strawberry', confidence: 'traditional', mechanism: 'nutrient_competition', bidirectional: true },
      { plantId: 'tomato', confidence: 'likely', mechanism: 'nutrient_competition', bidirectional: true }
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
    companionPlants: ['Beetroot', 'Celery', 'Onion', 'Potato'],
    avoidPlants: ['Strawberry', 'Tomato'],
    rhsUrl: 'https://www.rhs.org.uk/vegetables/broccoli/grow-your-own',
    enhancedCompanions: [
      { plantId: 'beetroot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'celery', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'onion', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true, source: 'Allium scent deters cabbage pests' },
      { plantId: 'potato', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'strawberry', confidence: 'traditional', mechanism: 'nutrient_competition', bidirectional: true },
      { plantId: 'tomato', confidence: 'likely', mechanism: 'nutrient_competition', bidirectional: true }
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
    companionPlants: ['Beetroot', 'Onion', 'Potato'],
    avoidPlants: ['Strawberry', 'Tomato'],
    enhancedCompanions: [
      { plantId: 'beetroot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'onion', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'strawberry', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'tomato', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
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
    companionPlants: ['Beetroot', 'Celery', 'Beans'],
    avoidPlants: ['Strawberry', 'Tomato'],
    enhancedCompanions: [
      { plantId: 'beetroot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'celery', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'strawberry', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'tomato', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    rhsUrl: 'https://www.rhs.org.uk/vegetables/cauliflowers/grow-your-own'
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
    companionPlants: ['Beetroot', 'Carrot', 'Onion'],
    avoidPlants: ['Strawberry', 'Tomato'],
    enhancedCompanions: [
      { plantId: 'beetroot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'onion', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'strawberry', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'tomato', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
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
    companionPlants: ['Beetroot', 'Onion', 'Dill'],
    avoidPlants: ['Strawberry', 'Tomato'],
    enhancedCompanions: [
      { plantId: 'beetroot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'onion', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'dill', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'strawberry', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'tomato', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
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
    companionPlants: ['Beetroot', 'Celery', 'Onion', 'Potato'],
    avoidPlants: ['Strawberry', 'Tomato'],
    enhancedCompanions: [
      { plantId: 'beetroot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'celery', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'onion', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'strawberry', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'tomato', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
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
    companionPlants: ['Beetroot', 'Celery', 'Onion', 'Potato'],
    avoidPlants: ['Strawberry', 'Tomato'],
    enhancedCompanions: [
      { plantId: 'beetroot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'celery', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'onion', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'strawberry', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'tomato', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
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
    companionPlants: ['Beetroot', 'Celery', 'Onion'],
    avoidPlants: ['Strawberry', 'Tomato'],
    enhancedCompanions: [
      { plantId: 'beetroot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'celery', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'onion', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'strawberry', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'tomato', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
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
    companionPlants: ['Beetroot', 'Celery', 'Onion', 'Potato'],
    avoidPlants: ['Strawberry', 'Tomato'],
    enhancedCompanions: [
      { plantId: 'beetroot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'celery', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'onion', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'strawberry', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'tomato', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
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
    companionPlants: ['Peas', 'Beans', 'Onion'],
    avoidPlants: ['Potato'],
    enhancedCompanions: [
      { plantId: 'peas', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'onion', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true }
    ]
  },
  {
    id: 'sea-kale',
    name: 'Sea Kale',
    category: 'brassicas',
    description: 'Native coastal perennial. Blanch shoots for asparagus-like stems.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [],
      transplantMonths: [3, 4, 10],
      harvestMonths: [3, 4, 5],
      daysToHarvest: { min: 730, max: 1095 }
    },
    care: {
      sun: 'full-sun',
      water: 'low',
      spacing: { between: 60, rows: 90 },
      depth: 10,
      difficulty: 'intermediate',
      tips: [
        'Native British coastal plant - very hardy',
        'Perennial - lasts many years',
        'Force shoots in spring with terracotta pot',
        'Blanched shoots harvested like asparagus'
      ]
    },
    companionPlants: ['Asparagus', 'Rhubarb'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'asparagus', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'rhubarb', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
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
    companionPlants: ['Lettuce', 'Spinach', 'Mizuna'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'lettuce', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'spinach', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'mizuna', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },

  // ============ LEGUMES ============
  {
    id: 'runner-beans',
    name: 'Runner Beans',
    category: 'legumes',
    description: 'Prolific climbing bean. Wait until after last frost in late May.',
    planting: {
      sowIndoorsMonths: [5],
      sowOutdoorsMonths: [6],
      transplantMonths: [6],
      harvestMonths: [8, 9, 10],
      daysToHarvest: { min: 60, max: 75 }
    },
    care: {
      sun: 'full-sun',
      water: 'high',
      spacing: { between: 15, rows: 60 },
      depth: 5,
      difficulty: 'beginner',
      tips: [
        'Frost tender - wait until June to plant out',
        'Need sturdy supports for Scottish winds',
        'Pick regularly for more beans'
      ]
    },
    companionPlants: ['Sweetcorn', 'Squash', 'Carrot', 'Cabbage'],
    avoidPlants: ['Onion', 'Garlic', 'Fennel'],
    enhancedCompanions: [
      { plantId: 'sweetcorn', confidence: 'proven', mechanism: 'physical_support', bidirectional: true, source: 'Three Sisters - corn provides support' },
      { plantId: 'squash', confidence: 'proven', mechanism: 'beneficial_attraction', bidirectional: true, source: 'Three Sisters - ground cover suppresses weeds' },
      { plantId: 'carrot', confidence: 'likely', mechanism: 'nitrogen_fixation', bidirectional: false },
      { plantId: 'cabbage', confidence: 'likely', mechanism: 'nitrogen_fixation', bidirectional: false }
    ],
    enhancedAvoid: [
      { plantId: 'onion', confidence: 'likely', mechanism: 'allelopathy', bidirectional: true, source: 'Alliums may inhibit bean growth' },
      { plantId: 'garlic', confidence: 'likely', mechanism: 'allelopathy', bidirectional: true },
      { plantId: 'herb-fennel', confidence: 'proven', mechanism: 'allelopathy', bidirectional: true }
    ]
  },
  {
    id: 'french-beans',
    name: 'French Beans',
    category: 'legumes',
    description: 'Bush or climbing beans. Start indoors in Scotland.',
    planting: {
      sowIndoorsMonths: [5],
      sowOutdoorsMonths: [6],
      transplantMonths: [6],
      harvestMonths: [8, 9, 10],
      daysToHarvest: { min: 55, max: 65 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 10, rows: 45 },
      depth: 5,
      difficulty: 'beginner',
      tips: [
        'Bush varieties need no support',
        'Start indoors for longer harvest window',
        'Harvest when pencil thin'
      ]
    },
    companionPlants: ['Carrot', 'Cucumber', 'Cabbage'],
    avoidPlants: ['Onion', 'Garlic'],
    enhancedCompanions: [
      { plantId: 'carrot', confidence: 'likely', mechanism: 'nitrogen_fixation', bidirectional: true },
      { plantId: 'cucumber', confidence: 'likely', mechanism: 'nitrogen_fixation', bidirectional: true },
      { plantId: 'cabbage', confidence: 'likely', mechanism: 'nitrogen_fixation', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'onion', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'garlic', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },
  {
    id: 'broad-beans',
    name: 'Broad Beans',
    category: 'legumes',
    description: 'Hardy beans - can be autumn sown in Scotland for early crop!',
    planting: {
      sowIndoorsMonths: [2, 3],
      sowOutdoorsMonths: [3, 4, 10, 11],
      transplantMonths: [],
      harvestMonths: [6, 7, 8],
      daysToHarvest: { min: 80, max: 100 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 20, rows: 45 },
      depth: 5,
      difficulty: 'beginner',
      tips: [
        'Autumn sowing gives earlier crop',
        'Very hardy - survives Scottish winters',
        'Pinch out tips when first pods form'
      ]
    },
    companionPlants: ['Brassicas', 'Carrot', 'Celery', 'Potato'],
    avoidPlants: ['Onion', 'Garlic'],
    enhancedCompanions: [
      { plantId: 'cabbage', confidence: 'proven', mechanism: 'nitrogen_fixation', bidirectional: false, source: 'Legumes fix atmospheric nitrogen' },
      { plantId: 'broccoli', confidence: 'proven', mechanism: 'nitrogen_fixation', bidirectional: false },
      { plantId: 'carrot', confidence: 'likely', mechanism: 'nitrogen_fixation', bidirectional: false },
      { plantId: 'celery', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'potato', confidence: 'likely', mechanism: 'nitrogen_fixation', bidirectional: false }
    ],
    enhancedAvoid: [
      { plantId: 'onion', confidence: 'likely', mechanism: 'allelopathy', bidirectional: true },
      { plantId: 'garlic', confidence: 'likely', mechanism: 'allelopathy', bidirectional: true }
    ]
  },
  {
    id: 'peas',
    name: 'Peas',
    category: 'legumes',
    description: 'Sweet garden peas. Cool Scottish summer is perfect for them!',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [4, 5, 6],
      transplantMonths: [5, 6],
      harvestMonths: [6, 7, 8, 9],
      daysToHarvest: { min: 60, max: 80 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 5, rows: 60 },
      depth: 5,
      difficulty: 'beginner',
      tips: [
        'Peas love Scottish weather!',
        'Sow in guttering for easy planting out',
        'Provide support for climbing'
      ]
    },
    companionPlants: ['Carrot', 'Radish', 'Turnip'],
    avoidPlants: ['Onion', 'Garlic'],
    rhsUrl: 'https://www.rhs.org.uk/vegetables/peas/grow-your-own',
    enhancedCompanions: [
      { plantId: 'carrot', confidence: 'likely', mechanism: 'nitrogen_fixation', bidirectional: false },
      { plantId: 'radish', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'turnip', confidence: 'likely', mechanism: 'nitrogen_fixation', bidirectional: false }
    ],
    enhancedAvoid: [
      { plantId: 'onion', confidence: 'likely', mechanism: 'allelopathy', bidirectional: true },
      { plantId: 'garlic', confidence: 'likely', mechanism: 'allelopathy', bidirectional: true }
    ]
  },
  {
    id: 'climbing-french-beans',
    name: 'Climbing French Beans',
    category: 'legumes',
    description: 'Vertical-growing beans with excellent yields. Space-saving and productive.',
    planting: {
      sowIndoorsMonths: [4, 5],
      sowOutdoorsMonths: [5, 6],
      transplantMonths: [5, 6],
      harvestMonths: [7, 8, 9, 10],
      daysToHarvest: { min: 55, max: 75 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 15, rows: 45 },
      depth: 5,
      difficulty: 'beginner',
      tips: [
        'Provide tall supports (2-2.5m)',
        'More productive than bush varieties',
        'Pick regularly to encourage production',
        'Great for small Scottish allotments'
      ]
    },
    companionPlants: ['Sweetcorn', 'Squash', 'Cucumber'],
    avoidPlants: ['Onion', 'Garlic', 'Fennel'],
    enhancedCompanions: [
      { plantId: 'sweetcorn', confidence: 'traditional', mechanism: 'nitrogen_fixation', bidirectional: true },
      { plantId: 'cucumber', confidence: 'traditional', mechanism: 'nitrogen_fixation', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'onion', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'garlic', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },
  {
    id: 'borlotti-beans',
    name: 'Borlotti Beans',
    category: 'legumes',
    description: 'Italian beans for fresh or dried. Beautiful speckled pods.',
    planting: {
      sowIndoorsMonths: [4, 5],
      sowOutdoorsMonths: [5, 6],
      transplantMonths: [5, 6],
      harvestMonths: [8, 9, 10],
      daysToHarvest: { min: 70, max: 90 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 15, rows: 45 },
      depth: 5,
      difficulty: 'beginner',
      tips: [
        'Harvest young for fresh shelling beans',
        'Leave on plant to dry for storage',
        'Beautiful cream and red speckled pods',
        'Climbing variety needs support'
      ]
    },
    companionPlants: ['Sweetcorn', 'Squash', 'Cucumber'],
    avoidPlants: ['Onion', 'Garlic', 'Fennel'],
    enhancedCompanions: [
      { plantId: 'sweetcorn', confidence: 'traditional', mechanism: 'nitrogen_fixation', bidirectional: true },
      { plantId: 'cucumber', confidence: 'traditional', mechanism: 'nitrogen_fixation', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'onion', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'garlic', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },
  {
    id: 'edamame',
    name: 'Edamame (Soy Beans)',
    category: 'legumes',
    description: 'Fresh green soy beans. Protein-rich and increasingly popular.',
    planting: {
      sowIndoorsMonths: [4],
      sowOutdoorsMonths: [5, 6],
      transplantMonths: [5, 6],
      harvestMonths: [8, 9, 10],
      daysToHarvest: { min: 80, max: 100 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 10, rows: 45 },
      depth: 3,
      difficulty: 'intermediate',
      tips: [
        'Choose early varieties for Scotland',
        'Harvest when pods are plump but green',
        'Bush habit - no support needed',
        'Boil whole pods in salted water'
      ]
    },
    companionPlants: ['Sweetcorn', 'Squash'],
    avoidPlants: ['Onion', 'Garlic'],
    enhancedCompanions: [
      { plantId: 'sweetcorn', confidence: 'traditional', mechanism: 'nitrogen_fixation', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'onion', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'garlic', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },
  {
    id: 'mangetout',
    name: 'Mangetout (Snow Peas)',
    category: 'legumes',
    description: 'Flat edible-pod peas. Harvest young before peas develop.',
    planting: {
      sowIndoorsMonths: [2, 3],
      sowOutdoorsMonths: [3, 4, 5],
      transplantMonths: [3, 4],
      harvestMonths: [6, 7, 8, 9],
      daysToHarvest: { min: 60, max: 70 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 5, rows: 60 },
      depth: 5,
      difficulty: 'beginner',
      tips: [
        'Harvest when pods flat - before peas swell',
        'Very productive - pick daily',
        'Ideal for stir-fries',
        'Climbing varieties need support'
      ]
    },
    companionPlants: ['Carrot', 'Radish', 'Turnip'],
    avoidPlants: ['Onion', 'Garlic'],
    enhancedCompanions: [
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'nitrogen_fixation', bidirectional: true },
      { plantId: 'radish', confidence: 'traditional', mechanism: 'nitrogen_fixation', bidirectional: true },
      { plantId: 'turnip', confidence: 'traditional', mechanism: 'nitrogen_fixation', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'onion', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'garlic', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },
  {
    id: 'sugar-snap-peas',
    name: 'Sugar Snap Peas',
    category: 'legumes',
    description: 'Sweet edible-pod peas. Eat pods and peas together.',
    planting: {
      sowIndoorsMonths: [2, 3],
      sowOutdoorsMonths: [3, 4, 5],
      transplantMonths: [3, 4],
      harvestMonths: [6, 7, 8, 9],
      daysToHarvest: { min: 60, max: 75 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 5, rows: 60 },
      depth: 5,
      difficulty: 'beginner',
      tips: [
        'Sweeter than mangetout',
        'Harvest when pods plump and crisp',
        'Excellent fresh or lightly cooked',
        'Provide strong supports'
      ]
    },
    companionPlants: ['Carrot', 'Radish', 'Turnip'],
    avoidPlants: ['Onion', 'Garlic'],
    enhancedCompanions: [
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'nitrogen_fixation', bidirectional: true },
      { plantId: 'radish', confidence: 'traditional', mechanism: 'nitrogen_fixation', bidirectional: true },
      { plantId: 'turnip', confidence: 'traditional', mechanism: 'nitrogen_fixation', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'onion', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'garlic', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },
  {
    id: 'asparagus-peas',
    name: 'Asparagus Peas',
    category: 'legumes',
    description: 'Unusual winged pods with asparagus flavor. Low-growing plant.',
    planting: {
      sowIndoorsMonths: [4],
      sowOutdoorsMonths: [5, 6],
      transplantMonths: [6],
      harvestMonths: [7, 8, 9],
      daysToHarvest: { min: 60, max: 80 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 30, rows: 40 },
      depth: 3,
      difficulty: 'beginner',
      tips: [
        'Harvest pods very young (2-3cm)',
        'Older pods become tough',
        'Beautiful winged pods',
        'Low-growing - no support needed'
      ]
    },
    companionPlants: ['Carrot', 'Radish'],
    avoidPlants: ['Onion'],
    enhancedCompanions: [
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'radish', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'onion', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },
  {
    id: 'black-turtle-beans',
    name: 'Black Turtle Beans',
    category: 'legumes',
    description: 'Drying bean for storage. Excellent for soups and Mexican dishes.',
    planting: {
      sowIndoorsMonths: [4, 5],
      sowOutdoorsMonths: [5, 6],
      transplantMonths: [6],
      harvestMonths: [9, 10],
      daysToHarvest: { min: 90, max: 110 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 15, rows: 45 },
      depth: 5,
      difficulty: 'intermediate',
      tips: [
        'Leave pods on plant until fully dry',
        'Needs warm summer to ripen in Scotland',
        'Store dried beans for winter use',
        'High in protein and fiber'
      ]
    },
    companionPlants: ['Sweetcorn', 'Squash'],
    avoidPlants: ['Onion', 'Garlic'],
    enhancedCompanions: [
      { plantId: 'sweetcorn', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'onion', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'garlic', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },
  {
    id: 'fenugreek',
    name: 'Fenugreek',
    category: 'legumes',
    description: 'Herb and nitrogen-fixing legume. Use leaves fresh, seeds dried.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [4, 5, 6],
      transplantMonths: [],
      harvestMonths: [6, 7, 8, 9],
      daysToHarvest: { min: 40, max: 60 }
    },
    care: {
      sun: 'full-sun',
      water: 'low',
      spacing: { between: 10, rows: 20 },
      depth: 2,
      difficulty: 'beginner',
      tips: [
        'Harvest young leaves for curry dishes',
        'Seeds used in spice blends',
        'Fixes nitrogen in soil',
        'Can use as green manure'
      ]
    },
    companionPlants: ['Vegetables (general)'],
    avoidPlants: []
  },

  // ============ SOLANACEAE ============
  {
    id: 'tomato',
    name: 'Tomato',
    category: 'solanaceae',
    description: 'Best under cover in Scotland. Choose blight-resistant varieties.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [],
      transplantMonths: [6],
      harvestMonths: [8, 9, 10],
      daysToHarvest: { min: 60, max: 85 }
    },
    care: {
      sun: 'full-sun',
      water: 'high',
      spacing: { between: 45, rows: 60 },
      depth: 1,
      difficulty: 'intermediate',
      tips: [
        'Greenhouse or polytunnel recommended',
        'Choose blight-resistant varieties for outdoors',
        'Outdoor bush varieties like Tumbler can work'
      ]
    },
    companionPlants: ['Basil', 'Carrot', 'Marigold'],
    avoidPlants: ['Fennel', 'Brassicas'],
    rhsUrl: 'https://www.rhs.org.uk/vegetables/tomatoes/grow-your-own',
    enhancedCompanions: [
      { plantId: 'basil', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'marigold', confidence: 'likely', mechanism: 'pest_trap', bidirectional: false, source: 'Tagetes spp. nematode suppression' }
    ],
    enhancedAvoid: [
      { plantId: 'herb-fennel', confidence: 'proven', mechanism: 'allelopathy', bidirectional: true, source: 'Fennel allelopathy documented' },
      { plantId: 'cabbage', confidence: 'likely', mechanism: 'nutrient_competition', bidirectional: true },
      { plantId: 'broccoli', confidence: 'likely', mechanism: 'nutrient_competition', bidirectional: true }
    ]
  },
  {
    id: 'cherry-tomato',
    name: 'Cherry Tomato',
    category: 'solanaceae',
    description: 'Small sweet tomatoes. More reliable outdoors in Scotland than large varieties.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [],
      transplantMonths: [5, 6],
      harvestMonths: [7, 8, 9, 10],
      daysToHarvest: { min: 60, max: 80 }
    },
    care: {
      sun: 'full-sun',
      water: 'high',
      spacing: { between: 45, rows: 60 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'More reliable outdoors than beefsteak types',
        'Tumbling varieties good for containers',
        'Sweet flavor loved by children',
        'Less prone to splitting than large tomatoes'
      ]
    },
    companionPlants: ['Basil', 'Carrot', 'Marigolds'],
    avoidPlants: ['Fennel', 'Brassicas'],
    enhancedCompanions: [
      { plantId: 'basil', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'marigold', confidence: 'traditional', mechanism: 'pest_trap', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },
  {
    id: 'beefsteak-tomato',
    name: 'Beefsteak Tomato',
    category: 'solanaceae',
    description: 'Large slicing tomatoes. Best in greenhouse or polytunnel in Scotland.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [],
      transplantMonths: [5, 6],
      harvestMonths: [7, 8, 9, 10],
      daysToHarvest: { min: 80, max: 100 }
    },
    care: {
      sun: 'full-sun',
      water: 'high',
      spacing: { between: 50, rows: 60 },
      depth: 1,
      difficulty: 'intermediate',
      tips: [
        'Need greenhouse or polytunnel in Scotland',
        'Support with strong stakes or strings',
        'Can exceed 500g per fruit',
        'Choose blight-resistant varieties'
      ]
    },
    companionPlants: ['Basil', 'Carrot', 'Marigolds'],
    avoidPlants: ['Fennel', 'Brassicas'],
    enhancedCompanions: [
      { plantId: 'basil', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'marigold', confidence: 'traditional', mechanism: 'pest_trap', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },
  {
    id: 'plum-tomato',
    name: 'Plum Tomato',
    category: 'solanaceae',
    description: 'Oval sauce tomatoes. Excellent for cooking and preserving.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [],
      transplantMonths: [5, 6],
      harvestMonths: [7, 8, 9, 10],
      daysToHarvest: { min: 70, max: 85 }
    },
    care: {
      sun: 'full-sun',
      water: 'high',
      spacing: { between: 45, rows: 60 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Less watery than salad tomatoes',
        'Ideal for sauces and passata',
        'Good yields in Scottish polytunnels',
        'Roma types are classics'
      ]
    },
    companionPlants: ['Basil', 'Carrot', 'Marigolds'],
    avoidPlants: ['Fennel', 'Brassicas'],
    enhancedCompanions: [
      { plantId: 'basil', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'marigold', confidence: 'traditional', mechanism: 'pest_trap', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },
  {
    id: 'blight-resistant-tomato',
    name: 'Blight-Resistant Tomato',
    category: 'solanaceae',
    description: 'Bred for resistance to late blight. Essential for wet Scottish summers.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [],
      transplantMonths: [5, 6],
      harvestMonths: [7, 8, 9, 10],
      daysToHarvest: { min: 70, max: 90 }
    },
    care: {
      sun: 'full-sun',
      water: 'high',
      spacing: { between: 45, rows: 60 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Varieties like Buffalosun, Crimson Crush, Mountain Magic',
        'Can grow outdoors in wet Scottish weather',
        'Still watch for blight, but much more resistant',
        'Game-changer for outdoor tomato growing'
      ]
    },
    companionPlants: ['Basil', 'Carrot', 'Marigolds'],
    avoidPlants: ['Fennel', 'Brassicas'],
    enhancedCompanions: [
      { plantId: 'basil', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'marigold', confidence: 'traditional', mechanism: 'pest_trap', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },
  {
    id: 'tomatillo',
    name: 'Tomatillo',
    category: 'solanaceae',
    description: 'Mexican green tomato in papery husk. Surprisingly viable in Scotland.',
    planting: {
      sowIndoorsMonths: [4],
      sowOutdoorsMonths: [],
      transplantMonths: [5, 6],
      harvestMonths: [8, 9, 10],
      daysToHarvest: { min: 75, max: 100 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 60, rows: 90 },
      depth: 1,
      difficulty: 'intermediate',
      tips: [
        'Plant at least 2 for cross-pollination',
        'Harvest when husks split',
        'Used for salsa verde',
        'Surprisingly hardy for mild Scottish autumns'
      ]
    },
    companionPlants: ['Basil', 'Marigolds'],
    avoidPlants: ['Fennel', 'Brassicas'],
    enhancedCompanions: [
      { plantId: 'basil', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'marigold', confidence: 'traditional', mechanism: 'pest_trap', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },
  {
    id: 'aubergine',
    name: 'Aubergine',
    category: 'solanaceae',
    description: 'Needs warmth and protection in Scotland. Best in greenhouse or polytunnel.',
    planting: {
      sowIndoorsMonths: [2, 3],
      sowOutdoorsMonths: [],
      transplantMonths: [5, 6],
      harvestMonths: [7, 8, 9],
      daysToHarvest: { min: 100, max: 120 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 60, rows: 60 },
      depth: 1,
      difficulty: 'advanced',
      tips: [
        'Requires greenhouse in Scotland',
        'Start early with bottom heat',
        'Pinch out growing tips after 5-6 fruits set',
        'Keep warm - minimum 15°C'
      ]
    },
    companionPlants: ['Pepper', 'Tomato', 'Basil'],
    avoidPlants: ['Fennel'],
    rhsUrl: 'https://www.rhs.org.uk/vegetables/aubergines/grow-your-own',
    enhancedCompanions: [
      { plantId: 'pepper', confidence: 'traditional', mechanism: 'unknown', bidirectional: true, source: 'Same family, similar requirements' },
      { plantId: 'tomato', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'basil', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'herb-fennel', confidence: 'proven', mechanism: 'allelopathy', bidirectional: true }
    ]
  },
  {
    id: 'pepper',
    name: 'Sweet Pepper',
    category: 'solanaceae',
    description: 'Colourful sweet peppers. Require greenhouse or polytunnel in Scotland.',
    planting: {
      sowIndoorsMonths: [2, 3],
      sowOutdoorsMonths: [],
      transplantMonths: [5, 6],
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
        'Needs greenhouse or polytunnel in Scotland',
        'Start early with bottom heat',
        'Pinch out growing tip when 20cm tall',
        'Support plants as fruit develops'
      ]
    },
    companionPlants: ['Tomato', 'Basil', 'Carrot', 'Onion'],
    avoidPlants: ['Fennel', 'Brassicas'],
    rhsUrl: 'https://www.rhs.org.uk/vegetables/peppers-capsicum/grow-your-own',
    enhancedCompanions: [
      { plantId: 'tomato', confidence: 'traditional', mechanism: 'unknown', bidirectional: true, source: 'Same family, similar requirements' },
      { plantId: 'basil', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'onion', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true, source: 'Allium pest deterrence' }
    ],
    enhancedAvoid: [
      { plantId: 'herb-fennel', confidence: 'proven', mechanism: 'allelopathy', bidirectional: true },
      { plantId: 'cabbage', confidence: 'likely', mechanism: 'nutrient_competition', bidirectional: true },
      { plantId: 'broccoli', confidence: 'likely', mechanism: 'nutrient_competition', bidirectional: true }
    ]
  },

  // ============ CUCURBITS ============
  {
    id: 'courgette',
    name: 'Courgettes (Zucchini)',
    category: 'cucurbits',
    description: 'Prolific summer squash. Start indoors and plant out after frost.',
    planting: {
      sowIndoorsMonths: [4, 5],
      sowOutdoorsMonths: [],
      transplantMonths: [6],
      harvestMonths: [7, 8, 9, 10],
      daysToHarvest: { min: 45, max: 60 }
    },
    care: {
      sun: 'full-sun',
      water: 'high',
      spacing: { between: 90, rows: 90 },
      depth: 2,
      difficulty: 'beginner',
      tips: [
        'Frost tender - harden off well',
        'Pick when 10-15cm long',
        'One or two plants is enough!'
      ]
    },
    companionPlants: ['Beans', 'Nasturtiums', 'Radish'],
    avoidPlants: ['Potato'],
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'nasturtium', confidence: 'traditional', mechanism: 'pest_trap', bidirectional: true },
      { plantId: 'radish', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    rhsUrl: 'https://www.rhs.org.uk/vegetables/courgettes/grow-your-own'
  },
  {
    id: 'cucumber',
    name: 'Cucumber',
    category: 'cucurbits',
    description: 'Best under cover in Scotland. Ridge cucumbers hardier outdoors.',
    planting: {
      sowIndoorsMonths: [4, 5],
      sowOutdoorsMonths: [],
      transplantMonths: [6],
      harvestMonths: [7, 8, 9],
      daysToHarvest: { min: 50, max: 70 }
    },
    care: {
      sun: 'full-sun',
      water: 'high',
      spacing: { between: 45, rows: 90 },
      depth: 2,
      difficulty: 'intermediate',
      tips: [
        'Greenhouse cucumbers give best results',
        'Ridge types can grow outdoors with protection',
        'Keep consistently watered'
      ]
    },
    companionPlants: ['Beans', 'Peas', 'Radish'],
    avoidPlants: ['Potato'],
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'peas', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'radish', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    rhsUrl: 'https://www.rhs.org.uk/vegetables/cucumbers/grow-your-own'
  },
  {
    id: 'squash',
    name: 'Winter Squash',
    category: 'cucurbits',
    description: 'Includes butternut, crown prince. Start indoors for Scotland.',
    planting: {
      sowIndoorsMonths: [4, 5],
      sowOutdoorsMonths: [],
      transplantMonths: [6],
      harvestMonths: [9, 10],
      daysToHarvest: { min: 85, max: 110 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 90, rows: 120 },
      depth: 2,
      difficulty: 'beginner',
      tips: [
        'Choose shorter-season varieties (Crown Prince)',
        'Harden off well before planting out',
        'Cure in any late sunshine before storing'
      ]
    },
    companionPlants: ['Sweetcorn', 'Beans', 'Nasturtiums'],
    avoidPlants: ['Potato'],
    enhancedCompanions: [
      { plantId: 'sweetcorn', confidence: 'proven', mechanism: 'physical_support', bidirectional: true, source: 'Three Sisters' },
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'nasturtium', confidence: 'traditional', mechanism: 'pest_trap', bidirectional: true }
    ],
    rhsUrl: 'https://www.rhs.org.uk/vegetables/squash/grow-your-own'
  },
  {
    id: 'pumpkin',
    name: 'Pumpkin',
    category: 'cucurbits',
    description: 'Traditional autumn favourite. Need warm start indoors.',
    planting: {
      sowIndoorsMonths: [4, 5],
      sowOutdoorsMonths: [],
      transplantMonths: [6],
      harvestMonths: [9, 10],
      daysToHarvest: { min: 90, max: 120 }
    },
    care: {
      sun: 'full-sun',
      water: 'high',
      spacing: { between: 120, rows: 180 },
      depth: 2,
      difficulty: 'beginner',
      tips: [
        'Choose smaller varieties for reliability',
        'Need sheltered sunny spot',
        'Cut with stem attached for storage'
      ]
    },
    companionPlants: ['Beans', 'Nasturtiums'],
    avoidPlants: ['Potato'],
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'nasturtium', confidence: 'traditional', mechanism: 'pest_trap', bidirectional: true }
    ],
    rhsUrl: 'https://www.rhs.org.uk/vegetables/pumpkins/grow-your-own'
  },
  {
    id: 'patty-pan-squash',
    name: 'Patty Pan Squash',
    category: 'cucurbits',
    description: 'UFO-shaped summer squash. Compact plants ideal for small Scottish allotments.',
    planting: {
      sowIndoorsMonths: [4, 5],
      sowOutdoorsMonths: [5, 6],
      transplantMonths: [6],
      harvestMonths: [7, 8, 9, 10],
      daysToHarvest: { min: 50, max: 60 }
    },
    care: {
      sun: 'full-sun',
      water: 'high',
      spacing: { between: 90, rows: 120 },
      depth: 2,
      difficulty: 'beginner',
      tips: [
        'Harvest when 5-8cm diameter for best flavor',
        'More compact than courgettes',
        'Beautiful scalloped edges',
        'Yellow, green, or white varieties'
      ]
    },
    companionPlants: ['Beans', 'Nasturtiums', 'Corn'],
    avoidPlants: ['Potato'],
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'nasturtium', confidence: 'traditional', mechanism: 'pest_trap', bidirectional: true },
      { plantId: 'sweetcorn', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },
  {
    id: 'butternut-squash',
    name: 'Butternut Squash',
    category: 'cucurbits',
    description: 'Popular winter squash. Needs long warm season but possible in Scotland.',
    planting: {
      sowIndoorsMonths: [4],
      sowOutdoorsMonths: [],
      transplantMonths: [5, 6],
      harvestMonths: [9, 10],
      daysToHarvest: { min: 95, max: 110 }
    },
    care: {
      sun: 'full-sun',
      water: 'high',
      spacing: { between: 120, rows: 180 },
      depth: 2,
      difficulty: 'intermediate',
      tips: [
        'Choose early varieties for Scotland',
        'Start indoors for best results',
        'Harvest before first frost',
        'Cure for 2 weeks before storage'
      ]
    },
    companionPlants: ['Beans', 'Nasturtiums', 'Corn'],
    avoidPlants: ['Potato'],
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'nasturtium', confidence: 'traditional', mechanism: 'pest_trap', bidirectional: true },
      { plantId: 'sweetcorn', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },
  {
    id: 'spaghetti-squash',
    name: 'Spaghetti Squash',
    category: 'cucurbits',
    description: 'Winter squash with stringy flesh. Unique texture when cooked.',
    planting: {
      sowIndoorsMonths: [4],
      sowOutdoorsMonths: [],
      transplantMonths: [5, 6],
      harvestMonths: [9, 10],
      daysToHarvest: { min: 90, max: 100 }
    },
    care: {
      sun: 'full-sun',
      water: 'high',
      spacing: { between: 120, rows: 180 },
      depth: 2,
      difficulty: 'intermediate',
      tips: [
        'Flesh separates into spaghetti-like strands',
        'Good low-carb pasta substitute',
        'Needs warm sheltered spot in Scotland',
        'Harvest when rind hard to fingernail'
      ]
    },
    companionPlants: ['Beans', 'Nasturtiums', 'Corn'],
    avoidPlants: ['Potato'],
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'nasturtium', confidence: 'traditional', mechanism: 'pest_trap', bidirectional: true },
      { plantId: 'sweetcorn', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },
  {
    id: 'acorn-squash',
    name: 'Acorn Squash',
    category: 'cucurbits',
    description: 'Compact winter squash with ridged shape. More reliable than butternut in Scotland.',
    planting: {
      sowIndoorsMonths: [4],
      sowOutdoorsMonths: [],
      transplantMonths: [5, 6],
      harvestMonths: [9, 10],
      daysToHarvest: { min: 80, max: 100 }
    },
    care: {
      sun: 'full-sun',
      water: 'high',
      spacing: { between: 90, rows: 120 },
      depth: 2,
      difficulty: 'beginner',
      tips: [
        'Earlier maturing than butternut',
        'Smaller plants fit Scottish allotments',
        'Sweet nutty flavor',
        'Good for stuffing and roasting'
      ]
    },
    companionPlants: ['Beans', 'Nasturtiums', 'Corn'],
    avoidPlants: ['Potato'],
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'nasturtium', confidence: 'traditional', mechanism: 'pest_trap', bidirectional: true },
      { plantId: 'sweetcorn', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },
  {
    id: 'outdoor-melon',
    name: 'Outdoor Melon',
    category: 'cucurbits',
    description: 'Fast-maturing melon varieties for Scottish summers. Choose carefully!',
    planting: {
      sowIndoorsMonths: [4],
      sowOutdoorsMonths: [],
      transplantMonths: [6],
      harvestMonths: [8, 9],
      daysToHarvest: { min: 70, max: 90 }
    },
    care: {
      sun: 'full-sun',
      water: 'high',
      spacing: { between: 90, rows: 120 },
      depth: 2,
      difficulty: 'advanced',
      tips: [
        'Only early varieties like Minnesota Midget work',
        'Needs cloche or polytunnel in Scotland',
        'Pinch out at 4 fruits per plant',
        'Harvest when base smells sweet'
      ]
    },
    companionPlants: ['Beans', 'Nasturtiums'],
    avoidPlants: ['Potato'],
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'nasturtium', confidence: 'traditional', mechanism: 'pest_trap', bidirectional: true }
    ]
  },
  {
    id: 'luffa',
    name: 'Ridged Gourd (Luffa)',
    category: 'cucurbits',
    description: 'Edible when young, sponge when mature. Needs long warm season.',
    planting: {
      sowIndoorsMonths: [4],
      sowOutdoorsMonths: [],
      transplantMonths: [6],
      harvestMonths: [8, 9, 10],
      daysToHarvest: { min: 100, max: 120 }
    },
    care: {
      sun: 'full-sun',
      water: 'high',
      spacing: { between: 60, rows: 90 },
      depth: 2,
      difficulty: 'advanced',
      tips: [
        'Harvest young (15-20cm) for eating',
        'Leave to mature for sponges',
        'Needs polytunnel in Scotland',
        'Vigorous climber - provide strong support'
      ]
    },
    companionPlants: ['Beans', 'Corn'],
    avoidPlants: ['Potato'],
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'sweetcorn', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },

  // ============ ALLIUMS ============
  {
    id: 'onion',
    name: 'Onion',
    category: 'alliums',
    description: 'Kitchen essential. Sets easier than seed in Scotland.',
    planting: {
      sowIndoorsMonths: [2, 3],
      sowOutdoorsMonths: [4],
      transplantMonths: [4, 5],
      harvestMonths: [8, 9],
      daysToHarvest: { min: 100, max: 175 }
    },
    care: {
      sun: 'full-sun',
      water: 'low',
      spacing: { between: 10, rows: 30 },
      depth: 2,
      difficulty: 'beginner',
      tips: [
        'Sets are more reliable than seed in Scotland',
        'Japanese sets can be autumn planted',
        'Cure well in any dry weather'
      ]
    },
    companionPlants: ['Carrot', 'Beetroot', 'Lettuce'],
    avoidPlants: ['Beans', 'Peas'],
    rhsUrl: 'https://www.rhs.org.uk/vegetables/onions/grow-your-own',
    enhancedCompanions: [
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true, source: 'Classic pairing - onion scent may deter carrot fly (mixed research)' },
      { plantId: 'beetroot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'lettuce', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'broad-beans', confidence: 'likely', mechanism: 'allelopathy', bidirectional: true },
      { plantId: 'peas', confidence: 'likely', mechanism: 'allelopathy', bidirectional: true },
      { plantId: 'runner-beans', confidence: 'likely', mechanism: 'allelopathy', bidirectional: true }
    ]
  },
  {
    id: 'garlic',
    name: 'Garlic',
    category: 'alliums',
    description: 'Plant in autumn for best bulbs. Needs cold period.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [10, 11, 2, 3],
      transplantMonths: [],
      harvestMonths: [7, 8],
      daysToHarvest: { min: 180, max: 270 }
    },
    care: {
      sun: 'full-sun',
      water: 'low',
      spacing: { between: 15, rows: 30 },
      depth: 5,
      difficulty: 'beginner',
      tips: [
        'Autumn planting essential for best bulbs',
        'Scottish winters provide needed cold',
        'Hardneck varieties most reliable'
      ]
    },
    companionPlants: ['Roses', 'Tomato', 'Beetroot'],
    avoidPlants: ['Beans', 'Peas'],
    rhsUrl: 'https://www.rhs.org.uk/vegetables/garlic/grow-your-own',
    enhancedCompanions: [
      { plantId: 'tomato', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true, source: 'Garlic may deter aphids and spider mites' },
      { plantId: 'beetroot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'broad-beans', confidence: 'likely', mechanism: 'allelopathy', bidirectional: true },
      { plantId: 'peas', confidence: 'likely', mechanism: 'allelopathy', bidirectional: true }
    ]
  },
  {
    id: 'leek',
    name: 'Leek',
    category: 'alliums',
    description: 'Hardy winter vegetable. Excellent for Scottish gardens!',
    planting: {
      sowIndoorsMonths: [2, 3, 4],
      sowOutdoorsMonths: [4, 5],
      transplantMonths: [6, 7],
      harvestMonths: [10, 11, 12, 1, 2, 3, 4],
      daysToHarvest: { min: 120, max: 150 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 15, rows: 30 },
      depth: 15,
      difficulty: 'beginner',
      tips: [
        'Drop seedlings in deep holes for blanched stems',
        'Very hardy - harvest all winter',
        'Musselburgh variety bred for Scottish climate!'
      ]
    },
    companionPlants: ['Carrot', 'Celery', 'Onion'],
    avoidPlants: ['Beans', 'Peas'],
    rhsUrl: 'https://www.rhs.org.uk/vegetables/leeks/grow-your-own',
    enhancedCompanions: [
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true, source: 'Leek scent may deter carrot fly' },
      { plantId: 'celery', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'onion', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'broad-beans', confidence: 'likely', mechanism: 'allelopathy', bidirectional: true },
      { plantId: 'peas', confidence: 'likely', mechanism: 'allelopathy', bidirectional: true }
    ]
  },
  {
    id: 'spring-onion',
    name: 'Spring Onions',
    category: 'alliums',
    description: 'Quick-growing salad onion. Sow successionally.',
    planting: {
      sowIndoorsMonths: [3],
      sowOutdoorsMonths: [4, 5, 6, 7, 8],
      transplantMonths: [],
      harvestMonths: [6, 7, 8, 9, 10],
      daysToHarvest: { min: 60, max: 80 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 2, rows: 15 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Sow every 3 weeks for continuous harvest',
        'Can be grown in containers',
        'White Lisbon is reliable for Scotland'
      ]
    },
    companionPlants: ['Carrot', 'Lettuce'],
    avoidPlants: ['Beans', 'Peas'],
    enhancedCompanions: [
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'lettuce', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'peas', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },
  {
    id: 'shallot',
    name: 'Shallot',
    category: 'alliums',
    description: 'Milder than onions, easier to grow from sets. Good for Scottish climate.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [2, 3, 4, 10, 11],
      transplantMonths: [],
      harvestMonths: [7, 8],
      daysToHarvest: { min: 90, max: 120 }
    },
    care: {
      sun: 'full-sun',
      water: 'low',
      spacing: { between: 15, rows: 30 },
      depth: 2,
      difficulty: 'beginner',
      tips: [
        'Plant sets just below soil surface',
        'Autumn planting gives larger bulbs',
        'Each set produces cluster of 6-12 bulbs',
        'Store well over winter'
      ]
    },
    companionPlants: ['Carrot', 'Beetroot', 'Strawberry'],
    avoidPlants: ['Beans', 'Peas'],
    enhancedCompanions: [
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'beetroot', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'strawberry', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'peas', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },
  {
    id: 'welsh-onion',
    name: 'Welsh Onion',
    category: 'alliums',
    description: 'Perennial bunching onion. Harvest year-round in Scotland.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [4, 5, 6, 7, 8],
      transplantMonths: [5, 6],
      harvestMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      daysToHarvest: { min: 60, max: 365 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 15, rows: 30 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Perennial - lasts many years',
        'Harvest green tops year-round',
        'Very hardy - survives Scottish winters',
        'Also called Japanese bunching onion'
      ]
    },
    companionPlants: ['Carrot', 'Lettuce', 'Tomato'],
    avoidPlants: ['Beans', 'Peas'],
    enhancedCompanions: [
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'lettuce', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'tomato', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'peas', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },
  {
    id: 'elephant-garlic',
    name: 'Elephant Garlic',
    category: 'alliums',
    description: 'Giant mild garlic. Actually closer to leek than true garlic.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [],
      transplantMonths: [10, 11],
      harvestMonths: [6, 7],
      daysToHarvest: { min: 240, max: 270 }
    },
    care: {
      sun: 'full-sun',
      water: 'low',
      spacing: { between: 15, rows: 30 },
      depth: 8,
      difficulty: 'beginner',
      tips: [
        'Plant cloves in autumn',
        'Much larger and milder than regular garlic',
        'Can be 10cm diameter',
        'Very hardy for Scottish winters'
      ]
    },
    companionPlants: ['Roses', 'Fruit trees', 'Tomato'],
    avoidPlants: ['Beans', 'Peas'],
    enhancedCompanions: [
      { plantId: 'tomato', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'peas', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },
  {
    id: 'walking-onion',
    name: 'Walking Onion (Tree Onion)',
    category: 'alliums',
    description: 'Perennial onion with top-setting bulbils. Quirky and productive.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [],
      transplantMonths: [3, 4, 9, 10],
      harvestMonths: [5, 6, 7, 8, 9],
      daysToHarvest: { min: 365, max: 730 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 20, rows: 30 },
      depth: 5,
      difficulty: 'beginner',
      tips: [
        'Produces bulbs at top of stalks',
        'Stalks bend and "walk" planting new bulbs',
        'Perennial - very low maintenance',
        'Harvest bulbils or green tops'
      ]
    },
    companionPlants: ['Carrot', 'Lettuce'],
    avoidPlants: ['Beans', 'Peas'],
    enhancedCompanions: [
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'lettuce', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'peas', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },
  {
    id: 'potato-onion',
    name: 'Potato Onion',
    category: 'alliums',
    description: 'Multiplier onion forming clusters. Heritage variety very hardy.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [],
      transplantMonths: [2, 3, 10],
      harvestMonths: [7, 8],
      daysToHarvest: { min: 120, max: 150 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 15, rows: 30 },
      depth: 5,
      difficulty: 'beginner',
      tips: [
        'Plant one bulb, harvest 5-10',
        'Very hardy heritage variety',
        'Good storage onion',
        'Ideal for Scottish allotments'
      ]
    },
    companionPlants: ['Carrot', 'Lettuce'],
    avoidPlants: ['Beans', 'Peas'],
    enhancedCompanions: [
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'lettuce', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'peas', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },
  {
    id: 'garlic-chives',
    name: 'Garlic Chives',
    category: 'alliums',
    description: 'Flat-leaved chives with garlic flavor. Perennial herb.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [4, 5],
      transplantMonths: [5, 6],
      harvestMonths: [5, 6, 7, 8, 9, 10],
      daysToHarvest: { min: 365, max: 730 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 25, rows: 30 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Perennial - lasts many years',
        'White flowers edible and ornamental',
        'Stronger flavor than regular chives',
        'Cut and come again harvesting'
      ]
    },
    companionPlants: ['Tomato', 'Roses', 'Carrot'],
    avoidPlants: ['Beans', 'Peas'],
    enhancedCompanions: [
      { plantId: 'tomato', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'peas', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },
  {
    id: 'ramps',
    name: 'Ramps (Wild Leeks)',
    category: 'alliums',
    description: 'Woodland perennial leek. Spring ephemeral with garlicky flavor.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [9, 10],
      transplantMonths: [9, 10],
      harvestMonths: [4, 5],
      daysToHarvest: { min: 730, max: 1095 }
    },
    care: {
      sun: 'partial-shade',
      water: 'moderate',
      spacing: { between: 10, rows: 15 },
      depth: 2,
      difficulty: 'intermediate',
      tips: [
        'Needs woodland conditions - shade and leaf mold',
        'Slow to establish - 2-3 years',
        'Harvest sustainably - leaves only',
        'Spring delicacy with intense flavor'
      ]
    },
    companionPlants: ['Woodland plants', 'Ferns'],
    avoidPlants: []
  },

  // ============ HERBS ============
  {
    id: 'basil',
    name: 'Basil',
    category: 'herbs',
    description: 'Aromatic herb, essential for Italian cooking. Best grown under cover in Scotland.',
    planting: {
      sowIndoorsMonths: [3, 4, 5],
      sowOutdoorsMonths: [],
      transplantMonths: [5, 6],
      harvestMonths: [6, 7, 8, 9],
      daysToHarvest: { min: 60, max: 90 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 20, rows: 30 },
      depth: 0.5,
      difficulty: 'intermediate',
      tips: [
        'Grow under cover in Scotland - needs warmth',
        'Pinch out growing tips for bushier plants',
        'Do not let flower if harvesting leaves',
        'Minimum temperature 10°C'
      ]
    },
    companionPlants: ['Tomato', 'Pepper', 'Marigold'],
    avoidPlants: ['Sage', 'Rue'],
    enhancedCompanions: [
      { plantId: 'tomato', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'marigold', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'sage', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },
  {
    id: 'parsley',
    name: 'Parsley',
    category: 'herbs',
    description: 'Versatile hardy herb. Survives Scottish winters.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [5, 6, 7],
      transplantMonths: [5, 6],
      harvestMonths: [6, 7, 8, 9, 10, 11, 12],
      daysToHarvest: { min: 70, max: 90 }
    },
    care: {
      sun: 'partial-shade',
      water: 'moderate',
      spacing: { between: 20, rows: 30 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Slow to germinate - be patient',
        'Can survive mild Scottish winters',
        'Cut outer stems first'
      ]
    },
    companionPlants: ['Tomato', 'Asparagus', 'Roses'],
    avoidPlants: ['Lettuce'],
    enhancedCompanions: [
      { plantId: 'tomato', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'asparagus', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'lettuce', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },
  {
    id: 'coriander',
    name: 'Coriander (Cilantro)',
    category: 'herbs',
    description: 'Fast-growing herb. Less prone to bolting in Scottish climate!',
    planting: {
      sowIndoorsMonths: [4],
      sowOutdoorsMonths: [5, 6, 7, 8],
      transplantMonths: [],
      harvestMonths: [6, 7, 8, 9, 10],
      daysToHarvest: { min: 40, max: 60 }
    },
    care: {
      sun: 'partial-shade',
      water: 'moderate',
      spacing: { between: 15, rows: 20 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Cooler Scottish weather reduces bolting',
        'Sow every 3 weeks for continuous supply',
        'Let some plants set seed for coriander seeds'
      ]
    },
    companionPlants: ['Spinach', 'Tomato', 'Peppers'],
    avoidPlants: ['Fennel'],
    enhancedCompanions: [
      { plantId: 'spinach', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'tomato', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true }
    ]
  },
  {
    id: 'mint',
    name: 'Mint',
    category: 'herbs',
    description: 'Vigorous perennial herb. Very hardy - thrives in Scotland!',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [5, 6],
      transplantMonths: [5, 6, 7],
      harvestMonths: [5, 6, 7, 8, 9, 10],
      daysToHarvest: { min: 60, max: 90 }
    },
    care: {
      sun: 'partial-shade',
      water: 'high',
      spacing: { between: 45, rows: 45 },
      depth: 0.5,
      difficulty: 'beginner',
      tips: [
        'Extremely hardy - loves Scotland',
        'Contain in pots - very invasive',
        'Cut back after flowering'
      ]
    },
    companionPlants: ['Cabbage', 'Tomato', 'Peas'],
    avoidPlants: ['Chamomile', 'Parsley'],
    enhancedCompanions: [
      { plantId: 'cabbage', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'tomato', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'peas', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'chamomile', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'parsley', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },
  {
    id: 'chives',
    name: 'Chives',
    category: 'herbs',
    description: 'Hardy perennial. One of the easiest herbs for Scotland.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [4, 5],
      transplantMonths: [5, 6],
      harvestMonths: [4, 5, 6, 7, 8, 9, 10],
      daysToHarvest: { min: 60, max: 90 }
    },
    care: {
      sun: 'partial-shade',
      water: 'moderate',
      spacing: { between: 20, rows: 30 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Completely hardy - survives any Scottish winter',
        'Divide clumps every few years',
        'Flowers are edible too'
      ]
    },
    companionPlants: ['Carrot', 'Tomato', 'Roses'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'tomato', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true }
    ]
  },
  {
    id: 'rosemary',
    name: 'Rosemary',
    category: 'herbs',
    description: 'Woody perennial herb. Needs sheltered spot in Scotland.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [],
      transplantMonths: [5, 6, 9],
      harvestMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      daysToHarvest: { min: 365, max: 730 }
    },
    care: {
      sun: 'full-sun',
      water: 'low',
      spacing: { between: 60, rows: 60 },
      depth: 0.5,
      difficulty: 'beginner',
      tips: [
        'Needs sheltered spot from cold winds',
        'Good drainage essential',
        'Can struggle in harsh Scottish winters'
      ]
    },
    companionPlants: ['Beans', 'Cabbage', 'Carrot', 'Sage'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'cabbage', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'sage', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true }
    ]
  },
  {
    id: 'thyme',
    name: 'Thyme',
    category: 'herbs',
    description: 'Low-growing perennial herb. Hardy in Scotland.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [5, 6],
      transplantMonths: [5, 6, 9],
      harvestMonths: [5, 6, 7, 8, 9, 10],
      daysToHarvest: { min: 90, max: 180 }
    },
    care: {
      sun: 'full-sun',
      water: 'low',
      spacing: { between: 30, rows: 30 },
      depth: 0.5,
      difficulty: 'beginner',
      tips: [
        'Needs well-drained soil',
        'Hardy enough for Scottish gardens',
        'Trim after flowering'
      ]
    },
    companionPlants: ['Cabbage', 'Tomato', 'Aubergine'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'cabbage', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'tomato', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'aubergine', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true }
    ]
  },
  {
    id: 'lovage',
    name: 'Lovage',
    category: 'herbs',
    description: 'Tall perennial herb with celery flavor. Thrives in Scottish conditions.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [4, 5],
      transplantMonths: [5, 6],
      harvestMonths: [4, 5, 6, 7, 8, 9, 10],
      daysToHarvest: { min: 90, max: 120 }
    },
    care: {
      sun: 'partial-shade',
      water: 'moderate',
      spacing: { between: 60, rows: 60 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Large plant - give plenty of space',
        'Use leaves like celery in soups/stocks',
        'Very hardy perennial for Scotland'
      ]
    },
    companionPlants: ['Most vegetables'],
    avoidPlants: []
  },
  {
    id: 'sorrel',
    name: 'Sorrel',
    category: 'herbs',
    description: 'Tangy perennial leaf. Extremely hardy in Scottish gardens.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [3, 4, 5, 8, 9],
      transplantMonths: [],
      harvestMonths: [3, 4, 5, 6, 7, 8, 9, 10, 11],
      daysToHarvest: { min: 60, max: 90 }
    },
    care: {
      sun: 'partial-shade',
      water: 'moderate',
      spacing: { between: 30, rows: 30 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Lemony tang great in salads',
        'Remove flower heads to encourage leaves',
        'Grows year-round in Scotland'
      ]
    },
    companionPlants: ['Strawberry', 'Chives'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'strawberry', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'chives', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true }
    ]
  },

  // ============ OTHER SCOTTISH FAVORITES ============
  {
    id: 'rhubarb',
    name: 'Rhubarb',
    category: 'root-vegetables',
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
    companionPlants: ['Garlic', 'Onion'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'garlic', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'onion', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true }
    ],
    rhsUrl: 'https://www.rhs.org.uk/vegetables/rhubarb/grow-your-own',
    maintenance: {
      feedMonths: [3],
      mulchMonths: [11],
      notes: ['Force under pot from January for early crop', 'Remove flower stalks immediately']
    }
  },
  {
    id: 'jerusalem-artichoke',
    name: 'Jerusalem Artichoke',
    category: 'root-vegetables',
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
    companionPlants: ['Sweetcorn', 'Sunflowers'],
    avoidPlants: ['Potato'],
    enhancedCompanions: [
      { plantId: 'sweetcorn', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'sunflower', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },
  {
    id: 'oregano',
    name: 'Oregano',
    category: 'herbs',
    description: 'Mediterranean herb. Very hardy perennial for Scottish gardens.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [5],
      transplantMonths: [5, 6],
      harvestMonths: [6, 7, 8, 9, 10],
      daysToHarvest: { min: 80, max: 365 }
    },
    care: {
      sun: 'full-sun',
      water: 'low',
      spacing: { between: 30, rows: 30 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Perennial - lasts many years',
        'Drought-tolerant once established',
        'Flavor intensifies when dried',
        'Cut back after flowering to encourage growth'
      ]
    },
    companionPlants: ['Tomato', 'Peppers', 'Cucurbits'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'tomato', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'pumpkin', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true }
    ]
  },
  {
    id: 'sage',
    name: 'Sage',
    category: 'herbs',
    description: 'Evergreen perennial herb. Very hardy and drought-tolerant.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [5],
      transplantMonths: [5, 6],
      harvestMonths: [5, 6, 7, 8, 9, 10, 11, 12],
      daysToHarvest: { min: 90, max: 365 }
    },
    care: {
      sun: 'full-sun',
      water: 'low',
      spacing: { between: 45, rows: 60 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Very hardy evergreen in Scotland',
        'Purple and variegated varieties available',
        'Prune lightly after flowering',
        'Replace plants every 4-5 years'
      ]
    },
    companionPlants: ['Brassicas', 'Carrot', 'Rosemary'],
    avoidPlants: ['Cucumber'],
    enhancedCompanions: [
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'rosemary', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'cucumber', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },
  {
    id: 'french-tarragon',
    name: 'French Tarragon',
    category: 'herbs',
    description: 'Classic French herb. Must propagate from cuttings, not seed.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [],
      transplantMonths: [4, 5, 9],
      harvestMonths: [5, 6, 7, 8, 9],
      daysToHarvest: { min: 365, max: 730 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 45, rows: 60 },
      depth: 10,
      difficulty: 'intermediate',
      tips: [
        'Buy plants - true French tarragon doesn\'t seed',
        'Dies back in winter',
        'Anise-like flavor essential for béarnaise sauce',
        'Mulch over winter in Scotland'
      ]
    },
    companionPlants: ['Vegetables (general)'],
    avoidPlants: []
  },
  {
    id: 'dill',
    name: 'Dill',
    category: 'herbs',
    description: 'Annual herb with feathery leaves. Self-seeds readily.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [4, 5, 6, 7],
      transplantMonths: [],
      harvestMonths: [6, 7, 8, 9, 10],
      daysToHarvest: { min: 40, max: 60 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 20, rows: 30 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Sow directly - dislikes transplanting',
        'Self-seeds prolifically',
        'Use leaves fresh, seeds dried',
        'Attracts beneficial insects'
      ]
    },
    companionPlants: ['Brassicas', 'Cucumber', 'Lettuce'],
    avoidPlants: ['Carrot', 'Fennel'],
    enhancedCompanions: [
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'cucumber', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'lettuce', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },
  {
    id: 'herb-fennel',
    name: 'Herb Fennel',
    category: 'herbs',
    description: 'Feathery perennial herb. Different from Florence fennel bulb.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [4, 5],
      transplantMonths: [5, 6],
      harvestMonths: [6, 7, 8, 9, 10],
      daysToHarvest: { min: 60, max: 365 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 45, rows: 60 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Perennial - bronze variety very ornamental',
        'Anise flavor for fish dishes',
        'Self-seeds readily',
        'Attracts beneficial insects'
      ]
    },
    companionPlants: [],
    avoidPlants: ['Dill', 'Coriander', 'Tomato'],
    enhancedAvoid: [
      { plantId: 'dill', confidence: 'proven', mechanism: 'allelopathy', bidirectional: true, source: 'Fennel allelopathy' },
      { plantId: 'tomato', confidence: 'proven', mechanism: 'allelopathy', bidirectional: true, source: 'Fennel allelopathy' }
    ]
  },
  {
    id: 'lemon-balm',
    name: 'Lemon Balm',
    category: 'herbs',
    description: 'Lemon-scented perennial herb. Very vigorous and hardy.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [5],
      transplantMonths: [5, 6],
      harvestMonths: [5, 6, 7, 8, 9, 10],
      daysToHarvest: { min: 70, max: 365 }
    },
    care: {
      sun: 'partial-shade',
      water: 'moderate',
      spacing: { between: 45, rows: 60 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Very vigorous - can be invasive',
        'Cut back before flowering to prevent seeding',
        'Lemon scent for teas and desserts',
        'Attracts bees'
      ]
    },
    companionPlants: ['Tomato', 'Basil'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'tomato', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'basil', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true }
    ]
  },
  {
    id: 'marjoram',
    name: 'Marjoram',
    category: 'herbs',
    description: 'Sweet oregano relative. Tender perennial often grown as annual.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [5],
      transplantMonths: [5, 6],
      harvestMonths: [6, 7, 8, 9, 10],
      daysToHarvest: { min: 60, max: 90 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 25, rows: 30 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Sweeter and milder than oregano',
        'Often doesn\'t survive Scottish winters',
        'Grow as annual or protect in winter',
        'Excellent for Italian and Greek dishes'
      ]
    },
    companionPlants: ['Vegetables (general)'],
    avoidPlants: []
  },
  {
    id: 'bay',
    name: 'Bay',
    category: 'herbs',
    description: 'Evergreen shrub with aromatic leaves. Slow-growing but very long-lived.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [],
      transplantMonths: [4, 5, 9],
      harvestMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      daysToHarvest: { min: 730, max: 1825 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 100, rows: 100 },
      depth: 10,
      difficulty: 'beginner',
      tips: [
        'Evergreen shrub or small tree',
        'Grow in large container for flexibility',
        'Very slow-growing',
        'Hardy in most of Scotland'
      ]
    },
    companionPlants: ['Rosemary', 'Thyme'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'rosemary', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'thyme', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true }
    ]
  },
  {
    id: 'borage',
    name: 'Borage',
    category: 'herbs',
    description: 'Annual herb with blue edible flowers. Excellent bee plant.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [4, 5, 6],
      transplantMonths: [],
      harvestMonths: [6, 7, 8, 9, 10],
      daysToHarvest: { min: 50, max: 70 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 30, rows: 40 },
      depth: 2,
      difficulty: 'beginner',
      tips: [
        'Self-seeds prolifically',
        'Edible blue star flowers',
        'Cucumber-flavored leaves',
        'Attracts bees and beneficial insects'
      ]
    },
    companionPlants: ['Tomato', 'Squash', 'Strawberry'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'tomato', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'strawberry', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },
  {
    id: 'chamomile',
    name: 'Chamomile',
    category: 'herbs',
    description: 'Low-growing perennial herb. Used for tea and as lawn alternative.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [4, 5],
      transplantMonths: [5, 6],
      harvestMonths: [6, 7, 8, 9],
      daysToHarvest: { min: 60, max: 90 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 15, rows: 20 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Roman chamomile good for lawns',
        'German chamomile better for tea',
        'Apple-scented flowers',
        'Can tolerate light foot traffic'
      ]
    },
    companionPlants: ['Brassicas', 'Onion'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'onion', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true }
    ]
  },
  {
    id: 'winter-savory',
    name: 'Winter Savory',
    category: 'herbs',
    description: 'Hardy perennial herb. Peppery flavor good with beans.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [5],
      transplantMonths: [5, 6],
      harvestMonths: [6, 7, 8, 9, 10],
      daysToHarvest: { min: 80, max: 365 }
    },
    care: {
      sun: 'full-sun',
      water: 'low',
      spacing: { between: 30, rows: 40 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Very hardy evergreen perennial',
        'Peppery flavor traditional with beans',
        'Drought-tolerant once established',
        'Trim after flowering'
      ]
    },
    companionPlants: ['Beans', 'Onion'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'onion', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true }
    ]
  },
  {
    id: 'hyssop',
    name: 'Hyssop',
    category: 'herbs',
    description: 'Hardy perennial herb with blue flowers. Excellent bee plant.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [5],
      transplantMonths: [5, 6],
      harvestMonths: [6, 7, 8, 9],
      daysToHarvest: { min: 90, max: 365 }
    },
    care: {
      sun: 'full-sun',
      water: 'low',
      spacing: { between: 30, rows: 40 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Very hardy semi-evergreen perennial',
        'Blue, pink, or white flowers',
        'Attracts bees and butterflies',
        'Minty-bitter flavor for teas'
      ]
    },
    companionPlants: ['Brassicas', 'Grapes'],
    avoidPlants: ['Radish'],
    enhancedCompanions: [
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'radish', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },

  // ============ BERRIES ============
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
    companionPlants: ['Lettuce', 'Spinach', 'Beans', 'Borage'],
    avoidPlants: ['Brassicas', 'Fennel'],
    enhancedCompanions: [
      { plantId: 'lettuce', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'spinach', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'borage', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
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
    companionPlants: ['Garlic', 'Tansy', 'Turnip'],
    avoidPlants: ['Blackberries', 'Potato'],
    enhancedCompanions: [
      { plantId: 'garlic', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'tansy', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'turnip', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    maintenance: {
      pruneMonths: [2, 8, 9],
      feedMonths: [3],
      mulchMonths: [3],
      notes: ['Summer types: cut fruited canes after harvest', 'Autumn types: cut all canes to ground in Feb']
    }
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
    companionPlants: ['Tansy', 'Hyssop'],
    avoidPlants: ['Raspberries'],
    enhancedCompanions: [
      { plantId: 'tansy', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'hyssop', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
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
    companionPlants: ['Rhododendrons', 'Azaleas', 'Heathers'],
    avoidPlants: []
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
    companionPlants: ['Tomato', 'Tansy'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'tomato', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'tansy', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    maintenance: {
      pruneMonths: [11, 12, 1, 2],
      feedMonths: [3],
      notes: ['Prune to open goblet shape in winter', 'Watch for sawfly in spring']
    }
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
    companionPlants: ['Wormwood', 'Tansy'],
    avoidPlants: ['Pine trees'],
    enhancedCompanions: [
      { plantId: 'tansy', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    maintenance: {
      pruneMonths: [11, 12],
      feedMonths: [3],
      mulchMonths: [3],
      notes: ['Remove a third of oldest wood each year after fruiting']
    }
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
    companionPlants: ['Tansy', 'Wormwood'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'tansy', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    maintenance: {
      pruneMonths: [11, 12, 1, 2],
      feedMonths: [3],
      notes: ['Prune to open goblet shape like gooseberries']
    }
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
    companionPlants: ['Garlic', 'Alliums'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'garlic', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true }
    ],
    maintenance: {
      pruneMonths: [8, 9],
      feedMonths: [3],
      notes: ['Remove fruited canes after harvest']
    }
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
    companionPlants: ['Garlic', 'Alliums'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'garlic', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true }
    ],
    maintenance: {
      pruneMonths: [8, 9],
      feedMonths: [3],
      notes: ['Remove fruited canes after harvest']
    }
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
    companionPlants: ['Tansy'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'tansy', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    maintenance: {
      pruneMonths: [11, 12, 1, 2],
      feedMonths: [3],
      notes: ['Minimal pruning needed - remove dead wood']
    }
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
    companionPlants: ['Companion honeyberry varieties'],
    avoidPlants: [],
    maintenance: {
      pruneMonths: [11, 12, 1, 2],
      feedMonths: [3],
      notes: ['Minimal pruning - remove dead wood only']
    }
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
    companionPlants: ['Nitrogen fixers'],
    avoidPlants: [],
    maintenance: {
      pruneMonths: [2, 3],
      feedMonths: [3],
      notes: ['Control suckers to prevent spread']
    }
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
    companionPlants: ['Native plants'],
    avoidPlants: [],
    maintenance: {
      pruneMonths: [11, 12, 1, 2],
      feedMonths: [3],
      notes: ['Minimal pruning needed']
    }
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
    companionPlants: ['Native hedgerow plants'],
    avoidPlants: [],
    maintenance: {
      pruneMonths: [11, 12, 1],
      feedMonths: [3],
      notes: ['Prune to maintain size and shape']
    }
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
    companionPlants: ['Nitrogen-loving plants nearby'],
    avoidPlants: [],
    maintenance: {
      pruneMonths: [11, 12, 1],
      feedMonths: [],
      notes: ['Minimal care - very tough plant']
    }
  },

  // ============ FRUIT TREES ============
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
    companionPlants: ['Chives', 'Nasturtiums', 'Garlic'],
    avoidPlants: ['Grass around base', 'Potato'],
    enhancedCompanions: [
      { plantId: 'chives', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'nasturtium', confidence: 'traditional', mechanism: 'pest_trap', bidirectional: true },
      { plantId: 'garlic', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true }
    ],
    maintenance: {
      pruneMonths: [12, 1, 2],
      feedMonths: [3],
      mulchMonths: [11],
      notes: ['Winter prune when dormant', 'Summer prune water shoots in July-Aug']
    }
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
    companionPlants: ['Garlic', 'Chives', 'Marigolds'],
    avoidPlants: ['Grass around base'],
    enhancedCompanions: [
      { plantId: 'garlic', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'chives', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'marigold', confidence: 'traditional', mechanism: 'pest_trap', bidirectional: true }
    ],
    maintenance: {
      pruneMonths: [7, 8],
      feedMonths: [3],
      notes: ['ONLY prune in summer to avoid silver leaf and bacterial canker']
    }
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
    companionPlants: ['Garlic', 'Chives', 'Comfrey'],
    avoidPlants: ['Grass around base'],
    enhancedCompanions: [
      { plantId: 'garlic', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'chives', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'comfrey', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    maintenance: {
      pruneMonths: [2, 3],
      feedMonths: [3],
      notes: ['Minimal pruning needed - just remove dead/crossing branches']
    }
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
    companionPlants: ['Garlic', 'Chives', 'Comfrey'],
    avoidPlants: ['Grass around base'],
    enhancedCompanions: [
      { plantId: 'garlic', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'chives', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'comfrey', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    maintenance: {
      pruneMonths: [6, 7],
      feedMonths: [3],
      notes: ['Prune in summer to avoid silver leaf disease']
    }
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
    companionPlants: ['Garlic', 'Chives', 'Nasturtiums'],
    avoidPlants: ['Grass around base'],
    enhancedCompanions: [
      { plantId: 'garlic', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'chives', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'nasturtium', confidence: 'traditional', mechanism: 'pest_trap', bidirectional: true }
    ],
    maintenance: {
      pruneMonths: [12, 1, 2],
      feedMonths: [3],
      notes: ['Winter prune when dormant', 'May need thinning if heavy crop']
    }
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
    companionPlants: ['Garlic', 'Chives', 'Comfrey'],
    avoidPlants: ['Grass around base'],
    enhancedCompanions: [
      { plantId: 'garlic', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'chives', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'comfrey', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    maintenance: {
      pruneMonths: [6, 7],
      feedMonths: [3],
      notes: ['Prune in summer to avoid silver leaf disease']
    }
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
    companionPlants: ['Garlic', 'Chives', 'Comfrey'],
    avoidPlants: ['Grass around base'],
    enhancedCompanions: [
      { plantId: 'garlic', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'chives', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'comfrey', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    maintenance: {
      pruneMonths: [12, 1, 2],
      feedMonths: [3],
      notes: ['Minimal pruning needed - very low maintenance']
    }
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
    companionPlants: ['Garlic', 'Chives', 'Comfrey'],
    avoidPlants: ['Grass around base'],
    enhancedCompanions: [
      { plantId: 'garlic', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'chives', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'comfrey', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    maintenance: {
      pruneMonths: [12, 1, 2],
      feedMonths: [3],
      notes: ['Minimal pruning - just remove dead/crossing branches']
    }
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
    companionPlants: ['Comfrey', 'Nasturtiums'],
    avoidPlants: ['Grass around base'],
    enhancedCompanions: [
      { plantId: 'comfrey', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'nasturtium', confidence: 'traditional', mechanism: 'pest_trap', bidirectional: true }
    ],
    maintenance: {
      pruneMonths: [3, 4],
      feedMonths: [4, 5],
      notes: ['Prune in early spring', 'May need winter protection in cold areas']
    }
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
    companionPlants: ['Garlic', 'Chives', 'Comfrey'],
    avoidPlants: ['Grass around base'],
    enhancedCompanions: [
      { plantId: 'garlic', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'chives', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'comfrey', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    maintenance: {
      pruneMonths: [12, 1],
      feedMonths: [3],
      notes: ['Minimal pruning needed - bleeds sap if cut in growing season']
    }
  },

  // ============ ADDITIONAL SCOTLAND-FRIENDLY VEGETABLES ============
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
    companionPlants: ['Beetroot', 'Celery', 'Onion'],
    avoidPlants: ['Strawberry'],
    enhancedCompanions: [
      { plantId: 'beetroot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'celery', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'onion', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'strawberry', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
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
    companionPlants: ['Beans', 'Squash', 'Cucumber'],
    avoidPlants: ['Tomato'],
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'cucumber', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'tomato', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    rhsUrl: 'https://www.rhs.org.uk/vegetables/sweetcorn/grow-your-own'
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
    companionPlants: ['Beetroot', 'Celery', 'Onion', 'Potato'],
    avoidPlants: ['Strawberry', 'Tomato'],
    enhancedCompanions: [
      { plantId: 'beetroot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'celery', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'onion', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'strawberry', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'tomato', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },

  // Annual Flowers
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
    companionPlants: ['Tomato', 'Courgettes', 'Beans'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'tomato', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
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
    companionPlants: ['Cucumber', 'Squash', 'Beans'],
    avoidPlants: ['Potato'],
    enhancedCompanions: [
      { plantId: 'cucumber', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
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
    companionPlants: ['Tomato', 'Peppers', 'Cucurbits'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'tomato', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'pumpkin', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
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
    companionPlants: ['Tomato', 'Beans', 'Brassicas', 'Potato'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'tomato', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
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
    companionPlants: ['Tomato', 'Asparagus', 'Lettuce'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'tomato', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'asparagus', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'lettuce', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
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
    companionPlants: ['Brassicas', 'Cucurbits', 'Radish', 'Beans'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'pumpkin', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'radish', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
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
    companionPlants: ['Vegetables (general)', 'Fruit'],
    avoidPlants: []
  },

  // Perennial Flowers
  {
    id: 'lavender',
    name: 'Lavender',
    category: 'perennial-flowers',
    description: 'Aromatic evergreen shrub with purple flower spikes. Excellent bee plant and culinary herb.',
    planting: {
      sowIndoorsMonths: [2, 3],
      sowOutdoorsMonths: [],
      transplantMonths: [5, 6, 9],
      harvestMonths: [6, 7, 8],
      daysToHarvest: { min: 365, max: 730 }
    },
    care: {
      sun: 'full-sun',
      water: 'low',
      spacing: { between: 45, rows: 60 },
      depth: 1,
      difficulty: 'intermediate',
      tips: [
        'Choose hardy varieties for Scotland (Lavandula angustifolia)',
        'Requires well-drained soil - raised beds ideal',
        'Prune after flowering to maintain shape',
        'Attracts bees and deters aphids'
      ]
    },
    companionPlants: ['Brassicas', 'Fruit trees', 'Roses'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true }
    ]
  },
  {
    id: 'echinacea',
    name: 'Echinacea',
    category: 'perennial-flowers',
    description: 'Purple coneflower with medicinal properties. Long-flowering and attracts butterflies.',
    planting: {
      sowIndoorsMonths: [2, 3],
      sowOutdoorsMonths: [5],
      transplantMonths: [5, 6, 9],
      harvestMonths: [7, 8, 9],
      daysToHarvest: { min: 365, max: 730 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 45, rows: 45 },
      depth: 1,
      difficulty: 'intermediate',
      tips: [
        'Very hardy perennial - survives Scottish winters',
        'Flowers from second year onwards',
        'Deadhead to prolong flowering',
        'Leave seed heads for birds in winter'
      ]
    },
    companionPlants: ['Rudbeckia', 'Salvia'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'rudbeckia', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'salvia', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },
  {
    id: 'rudbeckia',
    name: 'Rudbeckia',
    category: 'perennial-flowers',
    description: 'Black-eyed Susan with bright yellow flowers. Tough perennial for late summer color.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [5],
      transplantMonths: [5, 6, 9],
      harvestMonths: [7, 8, 9, 10],
      daysToHarvest: { min: 365, max: 730 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 45, rows: 45 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Very hardy and easy to grow',
        'Flowers from second year onwards',
        'Tolerates clay soil common in Scotland',
        'Spreads slowly to form clumps'
      ]
    },
    companionPlants: ['Echinacea', 'Sedum', 'Grasses'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'echinacea', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'sedum', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },
  {
    id: 'sedum',
    name: 'Sedum',
    category: 'perennial-flowers',
    description: 'Stonecrop with succulent leaves and pink autumn flowers. Extremely hardy and drought-tolerant.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [],
      transplantMonths: [3, 4, 5, 9, 10],
      harvestMonths: [8, 9, 10],
      daysToHarvest: { min: 365, max: 730 }
    },
    care: {
      sun: 'full-sun',
      water: 'low',
      spacing: { between: 45, rows: 45 },
      depth: 5,
      difficulty: 'beginner',
      tips: [
        'Extremely drought-tolerant once established',
        'Flowers in late summer when little else blooms',
        'Attracts butterflies and bees',
        'Leave flower heads through winter for structure'
      ]
    },
    companionPlants: ['Lavender', 'Thyme', 'Rosemary'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'lavender', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'thyme', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'rosemary', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true }
    ]
  },
  {
    id: 'geranium',
    name: 'Hardy Geranium',
    category: 'perennial-flowers',
    description: 'True hardy geranium (not pelargonium). Long-flowering groundcover for borders.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [],
      transplantMonths: [4, 5, 9, 10],
      harvestMonths: [5, 6, 7, 8, 9],
      daysToHarvest: { min: 365, max: 730 }
    },
    care: {
      sun: 'partial-shade',
      water: 'moderate',
      spacing: { between: 40, rows: 40 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Very hardy - perfect for Scottish gardens',
        'Many varieties flower from May to September',
        'Cut back after first flush for second flowering',
        'Good groundcover to suppress weeds'
      ]
    },
    companionPlants: ['Lavender', 'Salvia'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'lavender', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'salvia', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },
  {
    id: 'salvia',
    name: 'Salvia',
    category: 'perennial-flowers',
    description: 'Ornamental sage with spikes of blue or purple flowers. Long flowering season attracts pollinators.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [],
      transplantMonths: [5, 6],
      harvestMonths: [6, 7, 8, 9, 10],
      daysToHarvest: { min: 365, max: 730 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 45, rows: 45 },
      depth: 1,
      difficulty: 'intermediate',
      tips: [
        'Choose hardy varieties for Scotland (S. nemorosa)',
        'Deadhead to prolong flowering',
        'Cut back in spring rather than autumn',
        'Attracts bees throughout summer'
      ]
    },
    companionPlants: ['Lavender', 'Echinacea'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'lavender', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'echinacea', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },

  // Bulbs
  {
    id: 'tulip',
    name: 'Tulip',
    category: 'bulbs',
    description: 'Spring-flowering bulb with vibrant colors. Plant in autumn for spring display.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [],
      transplantMonths: [10, 11],
      harvestMonths: [3, 4, 5],
      daysToHarvest: { min: 120, max: 180 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 10, rows: 15 },
      depth: 15,
      difficulty: 'beginner',
      tips: [
        'Plant bulbs in November for best results',
        'Well-drained soil essential - avoid waterlogging',
        'Lift and dry bulbs after flowering or leave in ground',
        'Deer and rabbit resistant'
      ]
    },
    companionPlants: ['Daffodils', 'Forget-me-nots', 'Wallflowers'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'daffodil', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },
  {
    id: 'daffodil',
    name: 'Daffodil',
    category: 'bulbs',
    description: 'Hardy spring bulb with yellow or white flowers. Naturalizes well and returns year after year.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [],
      transplantMonths: [9, 10, 11],
      harvestMonths: [2, 3, 4],
      daysToHarvest: { min: 120, max: 180 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 10, rows: 15 },
      depth: 15,
      difficulty: 'beginner',
      tips: [
        'Very hardy - perfect for Scottish gardens',
        'Plant early (September) for best results',
        'Allow foliage to die back naturally after flowering',
        'Naturalizes in grass and woodland areas'
      ]
    },
    companionPlants: ['Tulips', 'Crocus', 'Grape hyacinths'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'tulip', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'crocus', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },
  {
    id: 'allium-flower',
    name: 'Ornamental Allium',
    category: 'bulbs',
    description: 'Dramatic spherical flower heads on tall stems. Excellent architectural plant and bee attractor.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [],
      transplantMonths: [9, 10, 11],
      harvestMonths: [5, 6, 7],
      daysToHarvest: { min: 180, max: 240 }
    },
    care: {
      sun: 'full-sun',
      water: 'low',
      spacing: { between: 20, rows: 25 },
      depth: 15,
      difficulty: 'beginner',
      tips: [
        'Plant bulbs in autumn for early summer flowers',
        'Leave seed heads for winter interest',
        'Deer and rabbit resistant',
        'Excellent cut or dried flowers'
      ]
    },
    companionPlants: ['Roses', 'Perennials', 'Grasses'],
    avoidPlants: []
  },
  {
    id: 'crocus',
    name: 'Crocus',
    category: 'bulbs',
    description: 'Early spring bulb with cup-shaped flowers. One of the first flowers to bloom in Scottish gardens.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [],
      transplantMonths: [9, 10],
      harvestMonths: [2, 3, 4],
      daysToHarvest: { min: 90, max: 120 }
    },
    care: {
      sun: 'full-sun',
      water: 'low',
      spacing: { between: 7, rows: 10 },
      depth: 10,
      difficulty: 'beginner',
      tips: [
        'Very early flowering - valuable for early bees',
        'Naturalizes in lawns and under trees',
        'Plant in drifts for best effect',
        'Multiplies over time'
      ]
    },
    companionPlants: ['Snowdrops', 'Daffodils', 'Winter aconites'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'daffodil', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },
  {
    id: 'dahlia',
    name: 'Dahlia',
    category: 'bulbs',
    description: 'Tender tuber with spectacular summer flowers. Lift and store over winter in Scotland.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [],
      transplantMonths: [5, 6],
      harvestMonths: [7, 8, 9, 10],
      daysToHarvest: { min: 90, max: 120 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 45, rows: 60 },
      depth: 10,
      difficulty: 'intermediate',
      tips: [
        'Not frost-hardy - plant after last frost',
        'Lift tubers in autumn and store frost-free',
        'Stake tall varieties to prevent wind damage',
        'Excellent cut flower with long vase life'
      ]
    },
    companionPlants: ['Vegetables (general)', 'Annual flowers'],
    avoidPlants: []
  },

  // Climbers
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
    companionPlants: ['Beans', 'Peas', 'Brassicas'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'peas', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
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
    companionPlants: ['Roses', 'Honeysuckle', 'Climbing vegetables'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'honeysuckle', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
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
    companionPlants: ['Clematis', 'Ivy', 'Native plants'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'clematis', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
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
    companionPlants: ['Beans', 'Cucumber', 'Squash'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'cucumber', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },

  // ============ ADDITIONAL PERENNIAL FLOWERS ============
  {
    id: 'yarrow',
    name: 'Yarrow (Achillea)',
    category: 'perennial-flowers',
    description: 'Hardy medicinal perennial with flat flower heads. Attracts beneficial insects and pollinators.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [5, 9],
      transplantMonths: [5, 6, 9, 10],
      harvestMonths: [6, 7, 8, 9],
      daysToHarvest: { min: 120, max: 180 }
    },
    care: {
      sun: 'full-sun',
      water: 'low',
      spacing: { between: 45, rows: 60 },
      depth: 0.5,
      difficulty: 'beginner',
      tips: [
        'Very drought-tolerant once established',
        'Attracts hoverflies and lacewings',
        'Cut flowers dry well for arrangements',
        'Can be invasive - deadhead to control spread'
      ]
    },
    companionPlants: ['Cabbage', 'Squash'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'cabbage', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },
  {
    id: 'bergamot',
    name: 'Bergamot (Monarda)',
    category: 'perennial-flowers',
    description: 'Bee balm with aromatic leaves and showy flowers. Edible flowers and leaves for tea.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [5],
      transplantMonths: [5, 6],
      harvestMonths: [7, 8, 9],
      daysToHarvest: { min: 90, max: 120 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 45, rows: 60 },
      depth: 0.5,
      difficulty: 'beginner',
      tips: [
        'Bee and butterfly magnet',
        'Edible flowers - use in salads',
        'Aromatic leaves for tea',
        'Can spread - divide every 3 years'
      ]
    },
    companionPlants: ['Tomato', 'Brassicas', 'Squash'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'tomato', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },
  {
    id: 'comfrey',
    name: 'Comfrey',
    category: 'perennial-flowers',
    description: 'Permaculture staple for fertilizer tea and compost activator. Deep roots mine nutrients.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [],
      transplantMonths: [3, 4, 9, 10],
      harvestMonths: [5, 6, 7, 8, 9],
      daysToHarvest: { min: 60, max: 90 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 60, rows: 90 },
      depth: 5,
      difficulty: 'beginner',
      tips: [
        'Bocking 14 variety is best (sterile)',
        'Cut leaves for compost activator',
        'Make liquid feed (comfrey tea)',
        'Deep taproot improves soil structure'
      ]
    },
    companionPlants: ['Tomato', 'Potato', 'Squash'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'tomato', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },
  {
    id: 'tansy',
    name: 'Tansy',
    category: 'perennial-flowers',
    description: 'Historic companion plant with button-like yellow flowers. Natural pest deterrent.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [5],
      transplantMonths: [5, 6],
      harvestMonths: [7, 8, 9],
      daysToHarvest: { min: 120, max: 180 }
    },
    care: {
      sun: 'full-sun',
      water: 'low',
      spacing: { between: 45, rows: 60 },
      depth: 0.5,
      difficulty: 'beginner',
      tips: [
        'Repels ants, flies, and aphids',
        'Very hardy and drought-tolerant',
        'Can be invasive - deadhead flowers',
        'Historically used in companion planting'
      ]
    },
    companionPlants: ['Brassicas', 'Cucumber', 'Squash'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'cucumber', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },
  {
    id: 'nepeta',
    name: 'Nepeta (Catmint)',
    category: 'perennial-flowers',
    description: 'Aromatic pollinator magnet with lavender-like flowers. Very hardy for Scottish gardens.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [5],
      transplantMonths: [5, 6, 9, 10],
      harvestMonths: [6, 7, 8, 9],
      daysToHarvest: { min: 90, max: 120 }
    },
    care: {
      sun: 'full-sun',
      water: 'low',
      spacing: { between: 45, rows: 60 },
      depth: 0.5,
      difficulty: 'beginner',
      tips: [
        'Excellent bee and butterfly plant',
        'Very drought-tolerant',
        'Shear after first flowering for repeat bloom',
        'Deer and rabbit resistant'
      ]
    },
    companionPlants: ['Lavender', 'Salvia'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'lavender', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'salvia', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },
  {
    id: 'agastache',
    name: 'Agastache (Anise Hyssop)',
    category: 'perennial-flowers',
    description: 'Edible flowers and leaves with anise scent. Exceptional pollinator plant.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [5],
      transplantMonths: [5, 6],
      harvestMonths: [7, 8, 9, 10],
      daysToHarvest: { min: 90, max: 120 }
    },
    care: {
      sun: 'full-sun',
      water: 'low',
      spacing: { between: 40, rows: 50 },
      depth: 0.5,
      difficulty: 'beginner',
      tips: [
        'Edible flowers and leaves',
        'Bee and hummingbird favorite',
        'Anise-mint flavor for tea',
        'Very hardy in Scottish conditions'
      ]
    },
    companionPlants: ['Tomato', 'Peppers', 'Squash'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'tomato', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },

  // ============ ADDITIONAL ANNUAL FLOWERS ============
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
    companionPlants: ['Brassicas', 'Potato', 'Lettuce'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'lettuce', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
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
    companionPlants: ['Tomato', 'Squash', 'Brassicas'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'tomato', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
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
    companionPlants: ['Tomato', 'Squash', 'Beans'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'tomato', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
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
    companionPlants: ['Carrot', 'Onion', 'Calendula'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'onion', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'calendula', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
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
    companionPlants: ['Cornflower', 'Calendula'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'cornflower', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'calendula', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },

  // ============ ADDITIONAL CLIMBERS ============
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
    companionPlants: ['Grapes', 'Beans'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
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
    companionPlants: ['Comfrey', 'Nasturtiums'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'comfrey', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'nasturtium', confidence: 'traditional', mechanism: 'pest_trap', bidirectional: true }
    ]
  },

  // ============ ADDITIONAL SPECIALTY VEGETABLES ============
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
    companionPlants: ['Tomato', 'Parsley', 'Basil'],
    avoidPlants: ['Onion', 'Garlic'],
    enhancedCompanions: [
      { plantId: 'tomato', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'parsley', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'basil', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'onion', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'garlic', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    rhsUrl: 'https://www.rhs.org.uk/vegetables/asparagus/grow-your-own',
    maintenance: {
      feedMonths: [3],
      mulchMonths: [11],
      notes: ['Cut down ferns in autumn', 'Weed regularly']
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
    companionPlants: ['Sunflowers', 'Tarragon'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'sunflower', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'french-tarragon', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    maintenance: {
      feedMonths: [3, 5],
      mulchMonths: [11],
      notes: ['Protect crowns with straw in winter']
    }
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
    companionPlants: ['Beans', 'Tomato', 'Brassicas'],
    avoidPlants: ['Parsnip', 'Carrot'],
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'tomato', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'parsnip', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },
  {
    id: 'celeriac',
    name: 'Celeriac',
    category: 'root-vegetables',
    description: 'Celery-flavored root vegetable. Easier than celery to grow.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [],
      transplantMonths: [5, 6],
      harvestMonths: [10, 11, 12, 1, 2],
      daysToHarvest: { min: 180, max: 210 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 30, rows: 40 },
      depth: 1,
      difficulty: 'intermediate',
      tips: [
        'Much easier than celery',
        'Frost improves flavor',
        'Remove lower leaves as root swells',
        'Very hardy - can overwinter'
      ]
    },
    companionPlants: ['Beans', 'Leek', 'Tomato'],
    avoidPlants: ['Parsnip', 'Carrot'],
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'leek', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'tomato', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'parsnip', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
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
    companionPlants: ['Artichokes', 'Sunflowers'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'globe-artichoke', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'sunflower', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },
  {
    id: 'skirret',
    name: 'Skirret',
    category: 'root-vegetables',
    description: 'Medieval root vegetable with sweet parsnip-like roots. Very hardy.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [5],
      transplantMonths: [5, 6],
      harvestMonths: [10, 11, 12, 1, 2],
      daysToHarvest: { min: 120, max: 180 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 20, rows: 30 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Sweet nutty flavor like parsnip',
        'Very hardy - improves with frost',
        'Can be left in ground all winter',
        'Historic vegetable making comeback'
      ]
    },
    companionPlants: ['Beans', 'Peas'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'peas', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
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
    companionPlants: ['Beetroot', 'Onion'],
    avoidPlants: ['Strawberry'],
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
    }
  },
  {
    id: 'oca',
    name: 'Oca',
    category: 'root-vegetables',
    description: 'Andean tuber with lemony flavor. Cold-hardy potato alternative.',
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
      spacing: { between: 30, rows: 40 },
      depth: 5,
      difficulty: 'intermediate',
      tips: [
        'Late harvest - needs long season',
        'Lemony flavor, colorful tubers',
        'Protect from early frosts',
        'Easier to grow than potatoes (no blight)'
      ]
    },
    companionPlants: ['Beans', 'Peas'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'peas', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
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
    companionPlants: ['Beans', 'Squash'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },
  {
    id: 'ulluco',
    name: 'Ulluco',
    category: 'root-vegetables',
    description: 'Andean tuber with waxy texture. Colorful tubers and edible leaves.',
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
      spacing: { between: 30, rows: 40 },
      depth: 5,
      difficulty: 'intermediate',
      tips: [
        'Waxy texture holds shape when cooked',
        'Colorful pink/yellow tubers',
        'Leaves edible like spinach',
        'Late harvest - needs long season'
      ]
    },
    companionPlants: ['Beans', 'Peas'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'peas', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },
  {
    id: 'ground-nut',
    name: 'Ground Nut (Apios)',
    category: 'legumes',
    description: 'Native American climbing legume with edible tubers. Nitrogen-fixing.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [],
      transplantMonths: [4, 5],
      harvestMonths: [10, 11],
      daysToHarvest: { min: 120, max: 180 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 45, rows: 60 },
      depth: 5,
      difficulty: 'intermediate',
      tips: [
        'Climbing vine - provide support',
        'Fixes nitrogen like beans',
        'Tubers taste like potatoes',
        'Hardy perennial in UK'
      ]
    },
    companionPlants: ['Corn', 'Squash'],
    avoidPlants: [],
    enhancedCompanions: [
      { plantId: 'sweetcorn', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ]
  },

  // ============ MUSHROOMS ============
  {
    id: 'oyster-mushroom',
    name: 'Oyster Mushroom',
    category: 'mushrooms',
    description: 'Easy-to-grow gourmet mushroom. Grows on straw or coffee grounds indoors or outdoors.',
    planting: {
      sowIndoorsMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      sowOutdoorsMonths: [4, 5, 6, 7, 8, 9],
      transplantMonths: [],
      harvestMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      daysToHarvest: { min: 7, max: 21 }
    },
    care: {
      sun: 'shade',
      water: 'high',
      spacing: { between: 0, rows: 0 },
      depth: 0,
      difficulty: 'beginner',
      tips: [
        'Easiest mushroom for beginners',
        'Grows on straw, coffee grounds, or sawdust',
        'Can fruit multiple times (flushes)',
        'Keep substrate moist and humid'
      ]
    },
    companionPlants: [],
    avoidPlants: []
  },
  {
    id: 'shiitake',
    name: 'Shiitake',
    category: 'mushrooms',
    description: 'Premium medicinal mushroom. Grows on hardwood logs or sawdust blocks.',
    planting: {
      sowIndoorsMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      sowOutdoorsMonths: [3, 4, 5, 6, 7, 8],
      transplantMonths: [],
      harvestMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      daysToHarvest: { min: 90, max: 180 }
    },
    care: {
      sun: 'shade',
      water: 'moderate',
      spacing: { between: 0, rows: 0 },
      depth: 0,
      difficulty: 'intermediate',
      tips: [
        'Grows best on oak, beech, or birch logs',
        'Logs can produce for 4-6 years',
        'Needs cool shock to trigger fruiting',
        'High medicinal value'
      ]
    },
    companionPlants: [],
    avoidPlants: []
  },
  {
    id: 'lions-mane',
    name: "Lion's Mane",
    category: 'mushrooms',
    description: 'Unusual white cascading mushroom. Medicinal benefits for brain health.',
    planting: {
      sowIndoorsMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      sowOutdoorsMonths: [4, 5, 6, 7, 8],
      transplantMonths: [],
      harvestMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      daysToHarvest: { min: 14, max: 21 }
    },
    care: {
      sun: 'shade',
      water: 'high',
      spacing: { between: 0, rows: 0 },
      depth: 0,
      difficulty: 'intermediate',
      tips: [
        'Striking white cascading appearance',
        'Known for cognitive health benefits',
        'Grows on hardwood sawdust',
        'Needs high humidity (90%+)'
      ]
    },
    companionPlants: [],
    avoidPlants: []
  },
  {
    id: 'king-oyster',
    name: 'King Oyster',
    category: 'mushrooms',
    description: 'Large meaty mushroom with thick stem. Excellent texture for cooking.',
    planting: {
      sowIndoorsMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      sowOutdoorsMonths: [],
      transplantMonths: [],
      harvestMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      daysToHarvest: { min: 10, max: 21 }
    },
    care: {
      sun: 'shade',
      water: 'high',
      spacing: { between: 0, rows: 0 },
      depth: 0,
      difficulty: 'intermediate',
      tips: [
        'Thick meaty stem with small cap',
        'Excellent meat substitute texture',
        'Needs cooler temperatures (10-15°C)',
        'Grows indoors year-round'
      ]
    },
    companionPlants: [],
    avoidPlants: []
  },
  {
    id: 'button-mushroom',
    name: 'Button Mushroom',
    category: 'mushrooms',
    description: 'Classic white mushroom. Grows on composted manure substrate.',
    planting: {
      sowIndoorsMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      sowOutdoorsMonths: [],
      transplantMonths: [],
      harvestMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      daysToHarvest: { min: 21, max: 35 }
    },
    care: {
      sun: 'shade',
      water: 'high',
      spacing: { between: 0, rows: 0 },
      depth: 0,
      difficulty: 'advanced',
      tips: [
        'Needs specific composted manure substrate',
        'Requires pasteurization of substrate',
        'Controlled temperature critical (15-18°C)',
        'Most challenging for home growers'
      ]
    },
    companionPlants: [],
    avoidPlants: []
  },

  // ============ GREEN MANURES ============
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
    companionPlants: [],
    avoidPlants: []
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
    companionPlants: [],
    avoidPlants: []
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
    companionPlants: [],
    avoidPlants: []
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
    companionPlants: [],
    avoidPlants: []
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
    companionPlants: [],
    avoidPlants: []
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
    companionPlants: [],
    avoidPlants: []
  }
]

// Helper functions for working with vegetable data
export function getVegetableById(id: string): Vegetable | undefined {
  return vegetables.find(v => v.id === id)
}

export function getVegetablesByCategory(category: VegetableCategory): Vegetable[] {
  return vegetables.filter(v => v.category === category)
}

export function searchVegetables(query: string): Vegetable[] {
  const lowerQuery = query.toLowerCase()
  return vegetables.filter(v => 
    v.name.toLowerCase().includes(lowerQuery) ||
    v.description.toLowerCase().includes(lowerQuery)
  )
}

export function getVegetablesForMonth(month: number, type: 'sow' | 'harvest'): Vegetable[] {
  return vegetables.filter(v => {
    if (type === 'sow') {
      return v.planting.sowOutdoorsMonths.includes(month as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12) ||
             v.planting.sowIndoorsMonths.includes(month as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12)
    }
    return v.planting.harvestMonths.includes(month as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12)
  })
}

export function getAllCategories(): VegetableCategory[] {
  return [...new Set(vegetables.map(v => v.category))]
}

// ============ MAINTENANCE HELPERS ============

export type MaintenanceType = 'prune' | 'feed' | 'mulch'

export interface MaintenanceTask {
  vegetable: Vegetable
  type: MaintenanceType
  notes?: string[]
}

/**
 * Get all vegetables with maintenance tasks for a given month
 */
export function getMaintenanceForMonth(month: number): MaintenanceTask[] {
  const tasks: MaintenanceTask[] = []
  const m = month as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
  
  vegetables.forEach(v => {
    if (!v.maintenance) return
    
    if (v.maintenance.pruneMonths?.includes(m)) {
      tasks.push({ vegetable: v, type: 'prune', notes: v.maintenance.notes })
    }
    if (v.maintenance.feedMonths?.includes(m)) {
      tasks.push({ vegetable: v, type: 'feed', notes: v.maintenance.notes })
    }
    if (v.maintenance.mulchMonths?.includes(m)) {
      tasks.push({ vegetable: v, type: 'mulch', notes: v.maintenance.notes })
    }
  })
  
  return tasks
}

/**
 * Get all vegetables with any maintenance data (trees, shrubs, perennials)
 */
export function getPerennialsWithMaintenance(): Vegetable[] {
  return vegetables.filter(v => v.maintenance !== undefined)
}
