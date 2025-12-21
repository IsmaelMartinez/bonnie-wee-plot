/**
 * Physical allotment layout data
 * Updated to reflect the correct 9-area bed structure
 * 
 * Layout (North at top):
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │  E (problem)  │  WILDISH AREA     │  COMPOST  │  PATH  │                 │
 * │  ┌─────────┐  ┌──────────┐ ┌──────────┐  ┌──────┐ ┌─────┐                │
 * │  │ Rhubarb │  │   B2'    │ │   B1'    │  │Berry │ │  A  │                │
 * │  │ Apple   │  │  garlic  │ │ strawb   │  │area  │ │     │                │
 * │  │ Tree    │  ├──────────┤ ├──────────┤  └──────┘ └─────┘                │
 * │  │ ┌─────┐ │  │   B2     │ │   B1     │           ┌─────┐                │
 * │  │ │  C  │ │  │ Garlic   │ │ Pak choi │           │RASP │                │
 * │  │ │POOR │ │  │ Onion    │ │ Cauli    │           │     │                │
 * │  │ └─────┘ │  │ Broad    │ │ Carrots  │           └─────┘                │
 * │  │ Straw+  │  │ beans    │ │          │                                  │
 * │  │ Damson  │  └──────────┘ └──────────┘                                  │
 * │  └─────────┘        small path                                           │
 * │  ┌─────────┐  ┌───────────────────────┐   ┌──────────────┐               │
 * │  │Flowers  │  │        BED D          │   │Shed/Herbs    │               │
 * │  │Apple    │  │      POTATOES         │   │Blackcurrant  │               │
 * │  └─────────┘  └───────────────────────┘   └──────────────┘               │
 * └──────────────────────────────────────────────────────────────────────────┘
 */

import { 
  AllotmentLayout, 
  PhysicalBed, 
  PermanentPlanting, 
  InfrastructureItem,
  PhysicalBedId
} from '@/types/garden-planner'

// Physical bed definitions - 9 distinct areas
export const physicalBeds: PhysicalBed[] = [
  // Main rotation beds
  {
    id: 'A',
    name: 'Bed A',
    description: 'Far right bed next to berry area. Currently peas, transitioning to strawberries.',
    status: 'rotation',
    rotationGroup: 'legumes'
  },
  {
    id: 'B1',
    name: 'Bed B1',
    description: 'Long center-right column. Main growing bed for brassicas and roots.',
    status: 'rotation',
    rotationGroup: 'brassicas'
  },
  {
    id: 'B1-prime',
    name: "Bed B1'",
    description: 'Top section of B1 column. Strawberries - will move to Bed A for 2026.',
    status: 'rotation',
    rotationGroup: 'permanent'
  },
  {
    id: 'B2',
    name: 'Bed B2',
    description: 'Long center-left column. Main growing bed for alliums and legumes.',
    status: 'rotation',
    rotationGroup: 'alliums'
  },
  {
    id: 'B2-prime',
    name: "Bed B2'",
    description: 'Top section of B2 column. Peas in 2025 (garlic didn\'t arrive in time).',
    status: 'rotation',
    rotationGroup: 'legumes'
  },
  {
    id: 'D',
    name: 'Bed D',
    description: 'Large lower-center area. Main potato bed.',
    status: 'rotation',
    rotationGroup: 'solanaceae'
  },
  
  // Problem beds - need special attention
  {
    id: 'C',
    name: 'Bed C',
    description: 'Under apple tree on left side. Shaded and poor results.',
    status: 'problem',
    problemNotes: 'Too shaded by apple tree. Peas did poorly. Consider shade-tolerant perennials like asparagus or rhubarb expansion.'
  },
  {
    id: 'E',
    name: 'Bed E',
    description: 'Top left corner. First year cultivating this area.',
    status: 'problem',
    problemNotes: 'French beans + sunflowers competition failed. Retry with just beans or consider perennials.'
  },
  
  // Perennial area
  {
    id: 'raspberries',
    name: 'Raspberry Area',
    description: 'Large raspberry patch on right side. Consider reducing size.',
    status: 'perennial',
    problemNotes: 'Area is too large - plan to reduce and reclaim space for rotation beds.'
  }
]

