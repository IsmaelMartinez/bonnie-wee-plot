/**
 * Vegetable Loader
 * Provides lazy-loading and caching for the vegetable database
 * Reduces initial bundle size by loading detailed data on demand
 */

import { Vegetable, VegetableCategory } from '@/types/garden-planner'
import { vegetableIndex, VegetableIndex } from './vegetables/index'

// Cache for loaded vegetable data
const vegetableCache = new Map<string, Vegetable>()
const categoryCache = new Map<VegetableCategory, Vegetable[]>()
let fullDatabaseLoaded = false

/**
 * Dynamic import of the full vegetable database
 * Uses webpack/Next.js code splitting
 */
async function loadFullDatabase(): Promise<Vegetable[]> {
  const { vegetables } = await import('./vegetable-database')
  return vegetables
}

/**
 * Ensure the full database is loaded and cached
 */
async function ensureLoaded(): Promise<void> {
  if (fullDatabaseLoaded) return
  
  const vegetables = await loadFullDatabase()
  
  // Populate caches
  for (const veg of vegetables) {
    vegetableCache.set(veg.id, veg)
    
    const categoryList = categoryCache.get(veg.category) || []
    categoryList.push(veg)
    categoryCache.set(veg.category, categoryList)
  }
  
  fullDatabaseLoaded = true
}

/**
 * Get a vegetable by ID (async)
 * Returns cached data if available, otherwise loads from database
 */
export async function getVegetableByIdAsync(id: string): Promise<Vegetable | undefined> {
  // Check cache first
  if (vegetableCache.has(id)) {
    return vegetableCache.get(id)
  }
  
  // Load full database if not already loaded
  await ensureLoaded()
  
  return vegetableCache.get(id)
}

/**
 * Get vegetables by category (async)
 */
export async function getVegetablesByCategoryAsync(category: VegetableCategory): Promise<Vegetable[]> {
  // Check cache first
  if (categoryCache.has(category)) {
    return categoryCache.get(category) || []
  }
  
  // Load full database if not already loaded
  await ensureLoaded()
  
  return categoryCache.get(category) || []
}

/**
 * Get all vegetables (async)
 */
export async function getAllVegetablesAsync(): Promise<Vegetable[]> {
  await ensureLoaded()
  return Array.from(vegetableCache.values())
}

/**
 * Preload the full database (useful for pages that will need all data)
 */
export async function preloadVegetableDatabase(): Promise<void> {
  await ensureLoaded()
}

/**
 * Check if the database is loaded
 */
export function isDatabaseLoaded(): boolean {
  return fullDatabaseLoaded
}

/**
 * Get vegetable index (synchronous, lightweight)
 * Use this for dropdowns, quick searches, etc.
 */
export function getVegetableIndex(): VegetableIndex[] {
  return vegetableIndex
}

/**
 * Search vegetables (synchronous, uses index)
 */
export function searchVegetables(query: string): VegetableIndex[] {
  const lowerQuery = query.toLowerCase()
  return vegetableIndex.filter(v => 
    v.name.toLowerCase().includes(lowerQuery)
  )
}

/**
 * Get vegetable name by ID (synchronous, uses index)
 * Useful for display when you only need the name
 */
export function getVegetableName(id: string): string | undefined {
  const entry = vegetableIndex.find(v => v.id === id)
  return entry?.name
}

/**
 * Get vegetable category by ID (synchronous, uses index)
 */
export function getVegetableCategory(id: string): VegetableCategory | undefined {
  const entry = vegetableIndex.find(v => v.id === id)
  return entry?.category
}

// Re-export the synchronous API from the original database for backward compatibility
// This ensures existing code continues to work while we migrate
export { 
  vegetables, 
  getVegetableById, 
  getVegetablesByCategory 
} from './vegetable-database'

