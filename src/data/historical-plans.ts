/**
 * Historical planting data for 2024 and 2025 seasons
 * Updated to use the correct 9-area bed structure
 * 
 * Bed mapping from old Excel data:
 * - Excel "Bed 1" → B2 (garlic, onion, broad beans)
 * - Excel "Bed 2" → B1 (pak choi, cauliflower, carrots)
 * - Excel "Bed 3" → A (peas)
 * - Excel "Bed 4" → B1'/B2' (new garlic)
 * - Excel "Bed 5" → D (potatoes)
 * - Excel "Bed 6" → raspberries
 * - Excel "Bed C" → C (problem - shaded)
 * - New Bed E → French beans + sunflowers (problem)
 */

import { SeasonPlan, BedPlan, PlantedVariety, AllotmentHistoryData, PhysicalBedId } from '@/types/garden-planner'
import { allotmentLayout } from './allotment-layout'

// ============ 2024 SEASON DATA ============

const season2024Plantings: PlantedVariety[] = [
  // Bed B2 (was "Bed 1") - 2024: Peas, French Beans
  {
    id: '2024-pea-jumbo',
    plantId: 'peas',
    varietyName: 'Jumbo',
    bedId: 'B2',
    sowDate: '2024-03-16',
    transplantDate: '2024-04-29',
    notes: 'Sown 16th March, planted 29th April'
  },
  {
    id: '2024-pea-kelvedon',
    plantId: 'peas',
    varietyName: 'Kelvedon Wonder',
    bedId: 'B2',
    sowDate: '2024-03-16',
    transplantDate: '2024-04-29',
    notes: 'Sown 16th March, planted 29th April'
  },
  {
    id: '2024-french-beans-b2',
    plantId: 'french-beans',
    varietyName: 'French Beans',
    bedId: 'B2',
    sowDate: '2024-05-12',
    notes: 'Sown outside 12th May'
  },

  // Bed B1 (was "Bed 2") - 2024: Potatoes, Onions, Spring Onions
  {
    id: '2024-potato-charlotte',
    plantId: 'potatoes',
    varietyName: 'Charlotte Seed',
    bedId: 'B1',
    sowDate: '2024-04-16',
    quantity: 16,
    notes: 'Potato House - 16 planted'
  },
  {
    id: '2024-potato-heidi',
    plantId: 'potatoes',
    varietyName: 'Heidi Red Seed',
    bedId: 'B1',
    sowDate: '2024-03-13',
    quantity: 11,
    notes: 'Potato House - 6 planted 13th, 5 more 24th, planted out 16th April'
  },
  {
    id: '2024-onion-keravel',
    plantId: 'onions',
    varietyName: 'Keravel Pink (Spring)',
    bedId: 'B1',
    sowDate: '2024-03-09',
    notes: 'Organic Gardening - sown 9th March'
  },
  {
    id: '2024-spring-onion-parade',
    plantId: 'spring-onions',
    varietyName: 'Parade (Organic)',
    bedId: 'B1',
    sowDate: '2024-03-24',
    notes: 'Organic Gardening'
  },

  // Bed A (was "Bed 3") - 2024: Garlic, Carrots, Leeks
  {
    id: '2024-garlic-picardy',
    plantId: 'garlic',
    varietyName: 'Picardy Wight (Spring)',
    bedId: 'A',
    sowDate: '2024-02-17',
    notes: 'Spring planted garlic'
  },
  {
    id: '2024-carrots-nantes',
    plantId: 'carrots',
    varietyName: 'Nantes 2 (Organic)',
    bedId: 'A',
    sowDate: '2024-03-16',
    notes: 'First sowing 16th March'
  },
  {
    id: '2024-leeks-tape',
    plantId: 'leeks',
    varietyName: 'Leeks Seeds Tape',
    bedId: 'A',
    sowDate: '2024-04-20',
    transplantDate: '2024-05-04',
    notes: 'Sown 20th April, transplanted 4th May'
  },

  // Bed C (problem bed) - 2024: Pumpkins, Courgettes (POOR results)
  {
    id: '2024-pumpkin-spooky',
    plantId: 'pumpkin',
    varietyName: 'Spooky Face Pumpkins',
    bedId: 'C',
    sowDate: '2024-04-21',
    transplantDate: '2024-06-01',
    quantity: 4,
    success: 'fair',
    notes: 'Sown 21st April (4), planted out 1st June. Poor results due to shade.'
  },
  {
    id: '2024-courgette-defender',
    plantId: 'courgettes',
    varietyName: 'Defender F1',
    bedId: 'C',
    sowDate: '2024-04-21',
    transplantDate: '2024-06-01',
    quantity: 4,
    success: 'poor',
    notes: 'Sown 21st April (4), planted out 1st June. Hardly worked - likely due to tree shade.'
  },

  // Bed D (was "Bed 5") - 2024: Brassicas (late sown)
  {
    id: '2024-rainbow-chard',
    plantId: 'chard',
    varietyName: 'Organic Rainbow Chard',
    bedId: 'D',
    sowDate: '2024-08-24',
    success: 'good',
    notes: 'Late sowing for overwintering'
  },
  {
    id: '2024-beetroot-rhonda',
    plantId: 'beetroot',
    varietyName: 'Organic Beetroot Rhonda',
    bedId: 'D',
    sowDate: '2024-08-24',
    success: 'good',
    notes: 'Late sowing'
  },
  {
    id: '2024-lettuce-marvel',
    plantId: 'lettuce',
    varietyName: 'Organic Marvel of 4 Seasons',
    bedId: 'D',
    sowDate: '2024-08-24',
    success: 'good',
    notes: 'Late sowing'
  },
  {
    id: '2024-cauliflower-skywalker',
    plantId: 'cauliflower',
    varietyName: 'Organic Skywalker F1',
    bedId: 'D',
    sowDate: '2024-08-24',
    success: 'fair',
    notes: 'Late sowing'
  },

  // Bed E - 2024: French Beans + Sunflowers (POOR - first year cultivating)
  {
    id: '2024-french-beans-e',
    plantId: 'french-beans',
    varietyName: 'French Beans',
    bedId: 'E',
    success: 'poor',
    notes: 'First year cultivating this area. Competition with sunflowers was bad idea.'
  },
  {
    id: '2024-sunflower-e',
    plantId: 'sunflower',
    varietyName: 'Sunflower',
    bedId: 'E',
    success: 'fair',
    notes: 'Competed with beans for resources'
  }
]

