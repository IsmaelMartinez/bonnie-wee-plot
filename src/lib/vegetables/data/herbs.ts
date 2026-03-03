/**
 * Herbs - Vegetable Database
 * Planting times adjusted for Scotland / Edinburgh climate
 */

import { Vegetable } from '@/types/garden-planner'

export const herbs: Vegetable[] = [
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
    enhancedCompanions: [
      { plantId: 'asparagus', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'lettuce', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    rhsUrl: 'https://www.rhs.org.uk/herbs/parsley/grow-your-own',
    botanicalName: 'Petroselinum crispum',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Petroselinum_crispum'
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
    enhancedCompanions: [
      { plantId: 'spinach', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'florence-fennel', confidence: 'traditional', mechanism: 'allelopathy', bidirectional: false }
    ],
    rhsUrl: 'https://www.rhs.org.uk/herbs/coriander/grow-your-own',
    botanicalName: 'Coriandrum sativum',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Coriandrum_sativum'
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
    enhancedCompanions: [
      { plantId: 'cabbage', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'peas', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'chamomile', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'parsley', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    rhsUrl: 'https://www.rhs.org.uk/herbs/mint/grow-your-own',
    botanicalName: 'Mentha spp.',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Mentha'
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
    enhancedCompanions: [
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true }
    ],
    rhsUrl: 'https://www.rhs.org.uk/herbs/chives/grow-your-own',
    botanicalName: 'Allium schoenoprasum',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Chives',
    enhancedAvoid: []
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
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'cabbage', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'sage', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true }
    ],
    rhsUrl: 'https://www.rhs.org.uk/herbs/rosemary/grow-your-own',
    botanicalName: 'Salvia rosmarinus',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Rosmarinus_officinalis',
    enhancedAvoid: []
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
    enhancedCompanions: [
      { plantId: 'cabbage', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true }
    ],
    rhsUrl: 'https://www.rhs.org.uk/herbs/thyme/grow-your-own',
    botanicalName: 'Thymus vulgaris',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Thymus_vulgaris',
    enhancedAvoid: []
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
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Lovage',
    enhancedCompanions: [],
    enhancedAvoid: []
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
    enhancedCompanions: [
      { plantId: 'strawberry', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'chives', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Sorrel',
    enhancedAvoid: []
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
    enhancedCompanions: [
      { plantId: 'pumpkin', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true }
    ],
    rhsUrl: 'https://www.rhs.org.uk/herbs/oregano/grow-your-own',
    botanicalName: 'Origanum vulgare',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Origanum_vulgare',
    enhancedAvoid: []
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
    enhancedCompanions: [
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'rosemary', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true }
    ],
    enhancedAvoid: [],
    rhsUrl: 'https://www.rhs.org.uk/herbs/sage/grow-your-own',
    botanicalName: 'Salvia officinalis',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Salvia_officinalis'
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
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Tarragon',
    enhancedCompanions: [],
    enhancedAvoid: []
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
    enhancedCompanions: [
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'lettuce', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    rhsUrl: 'https://www.rhs.org.uk/herbs/dill/grow-your-own',
    botanicalName: 'Anethum graveolens',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Dill'
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
    enhancedCompanions: [],
    enhancedAvoid: [
      { plantId: 'dill', confidence: 'proven', mechanism: 'allelopathy', bidirectional: true, source: 'Fennel allelopathy' }
    ],
    botanicalName: 'Foeniculum vulgare',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Fennel'
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
    enhancedCompanions: [],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Melissa_officinalis',
    enhancedAvoid: []
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
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Marjoram',
    enhancedCompanions: [],
    enhancedAvoid: []
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
    enhancedCompanions: [
      { plantId: 'rosemary', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'thyme', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Laurus_nobilis',
    enhancedAvoid: []
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
    enhancedCompanions: [
      { plantId: 'strawberry', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Borage',
    enhancedAvoid: []
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
    enhancedCompanions: [
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'onion', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Chamomile',
    enhancedAvoid: []
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
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'onion', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Satureja_montana',
    enhancedAvoid: []
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
    enhancedCompanions: [
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'radish', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Hyssopus_officinalis'
  }
]
