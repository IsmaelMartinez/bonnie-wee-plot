/**
 * User's seed varieties database
 * Tracks specific varieties, suppliers, and years used
 * Extracted from the Allotment Planning Workbook Excel file
 */

import { PlantVariety } from '@/types/garden-planner'

export const myVarieties: PlantVariety[] = [
  // ============ PEAS ============
  {
    id: 'var-pea-kelvedon',
    plantId: 'peas',
    name: 'Kelvedon Wonder',
    supplier: 'Organic Gardening',
    price: 2.99,
    yearsUsed: [2024, 2025],
    notes: 'Reliable performer, good for Scotland. Compact plants.'
  },
  {
    id: 'var-pea-jumbo',
    plantId: 'peas',
    name: 'Jumbo',
    yearsUsed: [2024],
    notes: 'Large pods'
  },

  // ============ BROAD BEANS ============
  {
    id: 'var-broad-bean-ratio',
    plantId: 'broad-beans',
    name: 'Ratio',
    supplier: 'Organic Gardening',
    price: 2.99,
    yearsUsed: [2025],
    notes: 'First year trying this variety'
  },

  // ============ FRENCH BEANS ============
  {
    id: 'var-french-bean-borlotti',
    plantId: 'french-beans',
    name: 'Borlotti Stokkievitsboon',
    supplier: 'Organic Gardening',
    price: 3.99,
    yearsUsed: [2025],
    notes: 'Climbing borlotti type, good for drying'
  },

  // ============ POTATOES ============
  {
    id: 'var-potato-charlotte',
    plantId: 'potatoes',
    name: 'Charlotte',
    supplier: 'Potato House',
    price: 7.30,
    yearsUsed: [2024],
    notes: 'Salad potato, waxy texture'
  },
  {
    id: 'var-potato-heidi',
    plantId: 'potatoes',
    name: 'Heidi Red',
    supplier: 'Potato House',
    price: 9.25,
    yearsUsed: [2024],
    notes: 'Red-skinned variety'
  },
  {
    id: 'var-potato-colleen',
    plantId: 'potatoes',
    name: 'Colleen (Organic Early)',
    supplier: 'Allotment',
    price: 2.50,
    yearsUsed: [2025],
    notes: 'Early variety, organic seed potatoes'
  },
  {
    id: 'var-potato-setanta',
    plantId: 'potatoes',
    name: 'Setanta (Organic Main)',
    supplier: 'Allotment',
    price: 2.50,
    yearsUsed: [2025],
    notes: 'Maincrop variety, good blight resistance'
  },

  // ============ ONIONS ============
  {
    id: 'var-onion-keravel',
    plantId: 'onions',
    name: 'Keravel Pink (Spring)',
    supplier: 'Organic Gardening',
    price: 11.99,
    yearsUsed: [2024],
    notes: 'Spring planted sets, pink/red colour'
  },
  {
    id: 'var-onion-senshyu',
    plantId: 'onions',
    name: 'Senshyu (White Autumn)',
    yearsUsed: [2025],
    notes: 'Japanese overwintering onion sets'
  },
  {
    id: 'var-onion-electric',
    plantId: 'onions',
    name: 'Electric (Red Autumn)',
    supplier: 'Organic Gardening',
    price: 9.99,
    yearsUsed: [2025],
    notes: 'Red autumn sets, RHS recommended'
  },
  {
    id: 'var-onion-centurion',
    plantId: 'onions',
    name: 'Centurion',
    supplier: 'Organic Gardening',
    price: 9.99,
    yearsUsed: [2025],
    notes: 'Spring planted sets'
  },

  // ============ SPRING ONIONS ============
  {
    id: 'var-spring-onion-parade',
    plantId: 'spring-onions',
    name: 'Parade (Organic)',
    supplier: 'Organic Gardening',
    price: 2.49,
    yearsUsed: [2024],
    notes: 'Organic seeds'
  },
  {
    id: 'var-spring-onion-lilia',
    plantId: 'spring-onions',
    name: 'Lilia',
    supplier: 'Organic Gardening',
    price: 0.89,
    yearsUsed: [2025],
    notes: 'Budget option'
  },

  // ============ GARLIC ============
  {
    id: 'var-garlic-picardy',
    plantId: 'garlic',
    name: 'Picardy Wight (Spring)',
    yearsUsed: [2024],
    notes: 'Spring planted garlic'
  },
  {
    id: 'var-garlic-kingsland',
    plantId: 'garlic',
    name: 'Kingsland Wight',
    supplier: 'Organic Gardening',
    price: 9.99,
    yearsUsed: [2025],
    notes: 'Autumn planted, hardneck variety'
  },
  {
    id: 'var-garlic-caulk',
    plantId: 'garlic',
    name: 'Caulk Wight (Hardneck)',
    supplier: 'Allotment',
    price: 2.50,
    yearsUsed: [2025],
    notes: 'Hardneck variety for autumn 2025 planting'
  },
  {
    id: 'var-garlic-flavor',
    plantId: 'garlic',
    name: 'Flavor',
    supplier: 'Organic Gardening',
    price: 9.99,
    yearsUsed: [],
    notes: 'ROTTEN - arrived in poor condition, not used'
  },

  // ============ LEEKS ============
  {
    id: 'var-leek-tape',
    plantId: 'leeks',
    name: 'Leeks Seeds Tape',
    supplier: 'Organic Gardening',
    price: 2.99,
    yearsUsed: [2024],
    notes: 'Convenient seed tape format'
  },
  {
    id: 'var-leek-lancelot',
    plantId: 'leeks',
    name: 'Lancelot',
    supplier: 'Allotment',
    price: 4.00,
    yearsUsed: [2025],
    notes: 'Approximately 50 in bunch, good variety for Scotland'
  },

  // ============ CARROTS ============
  {
    id: 'var-carrot-nantes',
    plantId: 'carrots',
    name: 'Nantes 2 (Organic)',
    supplier: 'Organic Gardening',
    price: 1.99,
    yearsUsed: [2024, 2025],
    notes: 'Reliable variety, organic seeds. Used both years.'
  },

  // ============ BEETROOT ============
  {
    id: 'var-beetroot-rhonda',
    plantId: 'beetroot',
    name: 'Rhonda',
    supplier: 'Organic Gardening',
    price: 2.99,
    yearsUsed: [2025],
    notes: 'Round variety'
  },

  // ============ COURGETTES ============
  {
    id: 'var-courgette-defender',
    plantId: 'courgettes',
    name: 'Defender F1',
    yearsUsed: [2024],
    notes: 'Very productive'
  },
  {
    id: 'var-courgette-wave',
    plantId: 'courgettes',
    name: 'Wave Climber',
    supplier: 'Organic Gardening',
    price: 3.99,
    yearsUsed: [2025],
    notes: 'Climbing courgette variety - saves space'
  },

  // ============ PUMPKIN ============
  {
    id: 'var-pumpkin-spooky',
    plantId: 'pumpkin',
    name: 'Spooky Face',
    yearsUsed: [2024],
    notes: 'Good for carving'
  },

  // ============ SPINACH ============
  {
    id: 'var-spinach-palco',
    plantId: 'spinach',
    name: 'Palco F1',
    supplier: 'Organic Gardening',
    price: 2.49,
    yearsUsed: [2025],
    notes: 'F1 hybrid, bolt resistant'
  },

  // ============ CHARD ============
  {
    id: 'var-chard-rainbow',
    plantId: 'chard',
    name: 'Organic Rainbow Chard',
    supplier: 'Organic Gardening',
    yearsUsed: [2024, 2025],
    notes: 'Colorful stems, very hardy for Scotland'
  },

  // ============ LETTUCE ============
  {
    id: 'var-lettuce-marvel',
    plantId: 'lettuce',
    name: 'Marvel of 4 Seasons (Organic)',
    supplier: 'Organic Gardening',
    yearsUsed: [2024, 2025],
    notes: 'Hardy variety, good for extended season'
  },

  // ============ PAK CHOI (stored as chard type) ============
  {
    id: 'var-pak-choi-baby',
    plantId: 'chard', // Using chard as proxy - pak choi not in database
    name: 'Pak Choi Baby',
    supplier: 'Organic Gardening',
    price: 2.99,
    yearsUsed: [2025],
    notes: 'Compact Asian greens variety, quick growing'
  },

  // ============ CAULIFLOWER ============
  {
    id: 'var-cauliflower-skywalker',
    plantId: 'cauliflower',
    name: 'Skywalker F1 (Organic)',
    supplier: 'Organic Gardening',
    yearsUsed: [2024, 2025],
    notes: 'Good for Scottish climate'
  },

  // ============ SWEETCORN ============
  // Note: Sweetcorn not in main vegetable database
  // {
  //   id: 'var-sweetcorn-swift',
  //   plantId: 'sweetcorn',
  //   name: 'Swift F1 Hybrid',
  //   supplier: 'Organic Gardening',
  //   yearsUsed: [2024, 2025],
  //   notes: 'Early variety, good for cooler climates'
  // }
]

// Helper functions
export function getVarietiesByVegetable(plantId: string): PlantVariety[] {
  return myVarieties.filter(v => v.plantId === plantId)
}

export function getVarietyById(varietyId: string): PlantVariety | undefined {
  return myVarieties.find(v => v.id === varietyId)
}

export function getVarietiesUsedInYear(year: number): PlantVariety[] {
  return myVarieties.filter(v => v.yearsUsed.includes(year))
}

export function getVarietiesBySupplier(supplier: string): PlantVariety[] {
  return myVarieties.filter(v => v.supplier === supplier)
}

// Get unique suppliers
export function getSuppliers(): string[] {
  const suppliers = myVarieties
    .map(v => v.supplier)
    .filter((s): s is string => s !== undefined)
  return [...new Set(suppliers)].sort()
}

// Calculate total spend for a year
export function getTotalSpendForYear(year: number): number {
  return myVarieties
    .filter(v => v.yearsUsed.includes(year) && v.price)
    .reduce((sum, v) => sum + (v.price || 0), 0)
}

