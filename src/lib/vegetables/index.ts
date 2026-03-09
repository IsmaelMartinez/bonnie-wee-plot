/**
 * Lightweight vegetable index for fast lookups
 * Full data is lazy-loaded by category as needed
 */

import { DifficultyLevel, VegetableCategory } from '@/types/garden-planner'

export interface VegetableIndex {
  id: string
  name: string
  category: VegetableCategory
  difficulty: DifficultyLevel
}

/**
 * Minimal index of all vegetables for quick access
 * This loads immediately and is used for dropdowns, searches, etc.
 */
export const vegetableIndex: VegetableIndex[] = [
  // Leafy Greens
  { id: 'lettuce', name: 'Lettuce', category: 'leafy-greens', difficulty: 'beginner' },
  { id: 'spinach', name: 'Spinach', category: 'leafy-greens', difficulty: 'beginner' },
  { id: 'perpetual-spinach', name: 'Perpetual Spinach', category: 'leafy-greens', difficulty: 'beginner' },
  { id: 'kale', name: 'Kale', category: 'leafy-greens', difficulty: 'beginner' },
  { id: 'cavolo-nero', name: 'Cavolo Nero (Black Kale)', category: 'leafy-greens', difficulty: 'beginner' },
  { id: 'chard', name: 'Swiss Chard', category: 'leafy-greens', difficulty: 'beginner' },
  { id: 'rocket', name: 'Rocket', category: 'leafy-greens', difficulty: 'beginner' },
  { id: 'pak-choi', name: 'Pak Choi', category: 'leafy-greens', difficulty: 'beginner' },
  { id: 'mizuna', name: 'Mizuna', category: 'leafy-greens', difficulty: 'beginner' },
  { id: 'land-cress', name: 'Land Cress', category: 'leafy-greens', difficulty: 'beginner' },
  { id: 'corn-salad', name: 'Corn Salad (Lamb\'s Lettuce)', category: 'leafy-greens', difficulty: 'beginner' },
  { id: 'winter-purslane', name: 'Winter Purslane (Claytonia)', category: 'leafy-greens', difficulty: 'beginner' },
  { id: 'mustard-greens', name: 'Mustard Greens', category: 'leafy-greens', difficulty: 'beginner' },
  { id: 'watercress', name: 'Watercress', category: 'leafy-greens', difficulty: 'intermediate' },
  { id: 'salad-burnet', name: 'Salad Burnet', category: 'leafy-greens', difficulty: 'beginner' },
  { id: 'orache', name: 'Orache (Mountain Spinach)', category: 'leafy-greens', difficulty: 'beginner' },
  { id: 'new-zealand-spinach', name: 'New Zealand Spinach', category: 'leafy-greens', difficulty: 'beginner' },
  { id: 'good-king-henry', name: 'Good King Henry', category: 'leafy-greens', difficulty: 'beginner' },
  { id: 'radicchio', name: 'Radicchio', category: 'leafy-greens', difficulty: 'intermediate' },
  { id: 'endive', name: 'Endive', category: 'leafy-greens', difficulty: 'intermediate' },
  { id: 'ice-plant', name: 'Ice Plant', category: 'leafy-greens', difficulty: 'beginner' },

  // Root Vegetables
  { id: 'carrot', name: 'Carrot', category: 'root-vegetables', difficulty: 'intermediate' },
  { id: 'beetroot', name: 'Beetroot', category: 'root-vegetables', difficulty: 'beginner' },
  { id: 'parsnip', name: 'Parsnip', category: 'root-vegetables', difficulty: 'intermediate' },
  { id: 'turnip', name: 'Turnip', category: 'root-vegetables', difficulty: 'beginner' },
  { id: 'swede', name: 'Swede', category: 'root-vegetables', difficulty: 'beginner' },
  { id: 'radish', name: 'Radish', category: 'root-vegetables', difficulty: 'beginner' },
  { id: 'potato', name: 'Potato', category: 'solanaceae', difficulty: 'beginner' },
  { id: 'jerusalem-artichoke', name: 'Jerusalem Artichoke', category: 'root-vegetables', difficulty: 'beginner' },
  { id: 'celeriac', name: 'Celeriac', category: 'root-vegetables', difficulty: 'intermediate' },
  { id: 'salsify', name: 'Salsify', category: 'root-vegetables', difficulty: 'intermediate' },
  { id: 'hamburg-parsley', name: 'Hamburg Parsley', category: 'root-vegetables', difficulty: 'beginner' },
  { id: 'early-potato', name: 'First Early Potato', category: 'solanaceae', difficulty: 'beginner' },
  { id: 'second-early-potato', name: 'Second Early Potato', category: 'solanaceae', difficulty: 'beginner' },
  { id: 'maincrop-potato', name: 'Maincrop Potato', category: 'solanaceae', difficulty: 'intermediate' },
  { id: 'florence-fennel', name: 'Florence Fennel', category: 'root-vegetables', difficulty: 'intermediate' },
  { id: 'mooli', name: 'Mooli (Daikon)', category: 'root-vegetables', difficulty: 'beginner' },
  { id: 'black-radish', name: 'Black Radish', category: 'root-vegetables', difficulty: 'beginner' },
  { id: 'scorzonera', name: 'Scorzonera', category: 'root-vegetables', difficulty: 'intermediate' },
  { id: 'horseradish', name: 'Horseradish', category: 'root-vegetables', difficulty: 'beginner' },
  { id: 'chinese-artichoke', name: 'Chinese Artichoke (Crosnes)', category: 'root-vegetables', difficulty: 'beginner' },
  { id: 'yacon', name: 'Yacon', category: 'root-vegetables', difficulty: 'intermediate' },

  // Brassicas
  { id: 'broccoli', name: 'Broccoli', category: 'brassicas', difficulty: 'intermediate' },
  { id: 'cabbage', name: 'Cabbage', category: 'brassicas', difficulty: 'intermediate' },
  { id: 'cauliflower', name: 'Cauliflower', category: 'brassicas', difficulty: 'advanced' },
  { id: 'brussels-sprouts', name: 'Brussels Sprouts', category: 'brassicas', difficulty: 'intermediate' },
  { id: 'kohlrabi', name: 'Kohlrabi', category: 'brassicas', difficulty: 'beginner' },
  { id: 'savoy-cabbage', name: 'Savoy Cabbage', category: 'brassicas', difficulty: 'beginner' },
  { id: 'red-cabbage', name: 'Red Cabbage', category: 'brassicas', difficulty: 'beginner' },
  { id: 'chinese-broccoli', name: 'Chinese Broccoli (Kai Lan)', category: 'brassicas', difficulty: 'beginner' },
  { id: 'romanesco', name: 'Romanesco', category: 'brassicas', difficulty: 'intermediate' },
  { id: 'turnip-tops', name: 'Turnip Tops (Rapini)', category: 'brassicas', difficulty: 'beginner' },
  { id: 'mibuna', name: 'Mibuna', category: 'brassicas', difficulty: 'beginner' },

  // Legumes
  { id: 'peas', name: 'Garden Peas', category: 'legumes', difficulty: 'beginner' },
  { id: 'runner-beans', name: 'Runner Beans', category: 'legumes', difficulty: 'beginner' },
  { id: 'broad-beans', name: 'Broad Beans', category: 'legumes', difficulty: 'beginner' },
  { id: 'french-beans', name: 'French Beans', category: 'legumes', difficulty: 'beginner' },
  { id: 'climbing-french-beans', name: 'Climbing French Beans', category: 'legumes', difficulty: 'beginner' },
  { id: 'borlotti-beans', name: 'Borlotti Beans', category: 'legumes', difficulty: 'beginner' },
  { id: 'edamame', name: 'Edamame (Soy Beans)', category: 'legumes', difficulty: 'intermediate' },
  { id: 'mangetout', name: 'Mangetout (Snow Peas)', category: 'legumes', difficulty: 'beginner' },
  { id: 'sugar-snap-peas', name: 'Sugar Snap Peas', category: 'legumes', difficulty: 'beginner' },
  { id: 'asparagus-peas', name: 'Asparagus Peas', category: 'legumes', difficulty: 'beginner' },
  { id: 'black-turtle-beans', name: 'Black Turtle Beans', category: 'legumes', difficulty: 'intermediate' },
  { id: 'fenugreek', name: 'Fenugreek', category: 'legumes', difficulty: 'beginner' },

  // Solanaceae
  { id: 'cherry-tomato', name: 'Cherry Tomato', category: 'solanaceae', difficulty: 'beginner' },
  { id: 'plum-tomato', name: 'Plum Tomato', category: 'solanaceae', difficulty: 'beginner' },
  { id: 'blight-resistant-tomato', name: 'Blight-Resistant Tomato', category: 'solanaceae', difficulty: 'beginner' },
  { id: 'tomatillo', name: 'Tomatillo', category: 'solanaceae', difficulty: 'intermediate' },

  // Cucurbits
  { id: 'courgette', name: 'Courgette', category: 'cucurbits', difficulty: 'beginner' },
  { id: 'squash', name: 'Winter Squash', category: 'cucurbits', difficulty: 'beginner' },
  { id: 'pumpkin', name: 'Pumpkin', category: 'cucurbits', difficulty: 'beginner' },
  { id: 'patty-pan-squash', name: 'Patty Pan Squash', category: 'cucurbits', difficulty: 'beginner' },
  { id: 'butternut-squash', name: 'Butternut Squash', category: 'cucurbits', difficulty: 'intermediate' },
  { id: 'spaghetti-squash', name: 'Spaghetti Squash', category: 'cucurbits', difficulty: 'intermediate' },
  { id: 'acorn-squash', name: 'Acorn Squash', category: 'cucurbits', difficulty: 'beginner' },
  
  // Alliums
  { id: 'onion', name: 'Onion', category: 'alliums', difficulty: 'beginner' },
  { id: 'garlic', name: 'Garlic', category: 'alliums', difficulty: 'beginner' },
  { id: 'leek', name: 'Leek', category: 'alliums', difficulty: 'beginner' },
  { id: 'spring-onion', name: 'Spring Onion', category: 'alliums', difficulty: 'beginner' },
  { id: 'shallot', name: 'Shallot', category: 'alliums', difficulty: 'beginner' },
  { id: 'welsh-onion', name: 'Welsh Onion', category: 'alliums', difficulty: 'beginner' },
  { id: 'elephant-garlic', name: 'Elephant Garlic', category: 'alliums', difficulty: 'beginner' },
  { id: 'walking-onion', name: 'Walking Onion', category: 'alliums', difficulty: 'beginner' },
  { id: 'potato-onion', name: 'Potato Onion', category: 'alliums', difficulty: 'beginner' },
  { id: 'garlic-chives', name: 'Garlic Chives', category: 'alliums', difficulty: 'beginner' },
  { id: 'ramps', name: 'Ramps (Wild Leeks)', category: 'alliums', difficulty: 'intermediate' },
  
  // Herbs
  { id: 'parsley', name: 'Parsley', category: 'herbs', difficulty: 'beginner' },
  { id: 'coriander', name: 'Coriander', category: 'herbs', difficulty: 'beginner' },
  { id: 'mint', name: 'Mint', category: 'herbs', difficulty: 'beginner' },
  { id: 'thyme', name: 'Thyme', category: 'herbs', difficulty: 'beginner' },
  { id: 'rosemary', name: 'Rosemary', category: 'herbs', difficulty: 'beginner' },
  { id: 'chives', name: 'Chives', category: 'herbs', difficulty: 'beginner' },
  { id: 'lovage', name: 'Lovage', category: 'herbs', difficulty: 'beginner' },
  { id: 'sorrel', name: 'Sorrel', category: 'herbs', difficulty: 'beginner' },
  { id: 'oregano', name: 'Oregano', category: 'herbs', difficulty: 'beginner' },
  { id: 'sage', name: 'Sage', category: 'herbs', difficulty: 'beginner' },
  { id: 'french-tarragon', name: 'French Tarragon', category: 'herbs', difficulty: 'intermediate' },
  { id: 'dill', name: 'Dill', category: 'herbs', difficulty: 'beginner' },
  { id: 'herb-fennel', name: 'Herb Fennel', category: 'herbs', difficulty: 'beginner' },
  { id: 'lemon-balm', name: 'Lemon Balm', category: 'herbs', difficulty: 'beginner' },
  { id: 'marjoram', name: 'Marjoram', category: 'herbs', difficulty: 'beginner' },
  { id: 'bay', name: 'Bay', category: 'herbs', difficulty: 'beginner' },
  { id: 'borage', name: 'Borage', category: 'herbs', difficulty: 'beginner' },
  { id: 'chamomile', name: 'Chamomile', category: 'herbs', difficulty: 'beginner' },
  { id: 'winter-savory', name: 'Winter Savory', category: 'herbs', difficulty: 'beginner' },
  { id: 'hyssop', name: 'Hyssop', category: 'herbs', difficulty: 'beginner' },

  // Berries
  { id: 'strawberry', name: 'Strawberry', category: 'berries', difficulty: 'beginner' },
  { id: 'raspberry', name: 'Raspberry', category: 'berries', difficulty: 'beginner' },
  { id: 'blackcurrant', name: 'Blackcurrant', category: 'berries', difficulty: 'beginner' },
  { id: 'redcurrant', name: 'Redcurrant', category: 'berries', difficulty: 'beginner' },
  { id: 'gooseberry', name: 'Gooseberry', category: 'berries', difficulty: 'beginner' },
  { id: 'blueberry', name: 'Blueberry', category: 'berries', difficulty: 'intermediate' },
  { id: 'blackberry', name: 'Blackberry', category: 'berries', difficulty: 'beginner' },
  { id: 'tayberry', name: 'Tayberry', category: 'berries', difficulty: 'intermediate' },
  { id: 'loganberry', name: 'Loganberry', category: 'berries', difficulty: 'intermediate' },
  { id: 'jostaberry', name: 'Jostaberry', category: 'berries', difficulty: 'beginner' },
  { id: 'honeyberry', name: 'Honeyberry (Haskap)', category: 'berries', difficulty: 'beginner' },
  { id: 'goji-berry', name: 'Goji Berry', category: 'berries', difficulty: 'beginner' },
  { id: 'aronia', name: 'Aronia (Chokeberry)', category: 'berries', difficulty: 'beginner' },
  { id: 'elderberry', name: 'Elderberry', category: 'berries', difficulty: 'beginner' },
  { id: 'sea-buckthorn', name: 'Sea Buckthorn', category: 'berries', difficulty: 'intermediate' },
  
  // Fruit Trees
  { id: 'apple-tree', name: 'Apple Tree', category: 'fruit-trees', difficulty: 'intermediate' },
  { id: 'pear-tree', name: 'Pear Tree', category: 'fruit-trees', difficulty: 'intermediate' },
  { id: 'plum-tree', name: 'Plum Tree', category: 'fruit-trees', difficulty: 'intermediate' },
  { id: 'cherry-tree', name: 'Cherry Tree', category: 'fruit-trees', difficulty: 'intermediate' },
  { id: 'damson-tree', name: 'Damson Tree', category: 'fruit-trees', difficulty: 'beginner' },
  { id: 'greengage-tree', name: 'Greengage Tree', category: 'fruit-trees', difficulty: 'intermediate' },
  { id: 'medlar-tree', name: 'Medlar Tree', category: 'fruit-trees', difficulty: 'beginner' },
  { id: 'quince-tree', name: 'Quince Tree', category: 'fruit-trees', difficulty: 'beginner' },
  { id: 'fig-tree', name: 'Fig Tree', category: 'fruit-trees', difficulty: 'intermediate' },
  { id: 'mulberry-tree', name: 'Mulberry Tree', category: 'fruit-trees', difficulty: 'beginner' },

  // Annual Flowers
  { id: 'cosmos', name: 'Cosmos', category: 'annual-flowers', difficulty: 'beginner' },
  { id: 'sunflower', name: 'Sunflower', category: 'annual-flowers', difficulty: 'beginner' },
  { id: 'zinnia', name: 'Zinnia', category: 'annual-flowers', difficulty: 'beginner' },
  { id: 'marigold', name: 'Marigold', category: 'annual-flowers', difficulty: 'beginner' },
  { id: 'calendula', name: 'Calendula', category: 'annual-flowers', difficulty: 'beginner' },
  { id: 'nasturtium', name: 'Nasturtium', category: 'annual-flowers', difficulty: 'beginner' },
  { id: 'cornflower', name: 'Cornflower', category: 'annual-flowers', difficulty: 'beginner' },
  { id: 'sweet-alyssum', name: 'Sweet Alyssum', category: 'annual-flowers', difficulty: 'beginner' },
  { id: 'phacelia', name: 'Phacelia', category: 'annual-flowers', difficulty: 'beginner' },
  { id: 'cleome', name: 'Cleome (Spider Flower)', category: 'annual-flowers', difficulty: 'beginner' },
  { id: 'nigella', name: 'Love-in-a-Mist (Nigella)', category: 'annual-flowers', difficulty: 'beginner' },
  { id: 'poppy', name: 'Field Poppy', category: 'annual-flowers', difficulty: 'beginner' },

  // Perennial Flowers
  { id: 'lavender', name: 'Lavender', category: 'perennial-flowers', difficulty: 'intermediate' },
  { id: 'echinacea', name: 'Echinacea', category: 'perennial-flowers', difficulty: 'intermediate' },
  { id: 'rudbeckia', name: 'Rudbeckia', category: 'perennial-flowers', difficulty: 'beginner' },
  { id: 'sedum', name: 'Sedum', category: 'perennial-flowers', difficulty: 'beginner' },
  { id: 'geranium', name: 'Hardy Geranium', category: 'perennial-flowers', difficulty: 'beginner' },
  { id: 'salvia', name: 'Salvia', category: 'perennial-flowers', difficulty: 'intermediate' },
  { id: 'yarrow', name: 'Yarrow (Achillea)', category: 'perennial-flowers', difficulty: 'beginner' },
  { id: 'bergamot', name: 'Bergamot (Monarda)', category: 'perennial-flowers', difficulty: 'beginner' },
  { id: 'comfrey', name: 'Comfrey', category: 'perennial-flowers', difficulty: 'beginner' },
  { id: 'tansy', name: 'Tansy', category: 'perennial-flowers', difficulty: 'beginner' },
  { id: 'nepeta', name: 'Nepeta (Catmint)', category: 'perennial-flowers', difficulty: 'beginner' },
  { id: 'agastache', name: 'Agastache (Anise Hyssop)', category: 'perennial-flowers', difficulty: 'beginner' },

  // Bulbs
  { id: 'tulip', name: 'Tulip', category: 'bulbs', difficulty: 'beginner' },
  { id: 'daffodil', name: 'Daffodil', category: 'bulbs', difficulty: 'beginner' },
  { id: 'allium-flower', name: 'Ornamental Allium', category: 'bulbs', difficulty: 'beginner' },
  { id: 'crocus', name: 'Crocus', category: 'bulbs', difficulty: 'beginner' },
  { id: 'dahlia', name: 'Dahlia', category: 'bulbs', difficulty: 'intermediate' },

  // Climbers
  { id: 'sweet-pea', name: 'Sweet Pea', category: 'climbers', difficulty: 'intermediate' },
  { id: 'clematis', name: 'Clematis', category: 'climbers', difficulty: 'intermediate' },
  { id: 'honeysuckle', name: 'Honeysuckle', category: 'climbers', difficulty: 'beginner' },
  { id: 'morning-glory', name: 'Morning Glory', category: 'climbers', difficulty: 'beginner' },
  { id: 'hops', name: 'Hops', category: 'climbers', difficulty: 'intermediate' },
  { id: 'hardy-kiwi', name: 'Hardy Kiwi', category: 'climbers', difficulty: 'intermediate' },

  // Other (Specialty Vegetables)
  { id: 'sweetcorn', name: 'Sweetcorn', category: 'other', difficulty: 'intermediate' },
  { id: 'asparagus', name: 'Asparagus', category: 'other', difficulty: 'intermediate' },
  { id: 'globe-artichoke', name: 'Globe Artichoke', category: 'other', difficulty: 'intermediate' },
  { id: 'rhubarb', name: 'Rhubarb', category: 'other', difficulty: 'beginner' },
  { id: 'celery', name: 'Celery', category: 'other', difficulty: 'intermediate' },
  { id: 'cardoon', name: 'Cardoon', category: 'other', difficulty: 'advanced' },
  { id: 'mashua', name: 'Mashua', category: 'other', difficulty: 'intermediate' },
  { id: 'skirret', name: 'Skirret', category: 'root-vegetables', difficulty: 'beginner' },
  { id: 'seakale', name: 'Sea Kale', category: 'brassicas', difficulty: 'intermediate' },
  { id: 'oca', name: 'Oca', category: 'root-vegetables', difficulty: 'intermediate' },
  { id: 'ulluco', name: 'Ulluco', category: 'root-vegetables', difficulty: 'intermediate' },
  { id: 'ground-nut', name: 'Ground Nut (Apios)', category: 'legumes', difficulty: 'intermediate' },
  { id: 'purple-sprouting-broccoli', name: 'Purple Sprouting Broccoli', category: 'brassicas', difficulty: 'intermediate' },

  // Green Manures
  { id: 'crimson-clover', name: 'Crimson Clover', category: 'green-manures', difficulty: 'beginner' },
  { id: 'white-clover', name: 'White Clover', category: 'green-manures', difficulty: 'beginner' },
  { id: 'winter-field-beans', name: 'Winter Field Beans', category: 'green-manures', difficulty: 'beginner' },
  { id: 'winter-rye', name: 'Winter Rye (Grazing Rye)', category: 'green-manures', difficulty: 'beginner' },
  { id: 'buckwheat', name: 'Buckwheat', category: 'green-manures', difficulty: 'beginner' },
  { id: 'white-mustard', name: 'White Mustard', category: 'green-manures', difficulty: 'beginner' },

  // Mushrooms
  { id: 'oyster-mushroom', name: 'Oyster Mushroom', category: 'mushrooms', difficulty: 'beginner' },
  { id: 'shiitake', name: 'Shiitake', category: 'mushrooms', difficulty: 'intermediate' },
  { id: 'lions-mane', name: "Lion's Mane", category: 'mushrooms', difficulty: 'intermediate' },
  { id: 'king-oyster', name: 'King Oyster', category: 'mushrooms', difficulty: 'intermediate' },
  { id: 'button-mushroom', name: 'Button Mushroom', category: 'mushrooms', difficulty: 'advanced' }
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




