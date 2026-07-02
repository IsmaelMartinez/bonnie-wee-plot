/**
 * Herbs - Vegetable Database
 * Planting times adjusted for Scotland / Edinburgh climate
 */

import { Vegetable } from '@/types/garden-planner'

export const herbs: Vegetable[] = [
  {
    id: 'parsley',
    storage: {
      methods: ['fridge', 'freeze', 'dry'],
      freshDays: 7,
      tip: 'Freeze chopped in ice-cube trays with a little water or oil; flavour beats dried.',
    },
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
    hardiness: 'H4',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Petroselinum_crispum'
  },
  {
    id: 'coriander',
    storage: {
      methods: ['fridge', 'freeze', 'dry'],
      freshDays: 5,
      tip: 'Freeze leaves in oil cubes; let some plants set seed for dried coriander.',
    },
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
    hardiness: 'H3',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Coriandrum_sativum'
  },
  {
    id: 'mint',
    storage: {
      methods: ['fridge', 'freeze', 'dry'],
      freshDays: 7,
      tip: 'Freeze chopped in ice-cube trays; dries reasonably for winter teas.',
    },
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
    careTips: [
      { months: [4, 5], tip: 'Sink the pot into the bed or grow in a container to stop mint invading', category: 'care' },
      { months: [3, 4], tip: 'Lift and divide congested clumps in spring to refresh vigour', category: 'propagate' },
      { months: [6, 7, 8], tip: 'Harvest young leaves regularly through summer', category: 'harvest' },
      { months: [7, 8], tip: 'Cut stems back after flowering for a fresh flush of leaves', category: 'care' },
      { months: [10, 11], tip: 'Cut back to the ground once growth dies down in autumn', category: 'care' },
      { months: [9, 10], tip: 'Divide crowded roots in autumn to raise new plants', category: 'propagate' },
    ],
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
    hardiness: 'H7',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Mentha'
  },
  {
    id: 'chives',
    storage: {
      methods: ['fridge', 'freeze'],
      freshDays: 7,
      tip: 'Snip and freeze in bags or oil cubes; chives lose flavour when dried.',
    },
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
    careTips: [
      { months: [4, 5, 6], tip: 'Harvest leaves from spring, snipping down to the base', category: 'harvest' },
      { months: [6], tip: 'Pick the purple flowers for salads, or remove spent heads to stop self-seeding', category: 'harvest' },
      { months: [7], tip: 'Cut the whole clump back to the ground after flowering for a fresh flush', category: 'care' },
      { months: [3, 4], tip: 'Lift and divide congested clumps every two to three years in spring', category: 'propagate' },
      { months: [9], tip: 'Divide congested clumps in early autumn while the soil is warm', category: 'propagate' },
      { months: [10], tip: 'Pot up a clump and bring indoors for winter windowsill pickings', category: 'protect' },
    ],
    enhancedCompanions: [
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true }
    ],
    rhsUrl: 'https://www.rhs.org.uk/herbs/chives/grow-your-own',
    botanicalName: 'Allium schoenoprasum',
    hardiness: 'H6',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Chives',
    enhancedAvoid: []
  },
  {
    id: 'rosemary',
    storage: {
      methods: ['fridge', 'dry', 'freeze'],
      freshDays: 14,
      tip: 'Hang sprigs to dry in an airy spot; keeps potency for months.',
    },
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
    careTips: [
      { months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], tip: 'Harvest sprigs any month — the shrub is evergreen', category: 'harvest' },
      { months: [6, 7], tip: 'Trim lightly after flowering to keep it bushy, but never cut into old bare wood as it will not reshoot', category: 'care' },
      { months: [7, 8], tip: 'Take semi-ripe cuttings in summer to raise new plants', category: 'propagate' },
      { months: [11, 12, 1], tip: 'Shelter from cold drying winds and wrap container plants in hard frosts', category: 'protect' },
      { months: [4, 5], tip: 'Add grit for sharp drainage — wet winter soil will kill the plant', category: 'care' },
      { months: [5, 6, 9], tip: 'Plant out into a warm sheltered spot with free-draining soil', category: 'plant' },
    ],
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'cabbage', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'sage', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true }
    ],
    rhsUrl: 'https://www.rhs.org.uk/herbs/rosemary/grow-your-own',
    botanicalName: 'Salvia rosmarinus',
    hardiness: 'H4',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Rosmarinus_officinalis',
    enhancedAvoid: []
  },
  {
    id: 'thyme',
    storage: {
      methods: ['fridge', 'dry', 'freeze'],
      freshDays: 14,
      tip: 'Hang bundles to dry, then strip leaves from stems into a jar.',
    },
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
    careTips: [
      { months: [4, 5, 6, 7, 8, 9], tip: 'Harvest sprigs spring to autumn, best just before flowering', category: 'harvest' },
      { months: [7, 8], tip: 'Trim the plant over after flowering to stop it going woody and leggy', category: 'care' },
      { months: [4, 5], tip: 'Take cuttings or divide clumps in spring or early summer', category: 'propagate' },
      { months: [3], tip: 'Add grit to keep the soil free-draining — thyme dislikes winter wet', category: 'care' },
      { months: [11, 12], tip: 'Improve drainage or use a cloche to shield plants from cold wet soil', category: 'protect' },
      { months: [4], tip: 'Renew or replace plants every three to four years as they get woody', category: 'care' },
    ],
    enhancedCompanions: [
      { plantId: 'cabbage', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true }
    ],
    rhsUrl: 'https://www.rhs.org.uk/herbs/thyme/grow-your-own',
    botanicalName: 'Thymus vulgaris',
    hardiness: 'H4',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Thymus_vulgaris',
    enhancedAvoid: []
  },
  {
    id: 'lovage',
    storage: {
      methods: ['fridge', 'freeze', 'dry'],
      freshDays: 7,
      tip: 'Freeze chopped leaves for soups and stocks; dries fairly well too.',
    },
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
    careTips: [
      { months: [4, 5], tip: 'Harvest young leaves in spring for the strongest celery flavour', category: 'harvest' },
      { months: [3, 4], tip: 'Feed and mulch in spring to encourage lush leafy growth', category: 'care' },
      { months: [6, 7], tip: 'Remove flower stems to keep leaf production going, or leave some to self-seed', category: 'care' },
      { months: [3, 4], tip: 'Divide congested crowns in spring to raise new plants', category: 'propagate' },
      { months: [6, 7, 8, 9], tip: 'Keep harvesting leaves through the growing season', category: 'harvest' },
      { months: [10, 11], tip: 'Cut down old stems in autumn as the plant dies right back', category: 'care' },
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Lovage',
    hardiness: 'H4',
    enhancedCompanions: [],
    enhancedAvoid: []
  },
  {
    id: 'sorrel',
    storage: {
      methods: ['fresh', 'freeze'],
      freshDays: 5,
      tip: 'Best used fresh in salads; cook down and freeze as a puree for sauces.',
    },
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
    careTips: [
      { months: [4, 5, 6, 7, 8, 9], tip: 'Pick young leaves often through the season to keep them tender', category: 'harvest' },
      { months: [5, 6], tip: 'Remove flower stalks as they appear to prolong leaf production and stop self-seeding', category: 'care' },
      { months: [7], tip: 'Cut the whole plant back in summer for a fresh flush of new leaves', category: 'care' },
      { months: [3, 4], tip: 'Divide clumps every few years in spring to keep plants vigorous', category: 'propagate' },
      { months: [3, 4], tip: 'Mulch around the crowns in spring to hold moisture', category: 'care' },
      { months: [2, 3], tip: 'Cover a few plants with a cloche for early spring pickings', category: 'protect' },
    ],
    enhancedCompanions: [
      { plantId: 'strawberry', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'chives', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Sorrel',
    hardiness: 'H6',
    enhancedAvoid: []
  },
  {
    id: 'oregano',
    storage: {
      methods: ['fridge', 'dry', 'freeze'],
      freshDays: 10,
      tip: 'Flavour intensifies when dried; hang sprigs in an airy spot.',
    },
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
    careTips: [
      { months: [6, 7, 8], tip: 'Harvest leaves through summer, best just before flowering', category: 'harvest' },
      { months: [7, 8], tip: 'Trim after flowering to encourage fresh leafy growth', category: 'care' },
      { months: [7, 8], tip: 'Leave some flowers for the bees, which love them', category: 'care' },
      { months: [3, 4], tip: 'Divide established clumps in spring to raise new plants', category: 'propagate' },
      { months: [6, 7], tip: 'Take cuttings in summer to increase your stock', category: 'propagate' },
      { months: [10, 3], tip: 'Cut back old stems in autumn or early spring as the plant dies back', category: 'care' },
    ],
    enhancedCompanions: [
      { plantId: 'pumpkin', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true }
    ],
    rhsUrl: 'https://www.rhs.org.uk/herbs/oregano/grow-your-own',
    botanicalName: 'Origanum vulgare',
    hardiness: 'H4',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Origanum_vulgare',
    enhancedAvoid: []
  },
  {
    id: 'sage',
    storage: {
      methods: ['fridge', 'dry', 'freeze'],
      freshDays: 14,
      tip: 'Dries excellently; hang leaves or freeze in oil for winter roasts.',
    },
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
    careTips: [
      { months: [5, 6, 7, 8, 9], tip: 'Harvest leaves through the growing season, lightest in winter', category: 'harvest' },
      { months: [4], tip: 'Prune lightly in spring once new growth shows to keep the plant compact, but do not cut into old wood', category: 'care' },
      { months: [6, 7], tip: 'Take softwood or semi-ripe cuttings in summer to raise new plants', category: 'propagate' },
      { months: [4], tip: 'Replace leggy plants every four to five years to keep them productive', category: 'care' },
      { months: [11, 12], tip: 'Improve drainage or use a cloche to protect from cold wet winters', category: 'protect' },
      { months: [5, 6], tip: 'Plant out into a warm free-draining spot in full sun', category: 'plant' },
    ],
    enhancedCompanions: [
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'carrot', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'rosemary', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true }
    ],
    enhancedAvoid: [],
    rhsUrl: 'https://www.rhs.org.uk/herbs/sage/grow-your-own',
    botanicalName: 'Salvia officinalis',
    hardiness: 'H4',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Salvia_officinalis'
  },
  {
    id: 'french-tarragon',
    storage: {
      methods: ['fridge', 'freeze'],
      freshDays: 7,
      tip: 'Freeze sprigs or steep in vinegar; loses much flavour if dried.',
    },
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
    careTips: [
      { months: [6, 7, 8], tip: 'Harvest leaves through summer, best before flowering', category: 'harvest' },
      { months: [10, 11], tip: 'Mulch the crown thickly for winter — it is not reliably hardy in Scotland', category: 'protect' },
      { months: [10], tip: 'Or lift and pot up to overwinter frost-free under cover', category: 'protect' },
      { months: [4], tip: 'Propagate only by division or cuttings in spring, as true French tarragon does not come true from seed', category: 'propagate' },
      { months: [3, 4], tip: 'Divide clumps every two to three years in spring to keep it vigorous', category: 'propagate' },
      { months: [5], tip: 'Plant out into a warm sheltered spot with sharp drainage', category: 'plant' },
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Tarragon',
    hardiness: 'H4',
    enhancedCompanions: [],
    enhancedAvoid: []
  },
  {
    id: 'dill',
    storage: {
      methods: ['fridge', 'freeze', 'dry'],
      freshDays: 5,
      tip: 'Freeze the feathery leaves for best flavour; dry the ripe seed heads for the spice rack.',
    },
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
    hardiness: 'H3',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Dill'
  },
  {
    id: 'herb-fennel',
    storage: {
      methods: ['fridge', 'freeze', 'dry'],
      freshDays: 5,
      tip: 'Freeze the feathery leaves; dry the ripe seeds for cooking.',
    },
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
    careTips: [
      { months: [5, 6], tip: 'Plant into deep well-drained soil in a sunny sheltered spot — the long taproot dislikes being moved once settled', category: 'plant' },
      { months: [6, 7, 8, 9], tip: 'Snip the feathery leaves through summer for fish and salads, taking a little from each plant', category: 'harvest' },
      { months: [9, 10], tip: 'Let some heads ripen and gather the seeds once brown and dry for cooking', category: 'harvest' },
      { months: [8, 9], tip: 'Cut off most seed heads before they scatter unless you want fennel seedlings all over the plot', category: 'care' },
      { months: [4, 5], tip: 'Sow saved seed in spring or let a few self sown seedlings grow on to replace ageing plants', category: 'propagate' },
      { months: [11, 12], tip: 'Cut the old stems down in late autumn and mulch the crown to carry it through a cold wet winter', category: 'protect' },
    ],
    enhancedCompanions: [],
    enhancedAvoid: [
      { plantId: 'dill', confidence: 'proven', mechanism: 'allelopathy', bidirectional: true, source: 'Fennel allelopathy' }
    ],
    botanicalName: 'Foeniculum vulgare',
    hardiness: 'H3',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Fennel'
  },
  {
    id: 'lemon-balm',
    storage: {
      methods: ['fridge', 'freeze', 'dry'],
      freshDays: 5,
      tip: 'Freeze in oil cubes; dries adequately for teas though scent fades.',
    },
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
    careTips: [
      { months: [6, 7, 8], tip: 'Harvest young leaves through summer for teas', category: 'harvest' },
      { months: [6, 7], tip: 'Cut back hard before or just after flowering to prevent heavy self-seeding and get fresh leaves', category: 'care' },
      { months: [10, 11], tip: 'Cut the whole plant to the ground in autumn as it dies back', category: 'care' },
      { months: [3, 4], tip: 'Divide congested clumps in spring to raise new plants', category: 'propagate' },
      { months: [9, 10], tip: 'Divide crowded roots in autumn to refresh the clump', category: 'propagate' },
      { months: [5], tip: 'Grow in a contained spot as it spreads freely', category: 'care' },
    ],
    enhancedCompanions: [],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Melissa_officinalis',
    hardiness: 'H7',
    enhancedAvoid: []
  },
  {
    id: 'marjoram',
    storage: {
      methods: ['fridge', 'dry', 'freeze'],
      freshDays: 10,
      tip: 'Hang sprigs to dry; holds its sweet flavour well in a jar.',
    },
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
    careTips: [
      { months: [6, 7, 8], tip: 'Harvest young shoots through summer', category: 'harvest' },
      { months: [7, 8], tip: 'Trim the plant over after flowering to keep it neat and leafy', category: 'care' },
      { months: [10, 11], tip: 'Protect the crown with a cloche or dry mulch — it often does not survive a Scottish winter', category: 'protect' },
      { months: [10], tip: 'Or lift and pot up to overwinter under cover', category: 'protect' },
      { months: [3, 4], tip: 'Divide established clumps in spring to raise new plants', category: 'propagate' },
      { months: [6, 7], tip: 'Take cuttings in summer to increase your stock', category: 'propagate' },
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Marjoram',
    hardiness: 'H4',
    enhancedCompanions: [],
    enhancedAvoid: []
  },
  {
    id: 'bay',
    storage: {
      methods: ['fridge', 'dry'],
      freshDays: 14,
      tip: 'Dry whole leaves flat; they keep their flavour for a year or more.',
    },
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
    careTips: [
      { months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], tip: 'Harvest leaves any month — the shrub is evergreen', category: 'harvest' },
      { months: [4, 5], tip: 'Grow in a large container so the plant can be moved to shelter', category: 'plant' },
      { months: [11, 12, 1, 2], tip: 'Protect from hard frost and cold winds — leaves scorch in a severe winter, especially in pots', category: 'protect' },
      { months: [6, 7, 8], tip: 'Prune to shape in summer', category: 'care' },
      { months: [8, 9], tip: 'Take semi-ripe cuttings in late summer, though they are slow to root', category: 'propagate' },
      { months: [6, 7], tip: 'Watch for bay sucker and scale insects on the leaves', category: 'care' },
    ],
    enhancedCompanions: [
      { plantId: 'rosemary', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'thyme', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Laurus_nobilis',
    hardiness: 'H4',
    enhancedAvoid: []
  },
  {
    id: 'borage',
    storage: {
      methods: ['fresh'],
      freshDays: 2,
      tip: 'Use flowers and leaves fresh; they wilt fast, so pick just before use.',
    },
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
    hardiness: 'H4',
    enhancedAvoid: []
  },
  {
    id: 'chamomile',
    storage: {
      methods: ['dry'],
      tip: 'Dry the open flowers on a tray, then store airtight for teas.',
    },
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
    careTips: [
      { months: [5, 6], tip: 'Plant out into free-draining soil in full sun once frosts pass — it copes with poor ground and light foot traffic', category: 'plant' },
      { months: [6, 7, 8, 9], tip: 'Pick the open white flowers on a dry morning and dry them on a tray for tea', category: 'harvest' },
      { months: [7, 8], tip: 'Shear off the spent flowers through summer to keep fresh blooms coming', category: 'care' },
      { months: [4, 5, 9], tip: 'Lift and divide clumps in spring or early autumn to spread it along a path or lawn edge', category: 'propagate' },
      { months: [6, 7, 8], tip: 'Water new plants in dry spells but keep them lean — rich soil gives soft floppy growth', category: 'care' },
      { months: [11, 12, 1], tip: 'Cut back tired growth for winter and clear fallen leaves so the low mats do not rot in the wet', category: 'protect' },
    ],
    enhancedCompanions: [
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'onion', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Chamomile',
    hardiness: 'H4',
    enhancedAvoid: []
  },
  {
    id: 'winter-savory',
    storage: {
      methods: ['fridge', 'dry', 'freeze'],
      freshDays: 14,
      tip: 'Hang sprigs to dry; peppery flavour holds well for winter bean dishes.',
    },
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
    careTips: [
      { months: [3, 4], tip: 'Add grit for sharp drainage — winter wet is the main killer in Scotland', category: 'care' },
      { months: [4, 5], tip: 'Trim off tired old growth in spring as fresh shoots break', category: 'care' },
      { months: [6, 7, 8], tip: 'Harvest sprigs through summer, best just before flowering', category: 'harvest' },
      { months: [8], tip: 'Trim the plant over after flowering to keep it compact and stop it going woody', category: 'care' },
      { months: [4, 5], tip: 'Take cuttings or divide established clumps in spring to raise new plants', category: 'propagate' },
      { months: [9, 10], tip: 'Cut and dry sprigs for peppery winter bean and stew dishes', category: 'harvest' },
    ],
    enhancedCompanions: [
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'onion', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Satureja_montana',
    hardiness: 'H4',
    enhancedAvoid: []
  },
  {
    id: 'hyssop',
    storage: {
      methods: ['fridge', 'dry', 'freeze'],
      freshDays: 14,
      tip: 'Hang sprigs to dry for teas; keeps its minty-bitter flavour in a jar.',
    },
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
    careTips: [
      { months: [3, 4], tip: 'Trim back old growth in spring to keep the plant neat and bushy', category: 'care' },
      { months: [5, 6], tip: 'Plant out into a sunny, free-draining spot after the last frosts', category: 'plant' },
      { months: [6, 7, 8], tip: 'Harvest young leaves and flowering tops through summer for teas', category: 'harvest' },
      { months: [7, 8], tip: 'Leave the blue flowers for the bees and butterflies that love them', category: 'care' },
      { months: [8, 9], tip: 'Trim over after flowering to stop the plant getting woody and leggy', category: 'care' },
      { months: [4, 5], tip: 'Take cuttings or divide clumps in spring to raise new plants', category: 'propagate' },
    ],
    enhancedCompanions: [
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'radish', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Hyssopus_officinalis',
    hardiness: 'H4'
  }
]
