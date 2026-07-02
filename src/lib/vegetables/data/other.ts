/**
 * Other (Specialty Vegetables) - Vegetable Database
 * Planting times adjusted for Scotland / Edinburgh climate
 */

import { Vegetable } from '@/types/garden-planner'

export const other: Vegetable[] = [
  {
    id: 'rhubarb',
    storage: {
      methods: ['fresh', 'fridge', 'freeze', 'jam'],
      freshDays: 7,
      tip: 'Glut crop — chop and freeze raw, or stew into compote and jam.',
    },
    name: 'Rhubarb',
    category: 'other',
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
    enhancedCompanions: [
      { plantId: 'garlic', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'onion', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true }
    ],
    rhsUrl: 'https://www.rhs.org.uk/vegetables/rhubarb/grow-your-own',
    botanicalName: 'Rheum rhabarbarum',
    hardiness: 'H7',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Rhubarb',
    maintenance: {
      feedMonths: [3],
      mulchMonths: [11],
      feedFrequencyDays: 60,
      feedType: 'high-nitrogen',
      waterFrequencyDays: 7,
      notes: ['Force under pot from January for early crop', 'Remove flower stalks immediately']
    },
    perennialInfo: {
      yearsToFirstHarvest: { min: 1, max: 2 },
      productiveYears: { min: 10, max: 15 }
    },
    careTips: [
      { months: [1, 2], tip: 'Cover crowns with a forcing pot for early pink stems', category: 'care', stage: 'productive' },
      { months: [4], tip: 'Begin harvesting — pull stems, don\'t cut', category: 'harvest', stage: 'productive' },
      { months: [6], tip: 'Stop harvesting by late June to let the plant recover', category: 'harvest', stage: 'productive' },
      { months: [9], tip: 'Remove any flowering stems immediately', category: 'care' },
      { months: [10, 11], tip: 'Divide crowns every 5 years to maintain vigour', category: 'propagate', stage: 'productive' },
      { months: [11], tip: 'Mulch around dormant crowns with well-rotted manure, keeping the crown itself clear to prevent rot', category: 'care' },
      { months: [3, 4, 5, 6, 7, 8], tip: 'Don\'t harvest at all in the first year', category: 'care', stage: 'establishing' },
    ],
    enhancedAvoid: []
  },
  {
    id: 'jerusalem-artichoke',
    storage: {
      methods: ['store-cool', 'fresh'],
      tip: 'Best left in the ground and dug as needed — the knobbly tubers don’t keep long once lifted.',
    },
    name: 'Jerusalem Artichoke',
    category: 'other',
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
    enhancedCompanions: [
      { plantId: 'sweetcorn', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'sunflower', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'potato', confidence: 'traditional', mechanism: 'nutrient_competition', bidirectional: false }
    ],
    careTips: [
      { months: [2, 3, 4], tip: 'Plant tubers 10-15cm deep like potatoes once the soil is workable', category: 'plant' },
      { months: [6, 7], tip: 'Earth up the stems and stake tall clumps in exposed Scottish plots', category: 'care' },
      { months: [8, 9], tip: 'Cut off any flower buds so the plant puts its energy into the tubers', category: 'care' },
      { months: [10, 11], tip: 'Cut down the tall stems once blackened by frost, leaving short stubs to mark the row', category: 'care' },
      { months: [10, 11, 12, 1, 2], tip: 'Lift tubers as needed through winter — they store best left in the ground', category: 'harvest' },
      { months: [2, 3], tip: 'Dig out every last tuber when clearing a bed, or it will regrow and spread', category: 'care' },
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Jerusalem_artichoke',
    hardiness: 'H6'
  },
  {
    id: 'sweetcorn',
    storage: {
      methods: ['fresh', 'freeze'],
      freshDays: 2,
      tip: 'Eat or freeze within hours of picking — the sugars turn to starch fast. Blanch whole cobs or strip the kernels to freeze.',
    },
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
    maintenance: {
      feedMonths: [6, 7],
      feedFrequencyDays: 21,
      feedType: 'high-nitrogen',
      notes: ['A high-nitrogen feed every 3 weeks supports fast leafy growth']
    },
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'runner-beans', confidence: 'proven', mechanism: 'physical_support', bidirectional: true, source: 'Three Sisters - beans climb corn stalks' }
    ],
    enhancedAvoid: [],
    rhsUrl: 'https://www.rhs.org.uk/vegetables/sweetcorn/grow-your-own',
    botanicalName: 'Zea mays',
    hardiness: 'H2',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Maize'
  },
  {
    id: 'asparagus',
    storage: {
      methods: ['fresh', 'fridge', 'freeze'],
      freshDays: 4,
      tip: 'Best eaten the day you cut it; stand spears in water in the fridge, or blanch and freeze a glut.',
    },
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
    enhancedCompanions: [
      { plantId: 'parsley', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'onion', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'garlic', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    rhsUrl: 'https://www.rhs.org.uk/vegetables/asparagus/grow-your-own',
    botanicalName: 'Asparagus officinalis',
    hardiness: 'H6',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Asparagus_officinalis',
    maintenance: {
      feedMonths: [3],
      mulchMonths: [11],
      feedFrequencyDays: 60,
      feedType: 'balanced',
      waterFrequencyDays: 7,
      notes: ['Cut down ferns in autumn', 'Weed regularly']
    },
    perennialInfo: {
      yearsToFirstHarvest: { min: 2, max: 3 },
      productiveYears: { min: 15, max: 20 }
    },
    careTips: [
      { months: [3, 4], tip: 'Do not cut any spears in the first two years — let the crowns build strength', category: 'care', stage: 'establishing' },
      { months: [3], tip: 'Feed and mulch the bed with compost as growth begins', category: 'care' },
      { months: [4, 5, 6], tip: 'From year three, cut spears when about 18cm tall', category: 'harvest', stage: 'productive' },
      { months: [6], tip: 'Stop cutting by mid-June and let the ferny foliage grow to feed the crowns', category: 'harvest', stage: 'productive' },
      { months: [6, 7, 8], tip: 'Weed the bed by hand and watch the ferns for asparagus beetle', category: 'care' },
      { months: [10, 11], tip: 'Cut down the yellowed ferns to ground level, then mulch the bed with compost for winter', category: 'care' },
    ]
  },
  {
    id: 'globe-artichoke',
    storage: {
      methods: ['fresh', 'fridge', 'freeze'],
      freshDays: 7,
      tip: 'Best fresh; keeps about a week in the fridge. Blanch and freeze trimmed hearts to preserve a glut, or keep cooked hearts in oil in the fridge for a few days.',
    },
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
    enhancedCompanions: [
      { plantId: 'sunflower', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'french-tarragon', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    maintenance: {
      feedMonths: [3, 5],
      mulchMonths: [11],
      feedFrequencyDays: 30,
      feedType: 'balanced',
      waterFrequencyDays: 7,
      notes: ['Protect crowns with straw in winter']
    },
    careTips: [
      { months: [5, 6], tip: 'In the first year remove any flower buds to build a strong plant', category: 'care' },
      { months: [3, 6], tip: 'Feed generously in spring and again in early summer', category: 'care' },
      { months: [7, 8, 9], tip: 'Harvest the fat flower buds while still tight and closed, taking the top terminal bud first', category: 'harvest' },
      { months: [9, 10], tip: 'Cut the plants back after cropping', category: 'care' },
      { months: [11], tip: 'Protect the crown over winter with a thick straw or bracken mulch — essential in Scotland', category: 'protect' },
      { months: [3, 4], tip: 'Take rooted offsets from the base in spring to renew the plants every few years', category: 'propagate' },
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Globe_artichoke',
    hardiness: 'H3',
    enhancedAvoid: []
  },
  {
    id: 'celery',
    storage: {
      methods: ['fridge', 'freeze'],
      freshDays: 14,
      tip: 'Keeps a couple of weeks in the fridge; freeze chopped for soups and stews (cooked use only).',
    },
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
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'parsnip', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    rhsUrl: 'https://www.rhs.org.uk/vegetables/celery/grow-your-own',
    botanicalName: 'Apium graveolens',
    hardiness: 'H3',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Celery'
  },
  {
    id: 'cardoon',
    storage: {
      methods: ['fridge', 'fresh'],
      freshDays: 7,
      tip: 'Use the blanched stems fresh within a week; always cook before eating.',
    },
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
    careTips: [
      { months: [7, 8], tip: 'Stake the plants or shelter them from wind — they reach over 2m', category: 'care' },
      { months: [9], tip: 'Remove the coarse outer leaves before blanching', category: 'care' },
      { months: [9, 10], tip: 'Blanch the stems for 3-4 weeks by wrapping the bundled stems with cardboard or hessian', category: 'protect' },
      { months: [10, 11], tip: 'Harvest the blanched leaf stems, cooking them before eating', category: 'harvest' },
      { months: [11], tip: 'Cut back after harvest and protect the crown with a dry mulch over winter', category: 'protect' },
      { months: [3, 4], tip: 'Divide offsets in spring to propagate new plants', category: 'propagate' },
    ],
    enhancedCompanions: [
      { plantId: 'globe-artichoke', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'sunflower', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Cardoon',
    hardiness: 'H4',
    enhancedAvoid: []
  },
  {
    id: 'mashua',
    storage: {
      methods: ['store-cool', 'fridge'],
      tip: 'Lift the tubers after the first frost and store somewhere cool and dark like oca; best cooked.',
    },
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
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Tropaeolum_tuberosum',
    hardiness: 'H4',
    enhancedAvoid: []
  }
]
