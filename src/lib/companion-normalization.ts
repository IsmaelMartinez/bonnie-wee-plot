/**
 * Name normalization maps for companion plant validation
 * Based on Phase 1 analysis of plant-data-validation.md
 */

// Plural to singular (8 items)
export const PLURAL_TO_SINGULAR: Record<string, string> = {
  'Daffodils': 'Daffodil',
  'Jerusalem Artichokes': 'Jerusalem Artichoke',
  'Marigolds': 'Marigold',
  'Mints': 'Mint',
  'Nasturtiums': 'Nasturtium',
  'Sunflowers': 'Sunflower',
  'Tulips': 'Tulip',
}

// Semantic mappings - alternate names to canonical forms (null = remove)
export const SEMANTIC_MAPPINGS: Record<string, string | null> = {
  'Artichokes': 'Globe Artichoke',
  'Beets': 'Beetroot',
  'Bush beans': 'French Beans',
  'Corn': 'Sweetcorn',
  'Purslane': 'Winter Purslane',
  'Corn salad': 'Corn Salad',
  'Winter lettuce': 'Lettuce',
  'Tarragon': 'French Tarragon',
  'Succulents': null, // Remove - not a specific plant
}

// Category expansions - generic category names to specific plants
export const CATEGORY_EXPANSIONS: Record<string, string[]> = {
  'Beans': ['Broad Beans', 'French Beans', 'Runner Beans'],
  'Brassicas': ['Broccoli', 'Brussels Sprouts', 'Cabbage', 'Cauliflower', 'Kale'],
  'Alliums': ['Onion', 'Garlic', 'Leek', 'Chives'],
  'Cucurbits': ['Pumpkin', 'Squash', 'Courgette'],
}

// Vague references to remove (16 items from analysis)
export const VAGUE_REFERENCES = [
  'All vegetables',
  'Alliums',
  'Climbing vegetables',
  'Companion honeyberry varieties',
  'Dill should be kept separate',
  'Herbs',
  'Most vegetables',
  'Native hedgerow plants',
  'Native plants',
  'Nitrogen-loving plants nearby',
  'Other brassicas nearby',
  'Perennial vegetables',
  'Shade vegetables',
  'Vegetables',
  'Vegetables (general)',
  'Water-loving plants',
  'Woodland plants',
]

/**
 * Normalize a companion plant name to its canonical form
 * Returns null if the reference should be removed (vague/invalid)
 * Returns array if the reference expands to multiple plants
 */
export function normalizeCompanionName(name: string): string | string[] | null {
  // Check if vague reference (remove)
  if (VAGUE_REFERENCES.includes(name)) {
    return null
  }

  // Check category expansion
  if (CATEGORY_EXPANSIONS[name]) {
    return CATEGORY_EXPANSIONS[name]
  }

  // Check semantic mapping
  if (name in SEMANTIC_MAPPINGS) {
    return SEMANTIC_MAPPINGS[name]
  }

  // Check plural normalization
  if (PLURAL_TO_SINGULAR[name]) {
    return PLURAL_TO_SINGULAR[name]
  }

  // Return as-is (already canonical)
  return name
}

/**
 * Normalize an array of companion plant names
 * Removes vague references, expands categories, normalizes names
 */
export function normalizeCompanionArray(companions: string[]): string[] {
  const normalized: string[] = []

  for (const name of companions) {
    const result = normalizeCompanionName(name)
    if (result === null) {
      // Skip vague references
      continue
    }
    if (Array.isArray(result)) {
      // Expand categories
      normalized.push(...result)
    } else {
      normalized.push(result)
    }
  }

  // Remove duplicates and sort
  return [...new Set(normalized)].sort()
}