const season2024Beds: BedPlan[] = [
  {
    bedId: 'A',
    rotationGroup: 'alliums',
    plantings: season2024Plantings.filter(p => p.bedId === 'A')
  },
  {
    bedId: 'B1',
    rotationGroup: 'solanaceae',
    plantings: season2024Plantings.filter(p => p.bedId === 'B1')
  },
  {
    bedId: 'B2',
    rotationGroup: 'legumes',
    plantings: season2024Plantings.filter(p => p.bedId === 'B2')
  },
  {
    bedId: 'C',
    rotationGroup: 'cucurbits',
    plantings: season2024Plantings.filter(p => p.bedId === 'C')
  },
  {
    bedId: 'D',
    rotationGroup: 'brassicas',
    plantings: season2024Plantings.filter(p => p.bedId === 'D')
  },
  {
    bedId: 'E',
    rotationGroup: 'legumes',
    plantings: season2024Plantings.filter(p => p.bedId === 'E')
  }
]

export const season2024: SeasonPlan = {
  id: 'season-2024',
  year: 2024,
  beds: season2024Beds,
  notes: 'First full documented season. Good pea harvest in B2, potatoes did well in B1. Bed C and E had problems - C too shaded, E first year with competition issues.',
  createdAt: '2024-01-15T00:00:00Z',
  updatedAt: '2024-12-01T00:00:00Z'
}

// ============ 2025 SEASON DATA ============

