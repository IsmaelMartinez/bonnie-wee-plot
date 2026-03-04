/**
 * Root Vegetables - Vegetable Database
 * Planting times adjusted for Scotland / Edinburgh climate
 */

import { Vegetable } from '@/types/garden-planner'

export const rootVegetables: Vegetable[] = [
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
    rhsUrl: 'https://www.rhs.org.uk/vegetables/carrots/grow-your-own',
    botanicalName: 'Daucus carota',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Daucus_carota'
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
    enhancedCompanions: [
      { plantId: 'onion', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'lettuce', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'runner-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    rhsUrl: 'https://www.rhs.org.uk/vegetables/beetroot/grow-your-own',
    botanicalName: 'Beta vulgaris',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Beetroot'
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
    enhancedCompanions: [
      { plantId: 'onion', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'garlic', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'radish', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'celery', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    rhsUrl: 'https://www.rhs.org.uk/vegetables/parsnips/grow-your-own',
    botanicalName: 'Pastinaca sativa',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Pastinaca_sativa'
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
    enhancedCompanions: [
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'onion', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Tragopogon_porrifolius',
    enhancedAvoid: []
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
    enhancedCompanions: [
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Petroselinum_crispum',
    enhancedAvoid: []
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
    enhancedCompanions: [
      { plantId: 'lettuce', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'peas', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'kohlrabi', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    rhsUrl: 'https://www.rhs.org.uk/vegetables/florence-fennel/grow-your-own',
    botanicalName: 'Foeniculum vulgare var. azoricum',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Fennel'
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
    enhancedCompanions: [
      { plantId: 'lettuce', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'peas', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'nasturtium', confidence: 'traditional', mechanism: 'pest_trap', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Daikon'
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
    enhancedCompanions: [
      { plantId: 'lettuce', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'peas', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'nasturtium', confidence: 'traditional', mechanism: 'pest_trap', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Radish'
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
    enhancedCompanions: [
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'onion', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Scorzonera_hispanica',
    enhancedAvoid: []
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
    enhancedCompanions: [
      { plantId: 'potato', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: false }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Horseradish',
    enhancedAvoid: []
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
    enhancedCompanions: [
      { plantId: 'jerusalem-artichoke', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Stachys_affinis',
    enhancedAvoid: []
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
    enhancedCompanions: [
      { plantId: 'sweetcorn', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Yac%C3%B3n',
    enhancedAvoid: []
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
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'leek', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'parsnip', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    rhsUrl: 'https://www.rhs.org.uk/vegetables/celeriac/grow-your-own',
    botanicalName: 'Apium graveolens var. rapaceum',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Celeriac'
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
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'peas', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Sium_sisarum',
    enhancedAvoid: []
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
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'peas', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Oxalis_tuberosa',
    enhancedAvoid: []
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
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'peas', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Ullucus',
    enhancedAvoid: []
  }
]
