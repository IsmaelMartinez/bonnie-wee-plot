/**
 * Berries - Vegetable Database
 * Planting times adjusted for Scotland / Edinburgh climate
 */

import { Vegetable } from '@/types/garden-planner'

export const berries: Vegetable[] = [
  {
    id: 'strawberry',
    storage: {
      methods: ['fresh', 'freeze', 'jam'],
      freshDays: 3,
      tip: 'Best fresh — open-freeze or make jam the day you pick.',
    },
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
    enhancedCompanions: [
      { plantId: 'lettuce', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'spinach', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'broad-beans', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'borage', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'brussels-sprouts', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    perennialInfo: {
      yearsToFirstHarvest: { min: 1, max: 1 },
      productiveYears: { min: 3, max: 4 }
    },
    careTips: [
      { months: [3, 4], tip: 'Remove straw or mulch from crowns as growth starts', category: 'care' },
      { months: [5], tip: 'Tuck straw under developing fruit to keep clean', category: 'care', stage: 'productive' },
      { months: [6, 7], tip: 'Pick regularly — every other day in peak season', category: 'harvest', stage: 'productive' },
      { months: [7, 8], tip: 'Peg down runners to propagate new plants', category: 'propagate' },
      { months: [9], tip: 'Cut back old foliage after fruiting finishes', category: 'care' },
      { months: [4, 5, 6], tip: 'Remove flowers in first year to build strong roots', category: 'care', stage: 'establishing' },
    ],
    rhsUrl: 'https://www.rhs.org.uk/fruit/strawberries/grow-your-own',
    botanicalName: 'Fragaria × ananassa',
    hardiness: 'H6',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Fragaria_%C3%97_ananassa'
  },
  {
    id: 'raspberry',
    storage: {
      methods: ['fresh', 'freeze', 'jam'],
      freshDays: 2,
      tip: 'Open-freeze on trays then bag, or cook into jam — they don’t keep fresh long.',
    },
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
    enhancedCompanions: [
      { plantId: 'garlic', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'tansy', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'turnip', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'blackberry', confidence: 'likely', mechanism: 'disease_suppression', bidirectional: true },
      { plantId: 'potato', confidence: 'traditional', mechanism: 'disease_suppression', bidirectional: false }
    ],
    maintenance: {
      pruneMonths: [2, 8, 9],
      feedMonths: [3],
      mulchMonths: [3],
      feedFrequencyDays: 28,
      feedType: 'high-potash',
      waterFrequencyDays: 5,
      notes: ['Summer types: cut fruited canes after harvest', 'Autumn types: cut all canes to ground in Feb']
    },
    perennialInfo: {
      yearsToFirstHarvest: { min: 2, max: 2 },
      productiveYears: { min: 10, max: 15 }
    },
    careTips: [
      { months: [1, 2], tip: 'Check support wires and tighten before new growth', category: 'care' },
      { months: [3], tip: 'Cut back autumn-fruiting canes to ground level', category: 'care' },
      { months: [5, 6], tip: 'Tie in new canes as they grow', category: 'care' },
      { months: [6, 7, 8], tip: 'Net fruit to protect from birds', category: 'protect', stage: 'productive' },
      { months: [8, 9], tip: 'Cut spent summer-fruiting canes to ground after harvest', category: 'care', stage: 'productive' },
      { months: [11, 12, 1, 2, 3], tip: 'Plant new bare-root canes during dormant season', category: 'plant', stage: 'establishing' },
    ],
    rhsUrl: 'https://www.rhs.org.uk/fruit/raspberries/grow-your-own',
    botanicalName: 'Rubus idaeus',
    hardiness: 'H7',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Rubus_idaeus'
  },
  {
    id: 'blackberry',
    storage: {
      methods: ['fresh', 'freeze', 'jam'],
      freshDays: 3,
      tip: 'Open-freeze on trays, or cook into jam and bramble jelly.',
    },
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
    enhancedCompanions: [
      { plantId: 'tansy', confidence: 'traditional', mechanism: 'unknown', bidirectional: true },
      { plantId: 'hyssop', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    enhancedAvoid: [
      { plantId: 'raspberry', confidence: 'likely', mechanism: 'disease_suppression', bidirectional: true }
    ],
    perennialInfo: {
      yearsToFirstHarvest: { min: 2, max: 3 },
      productiveYears: { min: 10, max: 15 }
    },
    careTips: [
      { months: [11, 12, 1, 2, 3], tip: 'Plant bare-root canes during the dormant season and water in well', category: 'plant', stage: 'establishing' },
      { months: [4, 5, 6], tip: 'Train young canes onto wires to build a strong framework', category: 'care', stage: 'establishing' },
      { months: [6, 7], tip: 'Tie in new canes as they grow, keeping them separate from fruiting ones', category: 'care', stage: 'productive' },
      { months: [7, 8], tip: 'Net ripening fruit to keep the birds off', category: 'protect', stage: 'productive' },
      { months: [8, 9, 10], tip: 'Pick berries when fully black and they come away easily', category: 'harvest', stage: 'productive' },
      { months: [9, 10], tip: 'Cut fruited canes to the ground after harvest and tie in the new growth', category: 'care', stage: 'productive' },
    ],
    rhsUrl: 'https://www.rhs.org.uk/fruit/blackberries/grow-your-own',
    botanicalName: 'Rubus fruticosus',
    hardiness: 'H7',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Blackberry'
  },
  {
    id: 'blueberry',
    storage: {
      methods: ['fresh', 'freeze', 'jam'],
      freshDays: 7,
      tip: 'Open-freeze on trays then bag, or make jam — they keep a few days fresh in the fridge.',
    },
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
    perennialInfo: {
      yearsToFirstHarvest: { min: 2, max: 3 },
      productiveYears: { min: 15, max: 25 }
    },
    careTips: [
      { months: [10, 11, 3, 4], tip: 'Plant into ericaceous soil or a container of ericaceous compost', category: 'plant', stage: 'establishing' },
      { months: [3, 4], tip: 'Mulch with pine bark or ericaceous mulch to keep the soil acidic', category: 'care' },
      { months: [3, 4], tip: 'Top up ericaceous feed as growth begins in spring', category: 'care' },
      { months: [5, 6, 7], tip: 'Water only with collected rainwater, never tap water', category: 'care' },
      { months: [7, 8], tip: 'Net the bushes as berries turn blue to beat the birds', category: 'protect', stage: 'productive' },
      { months: [2, 3], tip: 'Prune out the oldest unproductive wood on established bushes in late winter', category: 'care', stage: 'productive' },
    ],
    rhsUrl: 'https://www.rhs.org.uk/fruit/blueberries/grow-your-own',
    botanicalName: 'Vaccinium corymbosum',
    hardiness: 'H6',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Vaccinium_corymbosum',
    enhancedCompanions: [],
    enhancedAvoid: []
  },
  {
    id: 'gooseberry',
    storage: {
      methods: ['fresh', 'freeze', 'jam'],
      freshDays: 7,
      tip: 'Top and tail, then freeze — they freeze brilliantly — or cook into gooseberry jam.',
    },
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
    enhancedCompanions: [
      { plantId: 'tansy', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    maintenance: {
      pruneMonths: [11, 12, 1, 2],
      feedMonths: [3],
      feedFrequencyDays: 28,
      feedType: 'high-potash',
      waterFrequencyDays: 5,
      notes: ['Prune to open goblet shape in winter', 'Watch for sawfly in spring']
    },
    perennialInfo: {
      yearsToFirstHarvest: { min: 2, max: 3 },
      productiveYears: { min: 15, max: 20 }
    },
    careTips: [
      { months: [11, 12, 1, 2], tip: 'Winter-prune to an open goblet shape to let in light and air', category: 'care' },
      { months: [11, 12, 1, 2, 3], tip: 'Plant bare-root bushes during the dormant season', category: 'plant', stage: 'establishing' },
      { months: [3], tip: 'Mulch around the base with compost as growth resumes', category: 'care' },
      { months: [5, 6], tip: 'Check leaves for sawfly caterpillars and pick them off before they strip the bush', category: 'protect' },
      { months: [6], tip: 'Thin the crop early for larger dessert berries and use the thinnings for cooking', category: 'harvest', stage: 'productive' },
      { months: [10, 11], tip: 'Take hardwood cuttings in autumn to raise new bushes', category: 'propagate' },
    ],
    rhsUrl: 'https://www.rhs.org.uk/fruit/gooseberries/grow-your-own',
    botanicalName: 'Ribes uva-crispa',
    hardiness: 'H7',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Gooseberry',
    enhancedAvoid: []
  },
  {
    id: 'blackcurrant',
    storage: {
      methods: ['fresh', 'freeze', 'jam'],
      freshDays: 4,
      tip: 'Freeze whole off the strig, or make jam and cordial.',
    },
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
    enhancedCompanions: [
      { plantId: 'tansy', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    maintenance: {
      pruneMonths: [11, 12],
      feedMonths: [3],
      mulchMonths: [3],
      feedFrequencyDays: 28,
      feedType: 'high-potash',
      waterFrequencyDays: 5,
      notes: ['Remove a third of oldest wood each year after fruiting']
    },
    perennialInfo: {
      yearsToFirstHarvest: { min: 2, max: 3 },
      productiveYears: { min: 10, max: 15 }
    },
    careTips: [
      { months: [11, 12, 1, 2, 3], tip: 'Plant bare-root bushes deep, then cut all stems to the ground to build a strong base', category: 'plant', stage: 'establishing' },
      { months: [3], tip: 'Mulch generously with compost and feed with high-potash, as blackcurrants are hungry feeders', category: 'care' },
      { months: [5, 6, 7], tip: 'Water well during dry spells, as the bushes love moisture', category: 'care' },
      { months: [7, 8], tip: 'Pick whole strigs once the berries are ripe and glossy', category: 'harvest', stage: 'productive' },
      { months: [8, 11, 12], tip: 'Cut a third of the oldest wood to the ground after fruiting', category: 'care', stage: 'productive' },
      { months: [10, 11], tip: 'Take hardwood cuttings in autumn to raise new bushes', category: 'propagate' },
    ],
    botanicalName: 'Ribes nigrum',
    hardiness: 'H7',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Blackcurrant',
    enhancedAvoid: []
  },
  {
    id: 'redcurrant',
    storage: {
      methods: ['fresh', 'freeze', 'jam'],
      freshDays: 4,
      tip: 'Freeze whole off the strig, or cook into redcurrant jelly for the cheeseboard and gravies.',
    },
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
    enhancedCompanions: [
      { plantId: 'tansy', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    maintenance: {
      pruneMonths: [11, 12, 1, 2],
      feedMonths: [3],
      feedFrequencyDays: 28,
      feedType: 'high-potash',
      waterFrequencyDays: 5,
      notes: ['Prune to open goblet shape like gooseberries']
    },
    perennialInfo: {
      yearsToFirstHarvest: { min: 2, max: 3 },
      productiveYears: { min: 15, max: 20 }
    },
    careTips: [
      { months: [11, 12, 1, 2, 3], tip: 'Plant bare-root bushes during the dormant season, or train as cordons on a warm wall', category: 'plant', stage: 'establishing' },
      { months: [11, 12, 1, 2], tip: 'Winter-prune to a permanent goblet framework, shortening the sideshoots', category: 'care' },
      { months: [3], tip: 'Mulch around the base with compost as growth begins', category: 'care' },
      { months: [6, 7], tip: 'Summer-prune the sideshoots back to keep the framework tidy', category: 'care', stage: 'productive' },
      { months: [7], tip: 'Net the bushes as fruit colours up to stop the birds stripping them', category: 'protect', stage: 'productive' },
      { months: [7, 8], tip: 'Pick whole strigs once every berry has turned a deep red', category: 'harvest', stage: 'productive' },
    ],
    botanicalName: 'Ribes rubrum',
    hardiness: 'H7',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Redcurrant',
    enhancedAvoid: []
  },
  {
    id: 'tayberry',
    storage: {
      methods: ['fresh', 'freeze', 'jam'],
      freshDays: 3,
      tip: 'Soft cane fruit that bruises fast; freeze on trays then bag, or boil into jam.',
    },
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
    enhancedCompanions: [
      { plantId: 'garlic', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'chives', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true }
    ],
    maintenance: {
      pruneMonths: [8, 9],
      feedMonths: [3],
      feedFrequencyDays: 28,
      feedType: 'high-potash',
      waterFrequencyDays: 5,
      notes: ['Remove fruited canes after harvest']
    },
    perennialInfo: {
      yearsToFirstHarvest: { min: 2, max: 2 },
      productiveYears: { min: 10, max: 15 }
    },
    careTips: [
      { months: [11, 12, 1, 2, 3], tip: 'Plant bare-root canes during dormancy against a sturdy support', category: 'plant', stage: 'establishing' },
      { months: [3], tip: 'Mulch around the base with compost as growth resumes', category: 'care' },
      { months: [5, 6], tip: 'Tie the new canes onto the wires as they grow', category: 'care', stage: 'productive' },
      { months: [7], tip: 'Net the fruit to protect the large aromatic berries from birds', category: 'protect', stage: 'productive' },
      { months: [7, 8], tip: 'Pick berries when deep red and softly ripe, as they bruise easily', category: 'harvest', stage: 'productive' },
      { months: [8, 9], tip: 'Cut fruited canes to the ground after harvest and tie in the new ones', category: 'care', stage: 'productive' },
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Tayberry',
    hardiness: 'H4',
    enhancedAvoid: []
  },
  {
    id: 'loganberry',
    storage: {
      methods: ['fresh', 'freeze', 'jam'],
      freshDays: 3,
      tip: 'Eat within days of picking; open-freeze the berries or make a sharp jam.',
    },
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
    enhancedCompanions: [
      { plantId: 'garlic', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true },
      { plantId: 'chives', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true }
    ],
    maintenance: {
      pruneMonths: [8, 9],
      feedMonths: [3],
      feedFrequencyDays: 28,
      feedType: 'high-potash',
      waterFrequencyDays: 5,
      notes: ['Remove fruited canes after harvest']
    },
    perennialInfo: {
      yearsToFirstHarvest: { min: 2, max: 2 },
      productiveYears: { min: 10, max: 15 }
    },
    careTips: [
      { months: [11, 12, 1, 2, 3], tip: 'Plant bare-root canes during the dormant season against strong supports', category: 'plant', stage: 'establishing' },
      { months: [3], tip: 'Mulch around the base with compost as growth resumes', category: 'care' },
      { months: [6, 7], tip: 'Tie the vigorous new canes to the wires, keeping them separate from the fruiting ones', category: 'care', stage: 'productive' },
      { months: [7], tip: 'Net the fruit to keep the birds off as it ripens', category: 'protect', stage: 'productive' },
      { months: [7, 8], tip: 'Pick the tart berries when deep red for the best flavour', category: 'harvest', stage: 'productive' },
      { months: [8, 9], tip: 'Remove the fruited canes after harvest and tie in the new growth', category: 'care', stage: 'productive' },
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Loganberry',
    hardiness: 'H4',
    enhancedAvoid: []
  },
  {
    id: 'jostaberry',
    storage: {
      methods: ['fresh', 'freeze', 'jam'],
      freshDays: 5,
      tip: 'Gooseberry-blackcurrant cross; freezes well and cooks down into a fine jam.',
    },
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
    enhancedCompanions: [
      { plantId: 'tansy', confidence: 'traditional', mechanism: 'unknown', bidirectional: true }
    ],
    maintenance: {
      pruneMonths: [11, 12, 1, 2],
      feedMonths: [3],
      feedFrequencyDays: 28,
      feedType: 'high-potash',
      waterFrequencyDays: 5,
      notes: ['Minimal pruning needed - remove dead wood']
    },
    perennialInfo: {
      yearsToFirstHarvest: { min: 2, max: 3 },
      productiveYears: { min: 15, max: 20 }
    },
    careTips: [
      { months: [11, 12, 1, 2, 3], tip: 'Plant bare-root bushes during the dormant season in an open sunny spot', category: 'plant', stage: 'establishing' },
      { months: [11, 12, 1, 2], tip: 'Prune lightly in winter, just removing old and dead wood', category: 'care' },
      { months: [3], tip: 'Mulch and feed with high-potash as growth begins in spring', category: 'care' },
      { months: [7], tip: 'Net the bushes as fruit ripens to protect it from birds', category: 'protect', stage: 'productive' },
      { months: [7, 8], tip: 'Pick berries once they turn dark, as this thornless bush is easy to harvest', category: 'harvest', stage: 'productive' },
      { months: [10, 11], tip: 'Take hardwood cuttings in autumn to raise new bushes', category: 'propagate' },
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Jostaberry',
    hardiness: 'H4',
    enhancedAvoid: []
  },
  {
    id: 'honeyberry',
    storage: {
      methods: ['fresh', 'freeze', 'jam'],
      freshDays: 4,
      tip: 'Early haskap berries are lovely fresh; freeze a glut or simmer into jam.',
    },
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
    maintenance: {
      pruneMonths: [11, 12, 1, 2],
      feedMonths: [3],
      feedFrequencyDays: 28,
      feedType: 'high-potash',
      waterFrequencyDays: 7,
      notes: ['Minimal pruning - remove dead wood only']
    },
    perennialInfo: {
      yearsToFirstHarvest: { min: 2, max: 3 },
      productiveYears: { min: 20, max: 30 }
    },
    careTips: [
      { months: [11, 12, 1, 2, 3], tip: 'Plant two different varieties during dormancy so they cross-pollinate', category: 'plant', stage: 'establishing' },
      { months: [3], tip: 'Mulch around the base with compost as growth begins', category: 'care' },
      { months: [5], tip: 'Net the early fruit, as birds find it before anything else is ripe', category: 'protect', stage: 'productive' },
      { months: [5, 6], tip: 'Pick berries once they are blue right through, well before the strawberries', category: 'harvest', stage: 'productive' },
      { months: [1, 2], tip: 'Prune only lightly in late winter, removing dead wood', category: 'care' },
      { months: [6, 7], tip: 'Water during dry spells while young plants settle in', category: 'care', stage: 'establishing' },
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Lonicera_caerulea',
    hardiness: 'H4',
    enhancedCompanions: [],
    enhancedAvoid: []
  },
  {
    id: 'goji-berry',
    storage: {
      methods: ['dry', 'freeze', 'fresh'],
      tip: 'Traditionally dried for storage; freeze the surplus or eat a few fresh.',
    },
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
    maintenance: {
      pruneMonths: [2, 3],
      feedMonths: [3],
      feedFrequencyDays: 28,
      feedType: 'high-potash',
      waterFrequencyDays: 7,
      notes: ['Control suckers to prevent spread']
    },
    perennialInfo: {
      yearsToFirstHarvest: { min: 2, max: 2 },
      productiveYears: { min: 15, max: 20 }
    },
    careTips: [
      { months: [4, 5], tip: 'Plant out young shrubs after the frosts and water them in well', category: 'plant', stage: 'establishing' },
      { months: [3], tip: 'Mulch around the base with compost as growth begins', category: 'care' },
      { months: [2, 3], tip: 'Prune to shape in late winter to keep the shrub open and manageable', category: 'care' },
      { months: [5, 6, 7], tip: 'Dig out suckers as they appear to stop the shrub spreading', category: 'care' },
      { months: [8, 9, 10], tip: 'Pick the berries when bright red and dry the surplus for winter', category: 'harvest', stage: 'productive' },
      { months: [8, 9], tip: 'Net the fruit if birds start taking the ripening berries', category: 'protect', stage: 'productive' },
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Goji',
    hardiness: 'H4',
    enhancedCompanions: [],
    enhancedAvoid: []
  },
  {
    id: 'aronia',
    storage: {
      methods: ['freeze', 'jam', 'dry'],
      tip: 'Too astringent raw; freeze, cook into juice or jam, or dry the chokeberries.',
    },
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
    maintenance: {
      pruneMonths: [11, 12, 1, 2],
      feedMonths: [3],
      feedFrequencyDays: 28,
      feedType: 'high-potash',
      waterFrequencyDays: 7,
      notes: ['Minimal pruning needed']
    },
    perennialInfo: {
      yearsToFirstHarvest: { min: 2, max: 3 },
      productiveYears: { min: 20, max: 30 }
    },
    careTips: [
      { months: [11, 12, 1, 2, 3], tip: 'Plant bare-root shrubs during the dormant season in an open spot', category: 'plant', stage: 'establishing' },
      { months: [3], tip: 'Feed and mulch with compost as growth begins in spring', category: 'care' },
      { months: [1, 2], tip: 'Thin out the oldest stems every few years in late winter, as little else is needed', category: 'care' },
      { months: [9, 10], tip: 'Pick berries for juice or jam, as they are too astringent to eat raw', category: 'harvest', stage: 'productive' },
      { months: [6, 7], tip: 'Water during dry spells while young shrubs establish', category: 'care', stage: 'establishing' },
      { months: [10], tip: 'Enjoy the fiery autumn foliage while gathering the last berries', category: 'harvest', stage: 'productive' },
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Aronia',
    hardiness: 'H4',
    enhancedCompanions: [],
    enhancedAvoid: []
  },
  {
    id: 'elderberry',
    storage: {
      methods: ['jam', 'freeze', 'dry'],
      tip: 'Always cook before eating; make cordial or jam, or freeze and dry the berries.',
    },
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
    maintenance: {
      pruneMonths: [11, 12, 1],
      feedMonths: [3],
      feedFrequencyDays: 28,
      feedType: 'high-potash',
      waterFrequencyDays: 7,
      notes: ['Prune to maintain size and shape']
    },
    perennialInfo: {
      yearsToFirstHarvest: { min: 2, max: 3 },
      productiveYears: { min: 20, max: 30 }
    },
    careTips: [
      { months: [11, 12, 1, 2, 3], tip: 'Plant bare-root shrubs during the dormant season, allowing plenty of room', category: 'plant', stage: 'establishing' },
      { months: [11, 12, 1], tip: 'Hard-prune in winter to control the size of this fast-growing shrub', category: 'care' },
      { months: [3], tip: 'Mulch around the base with compost as growth begins', category: 'care' },
      { months: [6], tip: 'Pick some flowerheads for cordial and leave the rest to set fruit', category: 'harvest', stage: 'productive' },
      { months: [8, 9], tip: 'Gather ripe berry clusters and cook them before eating, never raw', category: 'harvest', stage: 'productive' },
      { months: [8, 9], tip: 'Net the ripening berries if birds are stripping the heads', category: 'protect', stage: 'productive' },
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Sambucus',
    hardiness: 'H4',
    enhancedCompanions: [],
    enhancedAvoid: []
  },
  {
    id: 'sea-buckthorn',
    storage: {
      methods: ['freeze', 'jam'],
      tip: 'Pick the sharp berries easier once frozen on the branch; freeze for juice or jam.',
    },
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
    maintenance: {
      pruneMonths: [11, 12, 1],
      // No feedMonths — a nitrogen-fixer, deliberately never fed (see care tip).
      waterFrequencyDays: 14,
      notes: ['Minimal care - very tough plant']
    },
    perennialInfo: {
      yearsToFirstHarvest: { min: 3, max: 4 },
      productiveYears: { min: 20, max: 30 }
    },
    careTips: [
      { months: [11, 12, 1, 2, 3], tip: 'Plant both a male and a female shrub during dormancy so the females fruit', category: 'plant', stage: 'establishing' },
      { months: [11, 12, 1], tip: 'Prune to shape in winter, as this tough shrub needs little else', category: 'care' },
      { months: [4, 5], tip: 'Leave feeding alone, as the roots fix their own nitrogen even in poor soil', category: 'care' },
      { months: [9, 10], tip: 'Pick the sharp berries once frosted, as they strip from the branch more easily', category: 'harvest', stage: 'productive' },
      { months: [6, 7], tip: 'Water occasionally while young plants settle in, then leave them to it', category: 'care', stage: 'establishing' },
      { months: [10], tip: 'Freeze surplus berries straight away to keep their vitamin C', category: 'harvest', stage: 'productive' },
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Hippophae',
    hardiness: 'H4',
    enhancedCompanions: [],
    enhancedAvoid: []
  }
]