const season2025Plantings: PlantedVariety[] = [
  // Bed A (was "Bed 3") - 2025: Peas → transitioning to Strawberries
  {
    id: '2025-pea-kelvedon',
    plantId: 'peas',
    varietyName: 'Kelvedon Wonder',
    bedId: 'A',
    success: 'good',
    notes: 'Organic Gardening - reliable performer. Will become strawberry bed.'
  },
  {
    id: '2025-spinach-palco',
    plantId: 'spinach',
    varietyName: 'Palco F1',
    bedId: 'A',
    notes: 'Organic Gardening'
  },
  {
    id: '2025-broad-bean-ratio',
    plantId: 'broad-beans',
    varietyName: 'Ratio',
    bedId: 'A',
    notes: 'Organic Gardening'
  },

  // Bed B1 (was "Bed 2") - 2025: Pak choi, Cauliflower, Carrots (Brassicas)
  {
    id: '2025-pak-choi',
    plantId: 'chard', // Using chard as proxy - pak choi not in database
    varietyName: 'Pak Choi Baby',
    bedId: 'B1',
    success: 'good',
    notes: 'Organic Gardening - interplanted with cauliflower (Asian greens)'
  },
  {
    id: '2025-cauliflower-skywalker',
    plantId: 'cauliflower',
    varietyName: 'Skywalker F1 (Organic)',
    bedId: 'B1',
    success: 'fair',
    notes: 'Organic Gardening'
  },
  {
    id: '2025-carrots-nantes',
    plantId: 'carrots',
    varietyName: 'Nantes 2 (Organic)',
    bedId: 'B1',
    success: 'good',
    notes: 'Organic Gardening - same reliable variety as 2024'
  },

  // Bed B1' (small bed above B1) - 2025: Strawberries (moving to A in 2026)
  {
    id: '2025-strawberry-b1prime',
    plantId: 'strawberries',
    varietyName: 'Strawberries',
    bedId: 'B1-prime',
    success: 'good',
    notes: 'Existing strawberry patch - will move to Bed A for 2026'
  },

  // Bed B2 (was "Bed 1") - 2025: Garlic, Onion, Broad beans (Alliums)
  {
    id: '2025-garlic-kingsland',
    plantId: 'garlic',
    varietyName: 'Kingsland Wight',
    bedId: 'B2',
    sowDate: '2024-10-24',
    success: 'good',
    notes: 'Organic Gardening - autumn planted'
  },
  {
    id: '2025-onion-senshyu',
    plantId: 'onions',
    varietyName: 'Senshyu (White Autumn)',
    bedId: 'B2',
    sowDate: '2024-10-24',
    success: 'good',
    notes: 'Autumn planted sets'
  },
  {
    id: '2025-onion-electric',
    plantId: 'onions',
    varietyName: 'Electric (Red Autumn)',
    bedId: 'B2',
    sowDate: '2024-10-24',
    success: 'good',
    notes: 'Organic Gardening - autumn planted'
  },
  {
    id: '2025-onion-centurion',
    plantId: 'onions',
    varietyName: 'Centurion',
    bedId: 'B2',
    success: 'good',
    notes: 'Organic Gardening - spring sets'
  },
  {
    id: '2025-spring-onion-lilia',
    plantId: 'spring-onions',
    varietyName: 'Lilia',
    bedId: 'B2',
    success: 'good',
    notes: 'Organic Gardening'
  },
  {
    id: '2025-broad-bean-b2',
    plantId: 'broad-beans',
    varietyName: 'Ratio',
    bedId: 'B2',
    notes: 'Organic Gardening - interplanted'
  },

  // Bed B2' (small bed above B2) - 2025: Peas (garlic didn't make it in time)
  {
    id: '2025-peas-b2prime',
    plantId: 'peas',
    varietyName: 'Kelvedon Wonder',
    bedId: 'B2-prime',
    success: 'good',
    notes: 'Planted peas as garlic didn\'t arrive in time'
  },

  // Bed C (problem bed - shaded) - 2025: Peas, French Beans, Courgette (POOR)
  {
    id: '2025-peas-c',
    plantId: 'peas',
    varietyName: 'Kelvedon Wonder',
    bedId: 'C',
    success: 'poor',
    notes: 'Too shaded - need to reconsider what to grow here'
  },
  {
    id: '2025-french-beans-borlotti',
    plantId: 'french-beans',
    varietyName: 'Borlotti Stokkievitsboon',
    bedId: 'C',
    success: 'fair',
    notes: 'Organic Gardening - struggled with shade'
  },
  {
    id: '2025-leeks-lancelot',
    plantId: 'leeks',
    varietyName: 'Lancelot',
    bedId: 'C',
    sowDate: '2025-06-01',
    quantity: 50,
    success: 'good',
    notes: 'Allotment - approximately 50 in bunch. Leeks tolerate shade better.'
  },
  {
    id: '2025-courgette-wave',
    plantId: 'courgettes',
    varietyName: 'Wave Climber',
    bedId: 'C',
    success: 'fair',
    notes: 'Organic Gardening - climbing variety'
  },

  // Bed D (was "Bed 5") - 2025: Potatoes (Solanaceae)
  {
    id: '2025-potato-colleen',
    plantId: 'potatoes',
    varietyName: 'Colleen (Organic Early)',
    bedId: 'D',
    sowDate: '2025-02-01',
    success: 'excellent',
    notes: 'Allotment - early variety'
  },
  {
    id: '2025-potato-setanta',
    plantId: 'potatoes',
    varietyName: 'Setanta (Organic Main)',
    bedId: 'D',
    sowDate: '2025-02-01',
    success: 'excellent',
    notes: 'Allotment - maincrop variety'
  },

  // Bed E (problem bed - first year) - 2025: French Beans + Sunflowers (POOR)
  {
    id: '2025-french-beans-e',
    plantId: 'french-beans',
    varietyName: 'French Beans',
    bedId: 'E',
    success: 'poor',
    notes: 'Competition with sunflowers again. Plan to retry without sunflowers.'
  },
  {
    id: '2025-sunflower-e',
    plantId: 'sunflower',
    varietyName: 'Medium Red Flower',
    bedId: 'E',
    success: 'fair',
    notes: 'Organic Gardening - competed with beans'
  }
]

