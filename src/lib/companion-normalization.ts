/**
 * Name normalization maps for companion plant validation
 * Based on Phase 1 analysis of plant-data-validation.md
 */

// Plural to singular (8 items)
const PLURAL_TO_SINGULAR: Record<string, string> = {
  'Daffodils': 'Daffodil',
  'Jerusalem Artichokes': 'Jerusalem Artichoke',
  'Marigolds': 'Marigold',
  'Mints': 'Mint',
  'Nasturtiums': 'Nasturtium',
  'Sunflowers': 'Sunflower',
  'Tulips': 'Tulip',
}

// Semantic mappings - alternate names to canonical forms (null = remove)
const SEMANTIC_MAPPINGS: Record<string, string | null> = {
  'Artichokes': 'Globe Artichoke',
  'Beets': 'Beetroot',
  'Broccoli': 'Calabrese (Broccoli)',
  'Bush beans': 'French Beans',
  'Chard': 'Swiss Chard',
  'Corn': 'Sweetcorn',
  'Corn Salad': 'Corn Salad (Lamb\'s Lettuce)',
  'Corn salad': 'Corn Salad (Lamb\'s Lettuce)',
  'Courgettes': 'Courgettes (Zucchini)',
  'Courgette': 'Courgettes (Zucchini)',
  'Potato': 'Potatoes (Tatties)',
  'Purslane': 'Winter Purslane (Claytonia)',
  'Runner beans': 'Runner Beans',
  'Squash': 'Winter Squash',
  'Winter Purslane': 'Winter Purslane (Claytonia)',
  'Winter lettuce': 'Lettuce',
  'Tarragon': 'French Tarragon',
  'Succulents': null, // Remove - not a specific plant
}

// Category expansions - generic category names to specific plants
// Names must match actual database plant names for resolution
const CATEGORY_EXPANSIONS: Record<string, string[]> = {
  'Beans': ['Broad Beans', 'French Beans', 'Runner Beans'],
  'Brassicas': ['Calabrese (Broccoli)', 'Brussels Sprouts', 'Cabbage', 'Cauliflower', 'Kale'],
  'Alliums': ['Onion', 'Garlic', 'Leek', 'Chives'],
  'Cucurbits': ['Pumpkin', 'Winter Squash', 'Courgettes (Zucchini)'],
}

// Vague references to remove (16 items from analysis)
const VAGUE_REFERENCES = [
  'All vegetables',
  'Climbing vegetables',
  'Companion honeyberry varieties',
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
