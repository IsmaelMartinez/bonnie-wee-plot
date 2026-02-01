/**
 * Type definitions for the Vegetable Garden Planner feature
 *
 * NOTE: This file contains two categories of types:
 *
 * 1. CORE TYPES (actively used across the codebase):
 *    - VegetableCategory, Vegetable, PlantingInfo, CareRequirements
 *    - RotationGroup, Month, SunRequirement, WaterRequirement, DifficultyLevel
 *
 * 2. GRID PLANNER TYPES (used by garden-planner components):
 *    - GridPlot, PlotCell, GardenPlot (for the drag-drop grid interface)
 *    - RotationHistory (for grid-based rotation tracking)
 *
 * 3. LEGACY TYPES (superseded by unified-allotment.ts):
 *    - SeasonPlan, BedPlan, PlantedVariety → Use SeasonRecord, AreaSeason, Planting
 *    - PhysicalBedId, PhysicalBed, AllotmentLayout, AllotmentHistoryData
 *    - PermanentPlanting, InfrastructureItem
 *    These are kept for backwards compatibility and historical-plans.ts migration.
 */

// Vegetable Categories
export type VegetableCategory =
  | 'leafy-greens'
  | 'root-vegetables'
  | 'brassicas'
  | 'legumes'
  | 'solanaceae'
  | 'cucurbits'
  | 'alliums'
  | 'herbs'
  | 'berries'
  | 'fruit-trees'
  | 'annual-flowers'      // Cosmos, sunflower, zinnia, marigold
  | 'perennial-flowers'   // Lavender, echinacea, rudbeckia
  | 'bulbs'               // Tulips, daffodils, dahlias
  | 'climbers'            // Sweet peas, clematis, morning glory
  | 'green-manures'       // Clover, field beans, rye, mustard
  | 'mushrooms'           // Oyster, shiitake, lion's mane
  | 'other'               // Sweetcorn, etc.

// Sun requirements
export type SunRequirement = 'full-sun' | 'partial-shade' | 'shade'

// Water requirements
export type WaterRequirement = 'low' | 'moderate' | 'high'

// Difficulty level
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced'

// Companion relationship mechanism (why plants work well/poorly together)
export type CompanionMechanism =
  | 'pest_confusion'         // Interplanting confuses pests
  | 'pest_trap'              // Trap crop draws pests away
  | 'allelopathy'            // Chemical inhibition
  | 'nitrogen_fixation'      // Legumes fix nitrogen
  | 'physical_support'       // e.g., corn supports beans
  | 'beneficial_attraction'  // Attracts pollinators/predators
  | 'disease_suppression'    // Reduces disease incidence
  | 'nutrient_competition'   // Compete for same nutrients (avoid)
  | 'unknown'                // Traditional knowledge, mechanism unclear

// Confidence level for companion relationship claims
export type CompanionConfidence = 'proven' | 'likely' | 'traditional' | 'anecdotal'

// Enhanced companion relationship with metadata
export interface EnhancedCompanion {
  plantId: string                    // Reference to vegetable ID
  confidence: CompanionConfidence
  mechanism?: CompanionMechanism
  bidirectional: boolean             // Does the relationship work both ways?
  source?: string                    // Citation or source of information
}

// Growing requirement - indicates if plant needs protection
export type GrowingRequirement = 'outdoor' | 'greenhouse' | 'windowsill' | 'polytunnel'

// Month type (1-12)
export type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

// Planting information
export interface PlantingInfo {
  sowIndoorsMonths: Month[]      // Months to start seeds indoors
  sowOutdoorsMonths: Month[]     // Months to direct sow outdoors
  transplantMonths: Month[]      // Months suitable for transplanting
  harvestMonths: Month[]         // Expected harvest months
  daysToHarvest: {
    min: number
    max: number
  }
}

// Care requirements
export interface CareRequirements {
  sun: SunRequirement
  water: WaterRequirement
  spacing: {
    between: number    // cm between plants
    rows: number       // cm between rows
  }
  depth: number        // cm planting depth
  difficulty: DifficultyLevel
  tips: string[]
}