const season2025Beds: BedPlan[] = [
  {
    bedId: 'A',
    rotationGroup: 'legumes',
    plantings: season2025Plantings.filter(p => p.bedId === 'A')
  },
  {
    bedId: 'B1',
    rotationGroup: 'brassicas',
    plantings: season2025Plantings.filter(p => p.bedId === 'B1')
  },
  {
    bedId: 'B1-prime',
    rotationGroup: 'permanent', // Strawberries
    plantings: season2025Plantings.filter(p => p.bedId === 'B1-prime')
  },
  {
    bedId: 'B2',
    rotationGroup: 'alliums',
    plantings: season2025Plantings.filter(p => p.bedId === 'B2')
  },
  {
    bedId: 'B2-prime',
    rotationGroup: 'legumes', // Peas (garlic didn't arrive)
    plantings: season2025Plantings.filter(p => p.bedId === 'B2-prime')
  },
  {
    bedId: 'C',
    rotationGroup: 'legumes', // Mixed - struggled due to shade
    plantings: season2025Plantings.filter(p => p.bedId === 'C')
  },
  {
    bedId: 'D',
    rotationGroup: 'solanaceae',
    plantings: season2025Plantings.filter(p => p.bedId === 'D')
  },
  {
    bedId: 'E',
    rotationGroup: 'legumes',
    plantings: season2025Plantings.filter(p => p.bedId === 'E')
  }
]

export const season2025: SeasonPlan = {
  id: 'season-2025',
  year: 2025,
  beds: season2025Beds,
  notes: 'Split B beds into B1/B2 with prime sections. Bed A transitioning to strawberries. Bed C still problematic (shade). Bed E retry failed with sunflower competition. Some garlic arrived rotten.',
  createdAt: '2024-10-15T00:00:00Z',
  updatedAt: '2025-12-01T00:00:00Z'
}

// ============ 2025 FLOWERS DATA ============
export const flowers2025 = [
  { name: 'Sweet Pea', variety: 'Old Fashioned Mixed', supplier: 'Organic Gardening' },
  { name: 'Cornflower', variety: 'Blue Diadem', supplier: 'Organic Gardening' },
  { name: 'Marigold', variety: 'Zenith Mixed F1 (Afro-French Red)', supplier: 'Organic Gardening' },
  { name: 'Marigold', variety: 'Disco (Dwarf French)', supplier: 'Organic Gardening' },
  { name: 'Sunflower', variety: 'Medium Red Flower', supplier: 'Organic Gardening' },
  { name: 'Cosmos', variety: 'Sonata Mixed', supplier: 'Organic Gardening' },
  { name: 'Zinnia', variety: 'Dahlia Flowered Mixed', supplier: 'Organic Gardening' },
  { name: 'Lupin', variety: 'Russell Mixed', supplier: 'Organic Gardening' },
  { name: 'Nasturtium', variety: 'Tom Thumb', supplier: 'Organic Gardening' }
]

// ============ COMBINED HISTORY DATA ============

export const allotmentHistoryData: AllotmentHistoryData = {
  version: 1,
  layout: allotmentLayout,
  varieties: [], // Will be populated from my-varieties.ts
  seasons: [season2024, season2025],
  currentYear: new Date().getFullYear()
}

// Helper functions
export function getSeasonByYear(year: number): SeasonPlan | undefined {
  return allotmentHistoryData.seasons.find(s => s.year === year)
}

export function getBedPlanForYear(year: number, bedId: PhysicalBedId): BedPlan | undefined {
  const season = getSeasonByYear(year)
  return season?.beds.find(b => b.bedId === bedId)
}

export function getPlantingsForBed(year: number, bedId: PhysicalBedId): PlantedVariety[] {
  const bedPlan = getBedPlanForYear(year, bedId)
  return bedPlan?.plantings || []
}

export function getRotationGroupForBed(year: number, bedId: PhysicalBedId): string | undefined {
  const bedPlan = getBedPlanForYear(year, bedId)
  return bedPlan?.rotationGroup
}

// Get all years with data
export function getAvailableYears(): number[] {
  return allotmentHistoryData.seasons.map(s => s.year).sort((a, b) => b - a)
}

// Get problem beds summary
export function getProblemBedsSummary(): { bedId: PhysicalBedId; issue: string; suggestion: string }[] {
  return [
    {
      bedId: 'C',
      issue: 'Shaded by apple tree - crops struggle',
      suggestion: 'Consider shade-tolerant perennials: asparagus, rhubarb expansion, or strawberry rotation'
    },
    {
      bedId: 'E',
      issue: 'First year area - competition issues with sunflowers',
      suggestion: 'Retry with just beans (no sunflowers) or try perennials like artichokes'
    }
  ]
}
