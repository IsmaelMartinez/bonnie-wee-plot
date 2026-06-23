/**
 * Solanaceae (Nightshades) - Vegetable Database
 * Planting times adjusted for Scotland / Edinburgh climate
 */

import { Vegetable } from '@/types/garden-planner'

export const solanaceae: Vegetable[] = [
  {
    id: 'potato',
    storage: {
      methods: ['store-cool'],
      tip: 'Store dry and unwashed in paper or hessian sacks somewhere cool and dark.',
    },
    name: 'Potatoes (Tatties)',
    category: 'solanaceae',
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
    rhsUrl: 'https://www.rhs.org.uk/vegetables/potatoes/grow-your-own',
    botanicalName: 'Solanum tuberosum',
    hardiness: 'H3',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Solanum_tuberosum',
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'likely', mechanism: 'nitrogen_fixation', bidirectional: false },
      { plantId: 'cabbage', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'horseradish', confidence: 'traditional', mechanism: 'disease_suppression', bidirectional: false, source: 'Claimed to deter potato beetles' }
    ],
    enhancedAvoid: [
      { plantId: 'squash', confidence: 'likely', mechanism: 'disease_suppression', bidirectional: true }
    ]
  },
  {
    id: 'early-potato',
    name: 'First Early Potato',
    category: 'solanaceae',
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
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'peas', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'marigold', confidence: 'traditional', mechanism: 'pest_trap', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'sunflower', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Solanum_tuberosum',
    hardiness: 'H3'
  },
  {
    id: 'second-early-potato',
    name: 'Second Early Potato',
    category: 'solanaceae',
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
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'peas', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'marigold', confidence: 'traditional', mechanism: 'pest_trap', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'sunflower', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Solanum_tuberosum',
    hardiness: 'H3'
  },
  {
    id: 'maincrop-potato',
    storage: {
      methods: ['cure', 'store-cool'],
      tip: 'Let the skins set in the ground, dry off, then store in paper sacks in the dark for winter.',
    },
    name: 'Maincrop Potato',
    category: 'solanaceae',
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
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'peas', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'marigold', confidence: 'traditional', mechanism: 'pest_trap', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'sunflower', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Solanum_tuberosum',
    hardiness: 'H3'
  },
  {
    id: 'cherry-tomato',
    storage: {
      methods: ['fresh', 'fridge', 'freeze', 'dry'],
      freshDays: 7,
      tip: 'Glut crop — roast and freeze, semi-dry in a low oven, or cook down into sauce.',
    },
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
    maintenance: {
      feedMonths: [6, 7, 8, 9],
      feedFrequencyDays: 7,
      feedType: 'high-potash',
      notes: ['High-potash tomato feed weekly once the first truss sets']
    },
    enhancedCompanions: [
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'marigold', confidence: 'traditional', mechanism: 'pest_trap', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'potato', confidence: 'proven', mechanism: 'disease_suppression', bidirectional: true, source: 'Both susceptible to late blight (Phytophthora infestans)' }
    ],
    rhsUrl: 'https://www.rhs.org.uk/vegetables/tomatoes/grow-your-own',
    botanicalName: 'Solanum lycopersicum',
    hardiness: 'H2',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Solanum_lycopersicum'
  },
  {
    id: 'plum-tomato',
    storage: {
      methods: ['fresh', 'freeze', 'dry'],
      freshDays: 7,
      tip: 'The best sauce tomato — cook into passata, or roast and freeze the glut.',
    },
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
    maintenance: {
      feedMonths: [6, 7, 8, 9],
      feedFrequencyDays: 7,
      feedType: 'high-potash',
      notes: ['High-potash tomato feed weekly once the first truss sets']
    },
    enhancedCompanions: [
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'marigold', confidence: 'traditional', mechanism: 'pest_trap', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'potato', confidence: 'proven', mechanism: 'disease_suppression', bidirectional: true, source: 'Both susceptible to late blight (Phytophthora infestans)' }
    ],
    rhsUrl: 'https://www.rhs.org.uk/vegetables/tomatoes/grow-your-own',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Solanum_lycopersicum',
    hardiness: 'H2'
  },
  {
    id: 'blight-resistant-tomato',
    storage: {
      methods: ['fresh', 'fridge', 'freeze', 'dry'],
      freshDays: 7,
      tip: 'Glut crop — roast and freeze, semi-dry in a low oven, or cook down into sauce and passata.',
    },
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
    maintenance: {
      feedMonths: [6, 7, 8, 9],
      feedFrequencyDays: 7,
      feedType: 'high-potash',
      notes: ['High-potash tomato feed weekly once the first truss sets']
    },
    enhancedCompanions: [
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'marigold', confidence: 'traditional', mechanism: 'pest_trap', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'potato', confidence: 'proven', mechanism: 'disease_suppression', bidirectional: true, source: 'Both susceptible to late blight (Phytophthora infestans)' }
    ],
    rhsUrl: 'https://www.rhs.org.uk/vegetables/tomatoes/grow-your-own',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Solanum_lycopersicum',
    hardiness: 'H2'
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
    maintenance: {
      feedMonths: [7, 8, 9],
      feedFrequencyDays: 14,
      feedType: 'high-potash',
      notes: ['High-potash feed every 2 weeks once fruits begin to form']
    },
    enhancedCompanions: [
      { plantId: 'marigold', confidence: 'traditional', mechanism: 'pest_trap', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Tomatillo',
    hardiness: 'H2'
  }
]