// Base vegetable definition from the database
export interface Vegetable {
  id: string
  name: string
  category: VegetableCategory
  description: string
  planting: PlantingInfo
  care: CareRequirements
  companionPlants: string[]
  avoidPlants: string[]
  growingRequirement?: GrowingRequirement  // If set, indicates plant needs protection (greenhouse/windowsill)
  maintenance?: MaintenanceInfo            // For perennials/trees: pruning, feeding schedules
  perennialInfo?: PerennialInfo            // Lifecycle info for perennial plants (trees, berries, asparagus, etc.)
  rhsUrl?: string                          // RHS grow-your-own guide URL
  botanicalName?: string                   // Scientific/Latin name
  enhancedCompanions?: EnhancedCompanion[] // Validated companion relationships with metadata
  enhancedAvoid?: EnhancedCompanion[]      // Validated avoid relationships with metadata
}

// Maintenance info for perennials, trees, and shrubs
export interface MaintenanceInfo {
  pruneMonths?: Month[]    // Months when pruning is recommended
  feedMonths?: Month[]     // Months when feeding is recommended
  mulchMonths?: Month[]    // Months when mulching is recommended
  notes?: string[]         // Additional maintenance tips
}

/**
 * Lifecycle information for perennial plants
 * Used to track establishment period and productive lifespan
 */
export interface PerennialInfo {
  /** Years from planting until first significant harvest */
  yearsToFirstHarvest: { min: number; max: number }

  /** How many years the plant remains productive (undefined = indefinite) */
  productiveYears?: { min: number; max: number }

  /** Whether plant keeps leaves year-round */
  isEvergreen?: boolean
}

// Garden plot/section
export interface GardenPlot {
  id: string
  name: string                   // e.g., "North Bed", "Greenhouse"
  description?: string
  width: number                  // Width in meters
  length: number                 // Length in meters
  color: string                  // Hex color for visual display
  sortOrder: number              // Order in list
}

// ============ GRID PLOT TYPES ============

// Cell within a grid plot
export interface PlotCell {
  id: string              // Format: "{plotId}-{row}-{col}"
  plotId: string          // Reference to parent plot
  row: number
  col: number
  plantId?: string    // Reference to Vegetable.id
  plantedYear?: number    // Year this was planted (for rotation tracking)
}

// Grid-enabled plot (extends existing GardenPlot)
export interface GridPlot extends GardenPlot {
  gridRows: number        // Number of rows in grid
  gridCols: number        // Number of columns in grid
  cells: PlotCell[]       // All cells in this plot
}

// Rotation tracking
export type RotationGroup = 
  | 'brassicas'    // Cabbage family
  | 'legumes'      // Beans, peas
  | 'roots'        // Carrots, parsnips, beetroot
  | 'solanaceae'   // Tomatoes, peppers, potatoes
  | 'alliums'      // Onions, garlic, leeks
  | 'cucurbits'    // Squash, courgettes, cucumber
  | 'permanent'    // Perennial herbs

export interface RotationHistory {
  plotId: string
  year: number
  rotationGroup: RotationGroup
  vegetables: string[]    // IDs of vegetables planted
}

// Validation results
export interface PlacementValidation {
  isValid: boolean
  warnings: PlacementWarning[]
  suggestions: string[]   // Helpful tips
  compatibility: 'good' | 'neutral' | 'bad'
}

export interface PlacementWarning {
  type: 'avoid' | 'rotation' | 'spacing'
  severity: 'error' | 'warning' | 'info'
  message: string
  conflictingPlant?: string
  affectedCells?: string[]
}

// Auto-fill options
export interface AutoFillOptions {
  strategy: 'rotation-first' | 'companion-first' | 'balanced'
  difficultyFilter: 'beginner' | 'all'
  respectExisting: boolean
}

// Gap filler suggestion
export interface GapSuggestion {
  plantId: string
  reason: string
  score: number           // 0-100 suitability
  quickGrow: boolean      // < 45 days to harvest
  canPlantNow: boolean    // Based on current month
}

// View modes for the planner
export type PlannerViewMode = 'list' | 'plot' | 'calendar' | 'grid'

// Filter options for vegetable selector
export interface VegetableFilters {
  search: string
  categories: VegetableCategory[]
  plantingMonth?: Month
  difficulty?: DifficultyLevel
  sunRequirement?: SunRequirement
}

