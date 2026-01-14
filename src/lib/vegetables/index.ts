/**
 * Lightweight vegetable index for fast lookups
 * Full data is lazy-loaded by category as needed
 */

import { VegetableCategory } from '@/types/garden-planner'

export interface VegetableIndex {
  id: string
  name: string
  category: VegetableCategory
}

/**
 * Minimal index of all vegetables for quick access
 * This loads immediately and is used for dropdowns, searches, etc.
 */
export const vegetableIndex: VegetableIndex[] = [
  // Leafy Greens
  { id: 'lettuce', name: 'Lettuce', category: 'leafy-greens' },
  { id: 'spinach', name: 'Spinach', category: 'leafy-greens' },
  { id: 'perpetual-spinach', name: 'Perpetual Spinach', category: 'leafy-greens' },
  { id: 'kale', name: 'Kale', category: 'leafy-greens' },
  { id: 'chard', name: 'Swiss Chard', category: 'leafy-greens' },
  { id: 'rocket', name: 'Rocket', category: 'leafy-greens' },
  { id: 'pak-choi', name: 'Pak Choi', category: 'leafy-greens' },
  { id: 'mizuna', name: 'Mizuna', category: 'leafy-greens' },
  { id: 'land-cress', name: 'Land Cress', category: 'leafy-greens' },
  { id: 'corn-salad', name: 'Corn Salad (Lamb\'s Lettuce)', category: 'leafy-greens' },
  { id: 'winter-purslane', name: 'Winter Purslane (Claytonia)', category: 'leafy-greens' },

  // Root Vegetables
  { id: 'carrot', name: 'Carrot', category: 'root-vegetables' },
  { id: 'beetroot', name: 'Beetroot', category: 'root-vegetables' },
  { id: 'parsnip', name: 'Parsnip', category: 'root-vegetables' },
  { id: 'turnip', name: 'Turnip', category: 'root-vegetables' },
  { id: 'swede', name: 'Swede', category: 'root-vegetables' },
  { id: 'radish', name: 'Radish', category: 'root-vegetables' },
  { id: 'potato', name: 'Potato', category: 'root-vegetables' },
  { id: 'jerusalem-artichoke', name: 'Jerusalem Artichoke', category: 'root-vegetables' },
  { id: 'celeriac', name: 'Celeriac', category: 'root-vegetables' },
  { id: 'salsify', name: 'Salsify', category: 'root-vegetables' },
  { id: 'hamburg-parsley', name: 'Hamburg Parsley', category: 'root-vegetables' },

  // Brassicas
  { id: 'broccoli', name: 'Broccoli', category: 'brassicas' },
  { id: 'cabbage', name: 'Cabbage', category: 'brassicas' },
  { id: 'cauliflower', name: 'Cauliflower', category: 'brassicas' },
  { id: 'brussels-sprouts', name: 'Brussels Sprouts', category: 'brassicas' },
  { id: 'kohlrabi', name: 'Kohlrabi', category: 'brassicas' },

  // Legumes
  { id: 'peas', name: 'Garden Peas', category: 'legumes' },
  { id: 'runner-beans', name: 'Runner Beans', category: 'legumes' },
  { id: 'broad-beans', name: 'Broad Beans', category: 'legumes' },
  { id: 'french-beans', name: 'French Beans', category: 'legumes' },
  
  // Solanaceae
  { id: 'tomato', name: 'Tomato', category: 'solanaceae' },
  { id: 'aubergine', name: 'Aubergine', category: 'solanaceae' },
  
  // Cucurbits
  { id: 'courgette', name: 'Courgette', category: 'cucurbits' },
  { id: 'cucumber', name: 'Cucumber', category: 'cucurbits' },
  { id: 'squash', name: 'Winter Squash', category: 'cucurbits' },
  { id: 'pumpkin', name: 'Pumpkin', category: 'cucurbits' },
  
  // Alliums
  { id: 'onion', name: 'Onion', category: 'alliums' },
  { id: 'garlic', name: 'Garlic', category: 'alliums' },
  { id: 'leek', name: 'Leek', category: 'alliums' },
  { id: 'shallot', name: 'Shallot', category: 'alliums' },
  
  // Herbs
  { id: 'parsley', name: 'Parsley', category: 'herbs' },
  { id: 'coriander', name: 'Coriander', category: 'herbs' },
  { id: 'mint', name: 'Mint', category: 'herbs' },
  { id: 'thyme', name: 'Thyme', category: 'herbs' },
  { id: 'rosemary', name: 'Rosemary', category: 'herbs' },
  { id: 'chives', name: 'Chives', category: 'herbs' },
  { id: 'lovage', name: 'Lovage', category: 'herbs' },
  { id: 'sorrel', name: 'Sorrel', category: 'herbs' },

  // Berries
  { id: 'strawberry', name: 'Strawberry', category: 'berries' },
  { id: 'raspberry', name: 'Raspberry', category: 'berries' },
  { id: 'blackcurrant', name: 'Blackcurrant', category: 'berries' },
  { id: 'redcurrant', name: 'Redcurrant', category: 'berries' },
  { id: 'gooseberry', name: 'Gooseberry', category: 'berries' },
  { id: 'blueberry', name: 'Blueberry', category: 'berries' },
  { id: 'blackberry', name: 'Blackberry', category: 'berries' },
  
  // Fruit Trees
  { id: 'apple', name: 'Apple', category: 'fruit-trees' },
  { id: 'pear', name: 'Pear', category: 'fruit-trees' },
  { id: 'plum', name: 'Plum', category: 'fruit-trees' },
  { id: 'cherry', name: 'Cherry', category: 'fruit-trees' },

  // Annual Flowers
  { id: 'cosmos', name: 'Cosmos', category: 'annual-flowers' },
  { id: 'sunflower', name: 'Sunflower', category: 'annual-flowers' },
  { id: 'zinnia', name: 'Zinnia', category: 'annual-flowers' },
  { id: 'marigold', name: 'Marigold', category: 'annual-flowers' },
  { id: 'calendula', name: 'Calendula', category: 'annual-flowers' },
  { id: 'nasturtium', name: 'Nasturtium', category: 'annual-flowers' },
  { id: 'cornflower', name: 'Cornflower', category: 'annual-flowers' },

  // Perennial Flowers
  { id: 'lavender', name: 'Lavender', category: 'perennial-flowers' },
  { id: 'echinacea', name: 'Echinacea', category: 'perennial-flowers' },
  { id: 'rudbeckia', name: 'Rudbeckia', category: 'perennial-flowers' },
  { id: 'sedum', name: 'Sedum', category: 'perennial-flowers' },
  { id: 'geranium', name: 'Hardy Geranium', category: 'perennial-flowers' },
  { id: 'salvia', name: 'Salvia', category: 'perennial-flowers' },

  // Bulbs
  { id: 'tulip', name: 'Tulip', category: 'bulbs' },
  { id: 'daffodil', name: 'Daffodil', category: 'bulbs' },
  { id: 'allium-flower', name: 'Ornamental Allium', category: 'bulbs' },
  { id: 'crocus', name: 'Crocus', category: 'bulbs' },
  { id: 'dahlia', name: 'Dahlia', category: 'bulbs' },

  // Climbers
  { id: 'sweet-pea', name: 'Sweet Pea', category: 'climbers' },
  { id: 'clematis', name: 'Clematis', category: 'climbers' },
  { id: 'honeysuckle', name: 'Honeysuckle', category: 'climbers' },
  { id: 'morning-glory', name: 'Morning Glory', category: 'climbers' }
]