// Permanent plantings (fruit trees, berries, perennials)
export const permanentPlantings: PermanentPlanting[] = [
  // Fruit Trees
  {
    id: 'apple-north',
    name: 'Apple Tree (North)',
    type: 'fruit-tree',
    notes: 'Near rhubarb, creates shade over Bed C'
  },
  {
    id: 'apple-south-west',
    name: 'Apple Tree (South West)',
    type: 'fruit-tree',
    notes: 'Near flower beds'
  },
  {
    id: 'apple-south',
    name: 'Apple Tree (South)',
    type: 'fruit-tree',
    notes: 'In southern section near Bed D'
  },
  {
    id: 'cherry-tree',
    name: 'Cherry Tree',
    type: 'fruit-tree',
    notes: 'Within Bed D area'
  },
  {
    id: 'damson',
    name: 'Damson Tree',
    type: 'fruit-tree',
    notes: 'Left side with strawberries around it'
  },
  
  // Berries
  {
    id: 'strawberries-damson',
    name: 'Strawberries (around Damson)',
    type: 'berry',
    notes: 'Patch around damson tree on left side'
  },
  {
    id: 'strawberries-b1prime',
    name: "Strawberries (B1')",
    type: 'berry',
    notes: 'In B1 prime bed, interplanted with garlic'
  },
  {
    id: 'raspberries-main',
    name: 'Raspberries',
    type: 'berry',
    notes: 'Large patch on right side - needs reducing'
  },
  {
    id: 'blueberry',
    name: 'Blueberry',
    type: 'berry',
    notes: 'In berry area near Bed A'
  },
  {
    id: 'gooseberry',
    name: 'Gooseberry',
    type: 'berry',
    notes: 'In berry area near Bed A'
  },
  {
    id: 'blackcurrant',
    name: 'Blackcurrant',
    type: 'berry',
    notes: 'Near shed area in south'
  },
  
  // Perennial Vegetables
  {
    id: 'rhubarb',
    name: 'Rhubarb',
    type: 'perennial-veg',
    notes: 'Established crown near apple tree'
  },
  
  // Herbs
  {
    id: 'oregano',
    name: 'Oregano',
    type: 'herb',
    notes: 'Southern area'
  },
  {
    id: 'herbs-shed',
    name: 'Herb Bed',
    type: 'herb',
    notes: 'Near shed'
  }
]

// Infrastructure items
export const infrastructure: InfrastructureItem[] = [
  {
    id: 'compost-area',
    type: 'compost',
    name: 'Compost Area',
  },
  {
    id: 'compost-hot',
    type: 'compost',
    name: 'Hot Compost Bin',
  },
  {
    id: 'shed',
    type: 'shed',
    name: 'Garden Shed',
  },
  {
    id: 'water-butt',
    type: 'water-butt',
    name: 'Water Butt',
  },
  {
    id: 'path-main',
    type: 'path',
    name: 'Main Path (East side)',
  },
  {
    id: 'path-between-beds',
    type: 'path',
    name: 'Path between B beds and D',
  },
  {
    id: 'wildish-area',
    type: 'other',
    name: 'Wildish Area (uncultivated)',
  }
]

// Complete allotment layout
export const allotmentLayout: AllotmentLayout = {
  id: 'edinburgh-allotment',
  name: 'My Edinburgh Allotment',
  gridRows: 25,
  gridCols: 20,
  beds: physicalBeds,
  permanentPlantings: permanentPlantings,
  infrastructure: infrastructure
}

// Helper to get bed by ID
export function getBedById(bedId: PhysicalBedId): PhysicalBed | undefined {
  return physicalBeds.find(b => b.id === bedId)
}

