/**
 * Fruit Trees - Vegetable Database
 * Planting times adjusted for Scotland / Edinburgh climate
 */

import { Vegetable } from '@/types/garden-planner'

export const fruitTrees: Vegetable[] = [
  {
    id: 'apple-tree',
    storage: {
      methods: ['store-cool', 'fridge', 'freeze', 'jam'],
      tip: 'Store sound late apples in trays somewhere cool and dark; windfalls into sauce, juice or chutney.',
    },
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
    enhancedCompanions: [
      { plantId: 'chives', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'nasturtium', confidence: 'traditional', mechanism: 'pest_trap', bidirectional: true },
      { plantId: 'garlic', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'potato', confidence: 'traditional', mechanism: 'disease_suppression', bidirectional: false }
    ],
    maintenance: {
      pruneMonths: [12, 1, 2],
      feedMonths: [3],
      mulchMonths: [11],
      feedFrequencyDays: 90,
      feedType: 'balanced',
      waterFrequencyDays: 7,
      notes: ['Winter prune when dormant', 'Summer prune water shoots in July-Aug']
    },
    perennialInfo: {
      yearsToFirstHarvest: { min: 3, max: 5 },
      productiveYears: { min: 30, max: 50 }
    },
    careTips: [
      { months: [1, 2], tip: 'Winter prune while dormant — remove crossing branches', category: 'care' },
      { months: [4], tip: 'Check for woolly aphid on bark crevices', category: 'protect' },
      { months: [6], tip: 'Thin fruitlets to one per cluster for better size', category: 'care', stage: 'productive' },
      { months: [8, 9], tip: 'Pick fruit when it twists off easily', category: 'harvest', stage: 'productive' },
      { months: [11], tip: 'Clear fallen leaves to reduce scab spores', category: 'protect' },
      { months: [1, 4, 7, 10], tip: 'Stake securely and check ties quarterly', category: 'care', stage: 'establishing' },
    ],
    rhsUrl: 'https://www.rhs.org.uk/fruit/apples/grow-your-own',
    botanicalName: 'Malus domestica',
    hardiness: 'H6',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Malus_domestica'
  },
  {
    id: 'cherry-tree',
    storage: {
      methods: ['fresh', 'freeze', 'jam'],
      freshDays: 4,
      tip: 'Best fresh — stone and open-freeze, or make jam; sweet cherries don’t keep long once ripe.',
    },
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
    enhancedCompanions: [
      { plantId: 'garlic', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'chives', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'marigold', confidence: 'traditional', mechanism: 'pest_trap', bidirectional: true }
    ],
    maintenance: {
      pruneMonths: [7, 8],
      feedMonths: [3],
      feedFrequencyDays: 90,
      feedType: 'balanced',
      waterFrequencyDays: 7,
      notes: ['ONLY prune in summer to avoid silver leaf and bacterial canker']
    },
    perennialInfo: {
      yearsToFirstHarvest: { min: 3, max: 5 },
      productiveYears: { min: 20, max: 30 }
    },
    careTips: [
      { months: [6, 7, 8], tip: 'Prune only in summer to avoid silver leaf and bacterial canker — never cut in winter', category: 'care' },
      { months: [3], tip: 'Feed with a balanced fertiliser and mulch around the base', category: 'care' },
      { months: [6], tip: 'Net the whole tree before fruit colours — birds will strip cherries fast', category: 'protect', stage: 'productive' },
      { months: [7, 8], tip: 'Pick cherries when fully coloured and sweet, with stalks attached', category: 'harvest', stage: 'productive' },
      { months: [5], tip: 'Watch for bacterial canker on shoots — cut out any sunken oozing bark in summer', category: 'protect' },
      { months: [1, 4, 7, 10], tip: 'Stake young trees firmly and check the ties are not cutting in', category: 'care', stage: 'establishing' },
    ],
    rhsUrl: 'https://www.rhs.org.uk/fruit/cherries/grow-your-own',
    botanicalName: 'Prunus avium',
    hardiness: 'H6',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Prunus_avium',
    enhancedAvoid: []
  },
  {
    id: 'damson-tree',
    storage: {
      methods: ['fresh', 'freeze', 'jam'],
      freshDays: 5,
      tip: 'Classic for jam, chutney and damson gin; or stone and freeze the glut.',
    },
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
    enhancedCompanions: [
      { plantId: 'garlic', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'chives', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'comfrey', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    maintenance: {
      pruneMonths: [6, 7],
      feedMonths: [3],
      feedFrequencyDays: 90,
      feedType: 'balanced',
      waterFrequencyDays: 7,
      notes: ['Minimal pruning needed - prune in summer to avoid silver leaf, just remove dead/crossing branches']
    },
    perennialInfo: {
      yearsToFirstHarvest: { min: 3, max: 5 },
      productiveYears: { min: 20, max: 30 }
    },
    careTips: [
      { months: [11, 12, 1, 2], tip: 'Plant bare-root trees during dormancy in well-drained soil', category: 'plant' },
      { months: [6], tip: 'Prune lightly in early summer only — avoid winter cuts to prevent silver leaf', category: 'care' },
      { months: [8], tip: 'Prop up heavily laden branches to stop them snapping under the crop', category: 'care', stage: 'productive' },
      { months: [9, 10], tip: 'Pick damsons when fully blue-black for the best flavour for jam and gin', category: 'harvest', stage: 'productive' },
      { months: [3], tip: 'Feed with a balanced fertiliser and mulch to conserve moisture', category: 'care' },
      { months: [1, 4, 7, 10], tip: 'Stake young trees and check the ties do not bite into the bark', category: 'care', stage: 'establishing' },
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Damson',
    hardiness: 'H4',
    enhancedAvoid: []
  },
  {
    id: 'plum-tree',
    storage: {
      methods: ['fresh', 'freeze', 'jam'],
      freshDays: 5,
      tip: 'Glut crop — stone and freeze, or make jam. Doesn’t keep fresh for long.',
    },
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
    enhancedCompanions: [
      { plantId: 'garlic', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'chives', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'comfrey', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    maintenance: {
      pruneMonths: [6, 7],
      feedMonths: [3],
      feedFrequencyDays: 90,
      feedType: 'balanced',
      waterFrequencyDays: 7,
      notes: ['Prune in summer to avoid silver leaf disease']
    },
    perennialInfo: {
      yearsToFirstHarvest: { min: 3, max: 5 },
      productiveYears: { min: 20, max: 30 }
    },
    careTips: [
      { months: [6, 7], tip: 'Prune only in summer to avoid silver leaf disease — never in winter', category: 'care' },
      { months: [4], tip: 'Protect blossom with fleece on frosty spring nights to save the crop', category: 'protect' },
      { months: [6], tip: 'Thin heavy fruit sets to one per cluster to prevent branch breakage and biennial bearing', category: 'care', stage: 'productive' },
      { months: [8], tip: 'Prop up laden branches so they do not split under the weight', category: 'care', stage: 'productive' },
      { months: [8, 9], tip: 'Pick plums when they soften slightly and part easily from the tree', category: 'harvest', stage: 'productive' },
      { months: [1, 4, 7, 10], tip: 'Stake young trees firmly and check the ties each season', category: 'care', stage: 'establishing' },
    ],
    rhsUrl: 'https://www.rhs.org.uk/fruit/plums/grow-your-own',
    botanicalName: 'Prunus domestica',
    hardiness: 'H6',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Prunus_domestica',
    enhancedAvoid: []
  },
  {
    id: 'pear-tree',
    storage: {
      methods: ['store-cool', 'fridge', 'freeze', 'jam'],
      tip: 'Pick slightly under-ripe and store cool, ripening a few at a time indoors; poach and freeze or make chutney with windfalls.',
    },
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
    enhancedCompanions: [
      { plantId: 'garlic', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'chives', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'nasturtium', confidence: 'traditional', mechanism: 'pest_trap', bidirectional: true }
    ],
    maintenance: {
      pruneMonths: [12, 1, 2],
      feedMonths: [3],
      feedFrequencyDays: 90,
      feedType: 'balanced',
      waterFrequencyDays: 7,
      notes: ['Winter prune when dormant', 'May need thinning if heavy crop']
    },
    perennialInfo: {
      yearsToFirstHarvest: { min: 4, max: 6 },
      productiveYears: { min: 35, max: 50 }
    },
    careTips: [
      { months: [12, 1, 2], tip: 'Winter prune while dormant — remove crossing, dead and congested branches', category: 'care' },
      { months: [11, 12, 1, 2], tip: 'Plant bare-root against a warm sheltered south wall for best results in Scotland', category: 'plant' },
      { months: [4], tip: 'Protect early blossom from frost with fleece on cold spring nights', category: 'protect' },
      { months: [6], tip: 'Thin fruitlets to two per cluster once the June drop finishes', category: 'care', stage: 'productive' },
      { months: [9, 10], tip: 'Pick slightly under-ripe and ripen indoors — do not wait for softening on the tree', category: 'harvest', stage: 'productive' },
      { months: [1, 4, 7, 10], tip: 'Stake young trees and check the ties do not cut into the bark', category: 'care', stage: 'establishing' },
    ],
    rhsUrl: 'https://www.rhs.org.uk/fruit/pears/grow-your-own',
    botanicalName: 'Pyrus communis',
    hardiness: 'H6',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Pyrus_communis',
    enhancedAvoid: []
  },
  {
    id: 'greengage-tree',
    storage: {
      methods: ['fresh', 'freeze', 'jam'],
      freshDays: 4,
      tip: 'Best eaten ripe off the tree; stone and freeze or make jam with any surplus.',
    },
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
    enhancedCompanions: [
      { plantId: 'garlic', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'chives', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'comfrey', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    maintenance: {
      pruneMonths: [6, 7],
      feedMonths: [3],
      feedFrequencyDays: 90,
      feedType: 'balanced',
      waterFrequencyDays: 7,
      notes: ['Prune in summer to avoid silver leaf disease']
    },
    perennialInfo: {
      yearsToFirstHarvest: { min: 3, max: 5 },
      productiveYears: { min: 20, max: 30 }
    },
    careTips: [
      { months: [6, 7], tip: 'Prune only in summer to avoid silver leaf disease — never cut in winter', category: 'care' },
      { months: [11, 12, 1, 2], tip: 'Plant bare-root against a warm wall and near another plum or gage for pollination', category: 'plant' },
      { months: [6], tip: 'Thin heavy fruit sets to space the gages and improve size', category: 'care', stage: 'productive' },
      { months: [8], tip: 'Prop up laden branches so the crop does not snap them', category: 'care', stage: 'productive' },
      { months: [8, 9], tip: 'Pick gages when soft and sweet, and watch for wasps on ripe fruit', category: 'harvest', stage: 'productive' },
      { months: [1, 4, 7, 10], tip: 'Stake young trees and check the ties are not too tight', category: 'care', stage: 'establishing' },
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Greengages',
    hardiness: 'H4',
    enhancedAvoid: []
  },
  {
    id: 'medlar-tree',
    storage: {
      methods: ['store-cool', 'jam'],
      tip: 'Pick after first frosts and blet (store cool until soft and brown) before eating, or boil down into medlar jelly.',
    },
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
    enhancedCompanions: [
      { plantId: 'garlic', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'chives', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'comfrey', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    maintenance: {
      pruneMonths: [12, 1, 2],
      feedMonths: [3],
      feedFrequencyDays: 90,
      feedType: 'balanced',
      waterFrequencyDays: 10,
      notes: ['Minimal pruning needed - very low maintenance']
    },
    perennialInfo: {
      yearsToFirstHarvest: { min: 3, max: 5 },
      productiveYears: { min: 30, max: 50 }
    },
    careTips: [
      { months: [11, 12, 1, 2], tip: 'Plant bare-root during dormancy — medlars are very hardy and easy to establish', category: 'plant' },
      { months: [12, 1, 2], tip: 'Prune minimally in winter, just to shape and remove crossing branches', category: 'care' },
      { months: [3], tip: 'Feed with a balanced fertiliser and mulch around the base', category: 'care' },
      { months: [10, 11], tip: 'Pick medlars after the first frosts, then blet them until soft and brown before eating', category: 'harvest', stage: 'productive' },
      { months: [11], tip: 'Clear fallen leaves from around the tree to keep the ground tidy', category: 'protect' },
      { months: [1, 4, 7, 10], tip: 'Stake the young tree and check the ties do not cut into the bark', category: 'care', stage: 'establishing' },
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Medlar',
    hardiness: 'H4',
    enhancedAvoid: []
  },
  {
    id: 'quince-tree',
    storage: {
      methods: ['store-cool', 'jam'],
      tip: 'Keeps cool and aromatic for weeks; never eaten raw, so cook into membrillo, jelly or jam.',
    },
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
    enhancedCompanions: [
      { plantId: 'garlic', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'chives', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'comfrey', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    maintenance: {
      pruneMonths: [12, 1, 2],
      feedMonths: [3],
      feedFrequencyDays: 90,
      feedType: 'balanced',
      waterFrequencyDays: 10,
      notes: ['Minimal pruning - just remove dead/crossing branches']
    },
    perennialInfo: {
      yearsToFirstHarvest: { min: 3, max: 5 },
      productiveYears: { min: 30, max: 50 }
    },
    careTips: [
      { months: [11, 12, 1, 2], tip: 'Plant bare-root during dormancy — quinces are hardy and self-fertile', category: 'plant' },
      { months: [12, 1, 2], tip: 'Prune minimally in winter to remove crossing and dead wood', category: 'care' },
      { months: [5, 6], tip: 'Watch for quince leaf blight — remove and bin badly spotted leaves', category: 'protect' },
      { months: [10, 11], tip: 'Leave fruit on the tree as long as possible, then pick before hard frosts', category: 'harvest', stage: 'productive' },
      { months: [11], tip: 'Clear fallen leaves to reduce leaf blight spores over winter', category: 'protect' },
      { months: [1, 4, 7, 10], tip: 'Stake the young tree and check the ties are not cutting in', category: 'care', stage: 'establishing' },
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Quince',
    hardiness: 'H4',
    enhancedAvoid: []
  },
  {
    id: 'fig-tree',
    storage: {
      methods: ['fresh', 'dry', 'jam'],
      freshDays: 3,
      tip: 'Eat ripe figs fresh within a couple of days; a glut dries well or makes a fine jam.',
    },
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
    enhancedCompanions: [
      { plantId: 'comfrey', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'nasturtium', confidence: 'traditional', mechanism: 'pest_trap', bidirectional: true }
    ],
    maintenance: {
      pruneMonths: [3, 4],
      feedMonths: [4, 5],
      feedFrequencyDays: 30,
      feedType: 'balanced',
      waterFrequencyDays: 5,
      notes: ['Prune in early spring', 'May need winter protection in cold areas']
    },
    perennialInfo: {
      yearsToFirstHarvest: { min: 2, max: 3 },
      productiveYears: { min: 30, max: 50 }
    },
    careTips: [
      { months: [3, 4], tip: 'Prune in early spring to shape and remove frost-damaged shoots', category: 'care' },
      { months: [11, 12, 1, 2], tip: 'Plant against a warm south-facing wall and restrict the roots in a pit or container to force fruiting', category: 'plant' },
      { months: [9, 10], tip: 'Remove large unripe figs that will only rot, but keep the tiny pea-sized embryo figs for next year', category: 'care', stage: 'productive' },
      { months: [8, 9], tip: 'Pick figs when they hang soft and droop on the stalk', category: 'harvest', stage: 'productive' },
      { months: [11, 12], tip: 'Protect the tree from hard frost with fleece or straw over winter', category: 'protect' },
      { months: [1, 4, 7, 10], tip: 'Water young trees well and check any wall ties are secure', category: 'care', stage: 'establishing' },
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Common_fig',
    hardiness: 'H4',
    enhancedAvoid: []
  },
  {
    id: 'mulberry-tree',
    storage: {
      methods: ['fresh', 'freeze', 'jam'],
      freshDays: 2,
      tip: 'Very soft, so eat within a day or freeze on trays; the rest makes a lovely deep jam.',
    },
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
    enhancedCompanions: [
      { plantId: 'garlic', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'chives', confidence: 'traditional', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'comfrey', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    maintenance: {
      pruneMonths: [12, 1],
      feedMonths: [3],
      feedFrequencyDays: 90,
      feedType: 'balanced',
      waterFrequencyDays: 10,
      notes: ['Minimal pruning needed - bleeds sap if cut in growing season']
    },
    perennialInfo: {
      yearsToFirstHarvest: { min: 3, max: 5 },
      productiveYears: { min: 50, max: 100 }
    },
    careTips: [
      { months: [12, 1], tip: 'Prune only when fully dormant and keep it minimal — mulberry bleeds sap heavily if cut in growing season', category: 'care' },
      { months: [11, 12, 1, 2], tip: 'Plant bare-root well away from paths and patios as the fruit stains badly', category: 'plant' },
      { months: [3], tip: 'Feed with a balanced fertiliser and mulch to help this slow starter establish', category: 'care' },
      { months: [8, 9], tip: 'Pick or gently shake ripe mulberries onto a sheet, or net to share with birds', category: 'harvest', stage: 'productive' },
      { months: [7], tip: 'Net ripening fruit if you want to beat the birds to it', category: 'protect', stage: 'productive' },
      { months: [1, 4, 7, 10], tip: 'Stake the young tree well as it is slow to establish, and check the ties', category: 'care', stage: 'establishing' },
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Mulberry',
    hardiness: 'H4',
    enhancedAvoid: []
  }
]
