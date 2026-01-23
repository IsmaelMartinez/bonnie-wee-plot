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

// Physical bed definitions - Start empty for fresh installs
// Users add areas through the UI using AddAreaForm
export const physicalBeds: PhysicalBed[] = []

// Permanent plantings - Start empty for fresh installs
// Users add trees, berries, herbs through the UI using AddAreaForm
export const permanentPlantings: PermanentPlanting[] = []

// Infrastructure items - Start empty for fresh installs
// Users add sheds, compost bins, paths through the UI using AddAreaForm
export const infrastructure: InfrastructureItem[] = []

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

// Default grid layout - Start empty for fresh installs
// Areas added through UI will auto-position or be manually positioned
export const DEFAULT_GRID_LAYOUT: GridItemConfig[] = []

// Get grid item by ID
export function getGridItemById(id: string): GridItemConfig | undefined {
  return DEFAULT_GRID_LAYOUT.find(item => item.i === id)
}

// Note: LAYOUT_STORAGE_KEY removed in v14 - grid positions now stored in AreaSeason.gridPosition