/**
 * Get index entry by ID
 */
export function getVegetableIndexById(id: string): VegetableIndex | undefined {
  return vegetableIndex.find(v => v.id === id)
}

/**
 * Get all vegetables by category (index only)
 */
export function getVegetableIndexByCategory(category: VegetableCategory): VegetableIndex[] {
  return vegetableIndex.filter(v => v.category === category)
}

/**
 * Search vegetables by name (index only)
 */
export function searchVegetableIndex(query: string): VegetableIndex[] {
  const lowerQuery = query.toLowerCase()
  return vegetableIndex.filter(v =>
    v.name.toLowerCase().includes(lowerQuery) ||
    v.id.toLowerCase().includes(lowerQuery)
  )
}

/**
 * Scored vegetable result for ranked search
 */
export interface ScoredVegetable extends VegetableIndex {
  score: number
}

/**
 * Search and score vegetables with relevance ranking
 * Used for autocomplete to show most relevant results first
 *
 * Scoring:
 * - Exact match: 200 points
 * - Prefix match: 100 points
 * - Word boundary match: 50 points
 * - Substring match: 25 points
 *
 * @param query Search query
 * @param category Optional category filter
 * @returns Scored and sorted results (highest score first)
 */
export function searchAndScoreVegetables(
  query: string,
  category?: VegetableCategory
): ScoredVegetable[] {
  // Filter by category first if specified
  const plants = category
    ? vegetableIndex.filter(v => v.category === category)
    : vegetableIndex

  // If no query, return all plants with zero score
  if (!query.trim()) {
    return plants.map(p => ({ ...p, score: 0 }))
  }

  const lowerQuery = query.toLowerCase()

  return plants
    .map(plant => {
      const lowerName = plant.name.toLowerCase()
      let score = 0

      // Exact match (highest priority)
      if (lowerName === lowerQuery) score += 200

      // Prefix match (starts with query)
      if (lowerName.startsWith(lowerQuery)) score += 100

      // Word boundary match (any word starts with query)
      const words = lowerName.split(/\s+/)
      if (words.some(w => w.startsWith(lowerQuery))) score += 50

      // Substring match (contains query anywhere)
      if (lowerName.includes(lowerQuery)) score += 25

      return { ...plant, score }
    })
    .filter(p => p.score > 0)
    .sort((a, b) => {
      // Sort by score descending, then alphabetically
      if (b.score !== a.score) return b.score - a.score
      return a.name.localeCompare(b.name)
    })
}