// Planning progress statistics
export interface PlanProgress {
  totalVegetables: number
  withDates: number
  withPlots: number
  completionPercentage: number
}

// Category display info
export interface CategoryInfo {
  id: VegetableCategory
  name: string
  icon: string           // Lucide icon name
  color: string          // Tailwind color class
}

// Month names for display
export const MONTH_NAMES: Record<Month, string> = {
  1: 'January',
  2: 'February',
  3: 'March',
  4: 'April',
  5: 'May',
  6: 'June',
  7: 'July',
  8: 'August',
  9: 'September',
  10: 'October',
  11: 'November',
  12: 'December'
}

export const MONTH_NAMES_SHORT: Record<Month, string> = {
  1: 'Jan',
  2: 'Feb',
  3: 'Mar',
  4: 'Apr',
  5: 'May',
  6: 'Jun',
  7: 'Jul',
  8: 'Aug',
  9: 'Sep',
  10: 'Oct',
  11: 'Nov',
  12: 'Dec'
}

// Category display configuration
export const CATEGORY_INFO: CategoryInfo[] = [
  { id: 'leafy-greens', name: 'Leafy Greens', icon: 'Leaf', color: 'green' },
  { id: 'root-vegetables', name: 'Root Vegetables', icon: 'Carrot', color: 'orange' },
  { id: 'brassicas', name: 'Brassicas', icon: 'Flower2', color: 'purple' },
  { id: 'legumes', name: 'Legumes', icon: 'Bean', color: 'lime' },
  { id: 'solanaceae', name: 'Solanaceae', icon: 'Cherry', color: 'red' },
  { id: 'cucurbits', name: 'Cucurbits', icon: 'Grape', color: 'yellow' },
  { id: 'alliums', name: 'Alliums', icon: 'CircleDot', color: 'amber' },
  { id: 'herbs', name: 'Herbs', icon: 'Flower', color: 'emerald' },
  { id: 'berries', name: 'Berries', icon: 'Cherry', color: 'pink' },
  { id: 'fruit-trees', name: 'Fruit Trees', icon: 'TreeDeciduous', color: 'rose' },
  { id: 'annual-flowers', name: 'Annual Flowers', icon: 'Flower2', color: 'fuchsia' },
  { id: 'perennial-flowers', name: 'Perennial Flowers', icon: 'Sparkles', color: 'violet' },
  { id: 'bulbs', name: 'Bulbs', icon: 'Droplet', color: 'indigo' },
  { id: 'climbers', name: 'Climbers', icon: 'Scaling', color: 'purple' },
  { id: 'green-manures', name: 'Green Manures', icon: 'Sprout', color: 'teal' },
  { id: 'mushrooms', name: 'Mushrooms', icon: 'Layers', color: 'stone' }
]

// Default plot colors
export const PLOT_COLORS = [
  '#22c55e', // green-500
  '#3b82f6', // blue-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
  '#f97316', // orange-500
]

// ============ ALLOTMENT LAYOUT & HISTORY TYPES ============

/**
 * @deprecated Use Area.id (string) from unified-allotment.ts instead.
 * Kept as string alias for backward compatibility during migration.
 */
export type PhysicalBedId = string

/**
 * @deprecated Use Area.kind from unified-allotment.ts instead.
 */
export type BedStatus = 'rotation' | 'perennial'

/**
 * @deprecated Use Area from unified-allotment.ts instead.
 * Physical bed in the allotment layout (legacy type for migration)
 */
export interface PhysicalBed {
  id: PhysicalBedId
  name: string                    // e.g., "Bed A - Legumes"
  description?: string
  status: BedStatus               // Whether bed is in rotation or perennial
  gridPosition?: {                // Optional - not all beds have precise grid positions
    startRow: number
    startCol: number
    endRow: number
    endCol: number
  }
  rotationGroup?: RotationGroup   // Primary rotation group for this bed
}

/**
 * @deprecated Use Area from unified-allotment.ts instead.
 * Permanent plantings (fruit trees, berries, etc.) - legacy type for migration
 */