// Get beds by status
export function getBedsByStatus(status: 'rotation' | 'problem' | 'perennial'): PhysicalBed[] {
  return physicalBeds.filter(b => b.status === status)
}

// Get all rotation beds (excludes problem and perennial)
export function getRotationBeds(): PhysicalBed[] {
  return getBedsByStatus('rotation')
}

// Get problem beds that need attention
export function getProblemBeds(): PhysicalBed[] {
  return getBedsByStatus('problem')
}

// Helper to get all permanent plantings by type
export function getPermanentsByType(type: PermanentPlanting['type']): PermanentPlanting[] {
  return permanentPlantings.filter(p => p.type === type)
}

// Get bed color for display
export const BED_COLORS: Record<PhysicalBedId, string> = {
  'A': '#22c55e',        // green - legumes/strawberries
  'B1': '#3b82f6',       // blue - brassicas
  'B1-prime': '#60a5fa', // light blue
  'B2': '#f59e0b',       // amber - alliums
  'B2-prime': '#fbbf24', // light amber
  'C': '#ef4444',        // red - problem
  'D': '#8b5cf6',        // violet - solanaceae
  'E': '#f87171',        // light red - problem
  'raspberries': '#ec4899' // pink - perennial
}

// Get rotation group display name
export const ROTATION_GROUP_NAMES: Record<string, string> = {
  'legumes': 'Legumes (Peas & Beans)',
  'brassicas': 'Brassicas (Cabbage Family)',
  'roots': 'Root Vegetables',
  'solanaceae': 'Solanaceae (Potatoes & Tomatoes)',
  'alliums': 'Alliums (Onion Family)',
  'cucurbits': 'Cucurbits (Squash Family)',
  'permanent': 'Permanent Plantings'
}

// All bed IDs for iteration
export const ALL_BED_IDS: PhysicalBedId[] = [
  'A', 'B1', 'B1-prime', 'B2', 'B2-prime', 'C', 'D', 'E', 'raspberries'
]

// Rotation bed IDs only (for planning)
export const ROTATION_BED_IDS: PhysicalBedId[] = [
  'A', 'B1', 'B1-prime', 'B2', 'B2-prime', 'D'
]

// ============================================================================
// GRID LAYOUT CONFIGURATION (for react-grid-layout)
// ============================================================================

export type GridItemType = 'bed' | 'perennial' | 'infrastructure' | 'area' | 'tree' | 'path'

export interface GridItemConfig {
  i: string           // Unique ID
  x: number           // Grid column position
  y: number           // Grid row position  
  w: number           // Width in grid units
  h: number           // Height in grid units
  label: string       // Display label
  type: GridItemType  // Item type for styling
  icon?: string       // Emoji icon
  color?: string      // Custom background color
  bedId?: PhysicalBedId // Link to physical bed if applicable
  isProblem?: boolean // Flag for problem areas
  static?: boolean    // If true, cannot be moved/resized
}

