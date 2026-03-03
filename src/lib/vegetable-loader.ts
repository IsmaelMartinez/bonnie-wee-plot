/**
 * Vegetable Loader
 * Provides lazy-loading and caching for the vegetable database
 * Reduces initial bundle size by loading detailed data on demand
 *
 * Supports two loading strategies:
 * 1. Full database load (for pages that need all data)
 * 2. Per-category load (for pages that only need one category)
 */

import { Vegetable, VegetableCategory } from '@/types/garden-planner'
import { vegetableIndex, VegetableIndex } from './vegetables/index'

// Cache for loaded vegetable data
const vegetableCache = new Map<string, Vegetable>()
const categoryCache = new Map<VegetableCategory, Vegetable[]>()
let fullDatabaseLoaded = false

// Per-category dynamic import map
const categoryImports: Record<VegetableCategory, () => Promise<{ [key: string]: Vegetable[] }>> = {
  'leafy-greens': () => import('./vegetables/data/leafy-greens'),
  'root-vegetables': () => import('./vegetables/data/root-vegetables'),
  'brassicas': () => import('./vegetables/data/brassicas'),
  'legumes': () => import('./vegetables/data/legumes'),
  'solanaceae': () => import('./vegetables/data/solanaceae'),
  'cucurbits': () => import('./vegetables/data/cucurbits'),
  'alliums': () => import('./vegetables/data/alliums'),
  'herbs': () => import('./vegetables/data/herbs'),
  'berries': () => import('./vegetables/data/berries'),
  'fruit-trees': () => import('./vegetables/data/fruit-trees'),
  'annual-flowers': () => import('./vegetables/data/annual-flowers'),
  'perennial-flowers': () => import('./vegetables/data/perennial-flowers'),
  'bulbs': () => import('./vegetables/data/bulbs'),
  'climbers': () => import('./vegetables/data/climbers'),
  'green-manures': () => import('./vegetables/data/green-manures'),
  'mushrooms': () => import('./vegetables/data/mushrooms'),
  'other': () => import('./vegetables/data/other'),
}

/**
 * Dynamic import of the full vegetable database
 * Uses webpack/Next.js code splitting
 */
async function loadFullDatabase(): Promise<Vegetable[]> {
  const { vegetables } = await import('./vegetable-database')
  return vegetables
}

/**
 * Load a single category and populate caches
 */
async function loadCategory(category: VegetableCategory): Promise<Vegetable[]> {
  if (categoryCache.has(category)) {
    return categoryCache.get(category)!
  }

  const importFn = categoryImports[category]
  if (!importFn) return []

  const mod = await importFn()
  // The module exports a single named array; get the first array export
  const vegetables = Object.values(mod).find(v => Array.isArray(v)) as Vegetable[] | undefined
  if (!vegetables) return []

  categoryCache.set(category, vegetables)
  for (const veg of vegetables) {
    vegetableCache.set(veg.id, veg)
  }

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
 * Loads only the requested category, not the full database
 */
export async function getVegetablesByCategoryAsync(category: VegetableCategory): Promise<Vegetable[]> {
  // Check cache first
  if (categoryCache.has(category)) {
    return categoryCache.get(category) || []
  }

  // Load just this category
  return loadCategory(category)
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

/**
 * Get vegetable by ID from cache (synchronous)
 * Returns undefined if database not yet loaded - use getVegetableByIdAsync for guaranteed results
 * This is useful for components that render after database is loaded
 */
export function getVegetableByIdCached(id: string): Vegetable | undefined {
  return vegetableCache.get(id)
}

// NOTE: Full database exports removed to enable proper lazy loading
// Files needing full iteration should import directly from './vegetable-database'
// Files needing single lookups should use getVegetableByIdAsync() or getVegetableName()