export interface PermanentPlanting {
  id: string
  name: string                    // e.g., "Apple Tree (North)"
  type: 'fruit-tree' | 'berry' | 'perennial-veg' | 'herb'
  plantId?: string                // Reference to vegetable database
  variety?: string                // e.g., "Discovery"
  plantedYear?: number
  gridPosition?: {
    row: number
    col: number
  }
  notes?: string
}

/**
 * @deprecated Use Area from unified-allotment.ts instead.
 * Infrastructure items (shed, compost, paths) - legacy type for migration
 */
export interface InfrastructureItem {
  id: string
  type: 'shed' | 'compost' | 'water-butt' | 'path' | 'greenhouse' | 'pond' | 'wildlife' | 'other'
  name: string
  gridPosition?: {
    startRow: number
    startCol: number
    endRow: number
    endCol: number
  }
}

/**
 * Complete allotment layout
 * @deprecated Use AllotmentLayoutData from unified-allotment.ts instead
 */
export interface AllotmentLayout {
  id: string
  name: string                           // e.g., "My Edinburgh Allotment"
  gridRows: number
  gridCols: number
  beds: PhysicalBed[]
  permanentPlantings: PermanentPlanting[]
  infrastructure: InfrastructureItem[]
}

// ============ VARIETY TRACKING TYPES ============

// User's specific seed varieties
export interface PlantVariety {
  id: string
  plantId: string             // Links to base vegetable (e.g., 'peas')
  name: string                    // e.g., "Kelvedon Wonder"
  supplier?: string               // e.g., "Organic Gardening"
  price?: number
  notes?: string
}

// ============ HISTORICAL PLAN TYPES ============

// Success rating for plantings
export type PlantingSuccess = 'excellent' | 'good' | 'fair' | 'poor'

/**
 * A planting record within a season
 * @deprecated Use Planting from unified-allotment.ts instead
 */
export interface PlantedVariety {
  id: string
  plantId: string             // Reference to Vegetable.id
  varietyId?: string              // Reference to PlantVariety.id
  varietyName: string             // Stored directly for historical reference
  bedId: PhysicalBedId
  quantity?: number
  sowDate?: string                // ISO date string
  transplantDate?: string
  harvestDate?: string
  success?: PlantingSuccess
  notes?: string
}

/**
 * A bed's planting plan for a season
 * @deprecated Use BedSeason from unified-allotment.ts instead
 */
export interface BedPlan {
  bedId: PhysicalBedId
  rotationGroup: RotationGroup
  plantings: PlantedVariety[]
}

/**
 * Complete season plan (historical or current)
 * @deprecated Use SeasonRecord from unified-allotment.ts instead
 */
export interface SeasonPlan {
  id: string
  year: number
  beds: BedPlan[]
  notes?: string
  createdAt: string
  updatedAt: string
}

/**
 * Storage format for all historical data
 * @deprecated Use AllotmentData from unified-allotment.ts instead
 */
export interface AllotmentHistoryData {
  version: number
  layout: AllotmentLayout
  varieties: PlantVariety[]
  seasons: SeasonPlan[]
  currentYear: number
}

// ============ ROTATION SUGGESTION TYPES ============

/**
 * Rotation suggestion for planning next year
 */
export interface RotationSuggestion {
  areaId: string                    // Reference to Area.id (was bedId: PhysicalBedId)
  previousGroup: RotationGroup
  suggestedGroup: RotationGroup
  reason: string
  suggestedVegetables: string[]   // Vegetable IDs that fit the rotation
  isProblemBed?: boolean          // Whether this is a problem bed needing special attention
  isPerennial?: boolean           // Whether this is a perennial bed (no rotation)
  problemNote?: string            // Note about the problem if isProblemBed
}

// Complete rotation plan for a year
export interface RotationPlan {
  year: number
  suggestions: RotationSuggestion[]
  warnings: string[]              // Any rotation conflicts or issues
}

// ============ UNIFIED ITEM SELECTION TYPES ============

/**
 * Type discriminator for allotment items (unified selection system)
 * v10: All items are now 'area' type
 * @deprecated v9 types kept for backward compatibility
 */
export type AllotmentItemType = 'area' | 'bed' | 'permanent' | 'infrastructure'

/**
 * Reference to any item in the allotment (for unified selection)
 * In v10, all items are areas
 */
export interface AllotmentItemRef {
  type: AllotmentItemType
  id: string
}