// Default grid layout - 12 columns
// Represents the allotment from North (top) to South (bottom)
export const DEFAULT_GRID_LAYOUT: GridItemConfig[] = [
  // === ROW 0: Top row - E, Wildish, Compost ===
  { i: 'E', x: 0, y: 0, w: 2, h: 2, label: 'E', type: 'bed', icon: '🫘', color: '#f87171', bedId: 'E', isProblem: true },
  { i: 'wildish', x: 2, y: 0, w: 4, h: 2, label: 'Wildish', type: 'area', icon: '🌿', color: '#d1d5db' },
  { i: 'compost', x: 6, y: 0, w: 3, h: 2, label: 'Compost', type: 'infrastructure', icon: '🗑️', color: '#fcd34d' },

  // === ROW 2-3: Perennials left + B primes + berries + A ===
  { i: 'rhubarb', x: 0, y: 2, w: 2, h: 1, label: 'Rhubarb', type: 'perennial', icon: '🥬', color: '#e9d5ff' },
  { i: 'apple-north', x: 0, y: 3, w: 2, h: 1, label: 'Apple', type: 'tree', icon: '🍎', color: '#bbf7d0' },
  { i: 'B2-prime', x: 2, y: 2, w: 2, h: 2, label: "B2'", type: 'bed', icon: '🫛', color: '#fbbf24', bedId: 'B2-prime' },
  { i: 'B1-prime', x: 4, y: 2, w: 2, h: 2, label: "B1'", type: 'bed', icon: '🍓', color: '#60a5fa', bedId: 'B1-prime' },
  { i: 'berries', x: 6, y: 2, w: 2, h: 2, label: 'Goose/Blue', type: 'perennial', icon: '🫐', color: '#c7d2fe' },
  { i: 'A', x: 8, y: 2, w: 2, h: 2, label: 'A', type: 'bed', icon: '🫛', color: '#22c55e', bedId: 'A' },

  // === ROW 4-7: C + main B beds + Raspberries ===
  { i: 'C', x: 0, y: 4, w: 2, h: 3, label: 'C', type: 'bed', icon: '🌳', color: '#ef4444', bedId: 'C', isProblem: true },
  { i: 'straw-damson', x: 0, y: 7, w: 2, h: 1, label: 'Straw/Damson', type: 'perennial', icon: '🍓', color: '#fbcfe8' },
  { i: 'B2', x: 2, y: 4, w: 2, h: 4, label: 'B2', type: 'bed', icon: '🧄', color: '#f59e0b', bedId: 'B2' },
  { i: 'B1', x: 4, y: 4, w: 2, h: 4, label: 'B1', type: 'bed', icon: '🥬', color: '#3b82f6', bedId: 'B1' },
  { i: 'grass', x: 6, y: 4, w: 2, h: 4, label: '', type: 'area', color: '#dcfce7' },
  { i: 'raspberries', x: 8, y: 4, w: 2, h: 4, label: 'Raspberries', type: 'perennial', icon: '🍇', color: '#ec4899', bedId: 'raspberries' },


  // === ROW 9-11: Bottom - Flowers + D + Trees + Shed area ===
  { i: 'flowers-top', x: 0, y: 9, w: 2, h: 1, label: 'Flowers', type: 'area', icon: '🌸', color: '#fbcfe8' },
  { i: 'apple-sw', x: 0, y: 10, w: 2, h: 1, label: 'Apple', type: 'tree', icon: '🍎', color: '#bbf7d0' },
  { i: 'flowers-bottom', x: 0, y: 11, w: 2, h: 1, label: 'Flowers', type: 'area', icon: '🌸', color: '#fbcfe8' },
  { i: 'D', x: 2, y: 9, w: 4, h: 3, label: 'D', type: 'bed', icon: '🥔', color: '#8b5cf6', bedId: 'D' },
  { i: 'cherry', x: 6, y: 9, w: 1, h: 1, label: 'Cherry', type: 'tree', icon: '🍒', color: '#fecaca' },
  { i: 'apple-south', x: 6, y: 10, w: 1, h: 2, label: 'Apple', type: 'tree', icon: '🍎', color: '#bbf7d0' },
  { i: 'shed', x: 7, y: 9, w: 2, h: 1, label: 'Shed', type: 'infrastructure', icon: '🏠', color: '#d6d3d1' },
  { i: 'water', x: 7, y: 10, w: 2, h: 1, label: 'Water', type: 'infrastructure', icon: '💧', color: '#bfdbfe' },
  { i: 'herbs', x: 7, y: 11, w: 2, h: 1, label: 'Herbs', type: 'infrastructure', icon: '🌿', color: '#bbf7d0' },
]

// Local storage key for saved layout
export const LAYOUT_STORAGE_KEY = 'allotment-grid-layout'

// Get grid item by ID
export function getGridItemById(id: string): GridItemConfig | undefined {
  return DEFAULT_GRID_LAYOUT.find(item => item.i === id)
}
