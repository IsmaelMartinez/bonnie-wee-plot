/**
 * Legumes - Vegetable Database
 * Planting times adjusted for Scotland / Edinburgh climate
 */

import { Vegetable } from '@/types/garden-planner'

export const legumes: Vegetable[] = [
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
    ],
    rhsUrl: 'https://www.rhs.org.uk/vegetables/runner-beans/grow-your-own',
    botanicalName: 'Phaseolus coccineus',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Phaseolus_coccineus'
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
    enhancedCompanions: [
      { plantId: 'carrot', confidence: 'likely', mechanism: 'nitrogen_fixation', bidirectional: true },
      { plantId: 'cabbage', confidence: 'likely', mechanism: 'nitrogen_fixation', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'onion', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'garlic', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    rhsUrl: 'https://www.rhs.org.uk/vegetables/french-beans/grow-your-own',
    botanicalName: 'Phaseolus vulgaris',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Phaseolus_vulgaris'
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
    ],
    rhsUrl: 'https://www.rhs.org.uk/vegetables/broad-beans/grow-your-own',
    botanicalName: 'Vicia faba',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Vicia_faba'
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
    rhsUrl: 'https://www.rhs.org.uk/vegetables/peas/grow-your-own',
    botanicalName: 'Pisum sativum',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Pisum_sativum',
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
    enhancedCompanions: [
      { plantId: 'sweetcorn', confidence: 'traditional', mechanism: 'nitrogen_fixation', bidirectional: true },
    ],
    enhancedAvoid: [
      { plantId: 'onion', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'garlic', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Phaseolus_vulgaris'
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
    enhancedCompanions: [
      { plantId: 'sweetcorn', confidence: 'traditional', mechanism: 'nitrogen_fixation', bidirectional: true },
    ],
    enhancedAvoid: [
      { plantId: 'onion', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'garlic', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Borlotti_bean'
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
    enhancedCompanions: [
      { plantId: 'sweetcorn', confidence: 'traditional', mechanism: 'nitrogen_fixation', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'onion', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'garlic', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Soybean'
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
    enhancedCompanions: [
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'nitrogen_fixation', bidirectional: true },
      { plantId: 'radish', confidence: 'traditional', mechanism: 'nitrogen_fixation', bidirectional: true },
      { plantId: 'turnip', confidence: 'traditional', mechanism: 'nitrogen_fixation', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'onion', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'garlic', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Snow_pea'
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
    enhancedCompanions: [
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'nitrogen_fixation', bidirectional: true },
      { plantId: 'radish', confidence: 'traditional', mechanism: 'nitrogen_fixation', bidirectional: true },
      { plantId: 'turnip', confidence: 'traditional', mechanism: 'nitrogen_fixation', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'onion', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'garlic', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Snap_pea'
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
    enhancedCompanions: [
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'radish', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'onion', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Tetragonolobus_purpureus'
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
    enhancedCompanions: [
      { plantId: 'sweetcorn', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'onion', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'garlic', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Black_turtle_bean'
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
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Fenugreek',
    enhancedCompanions: [],
    enhancedAvoid: []
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
    enhancedCompanions: [
      { plantId: 'sweetcorn', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Apios_americana',
    enhancedAvoid: []
  }
]
