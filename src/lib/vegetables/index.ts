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
  { id: 'cavolo-nero', name: 'Cavolo Nero (Black Kale)', category: 'leafy-greens' },
  { id: 'chard', name: 'Swiss Chard', category: 'leafy-greens' },
  { id: 'rocket', name: 'Rocket', category: 'leafy-greens' },
  { id: 'pak-choi', name: 'Pak Choi', category: 'leafy-greens' },
  { id: 'mizuna', name: 'Mizuna', category: 'leafy-greens' },
  { id: 'land-cress', name: 'Land Cress', category: 'leafy-greens' },
  { id: 'corn-salad', name: 'Corn Salad (Lamb\'s Lettuce)', category: 'leafy-greens' },
  { id: 'winter-purslane', name: 'Winter Purslane (Claytonia)', category: 'leafy-greens' },
  { id: 'mustard-greens', name: 'Mustard Greens', category: 'leafy-greens' },
  { id: 'watercress', name: 'Watercress', category: 'leafy-greens' },
  { id: 'salad-burnet', name: 'Salad Burnet', category: 'leafy-greens' },
  { id: 'orache', name: 'Orache (Mountain Spinach)', category: 'leafy-greens' },
  { id: 'new-zealand-spinach', name: 'New Zealand Spinach', category: 'leafy-greens' },
  { id: 'good-king-henry', name: 'Good King Henry', category: 'leafy-greens' },
  { id: 'radicchio', name: 'Radicchio', category: 'leafy-greens' },
  { id: 'endive', name: 'Endive', category: 'leafy-greens' },
  { id: 'ice-plant', name: 'Ice Plant', category: 'leafy-greens' },

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
  { id: 'early-potato', name: 'First Early Potato', category: 'root-vegetables' },
  { id: 'second-early-potato', name: 'Second Early Potato', category: 'root-vegetables' },
  { id: 'maincrop-potato', name: 'Maincrop Potato', category: 'root-vegetables' },
  { id: 'florence-fennel', name: 'Florence Fennel', category: 'root-vegetables' },
  { id: 'mooli', name: 'Mooli (Daikon)', category: 'root-vegetables' },
  { id: 'black-radish', name: 'Black Radish', category: 'root-vegetables' },
  { id: 'scorzonera', name: 'Scorzonera', category: 'root-vegetables' },
  { id: 'horseradish', name: 'Horseradish', category: 'root-vegetables' },
  { id: 'chinese-artichoke', name: 'Chinese Artichoke (Crosnes)', category: 'root-vegetables' },
  { id: 'yacon', name: 'Yacon', category: 'root-vegetables' },

  // Brassicas
  { id: 'broccoli', name: 'Broccoli', category: 'brassicas' },
  { id: 'cabbage', name: 'Cabbage', category: 'brassicas' },
  { id: 'cauliflower', name: 'Cauliflower', category: 'brassicas' },
  { id: 'brussels-sprouts', name: 'Brussels Sprouts', category: 'brassicas' },
  { id: 'kohlrabi', name: 'Kohlrabi', category: 'brassicas' },
  { id: 'savoy-cabbage', name: 'Savoy Cabbage', category: 'brassicas' },
  { id: 'red-cabbage', name: 'Red Cabbage', category: 'brassicas' },
  { id: 'chinese-broccoli', name: 'Chinese Broccoli (Kai Lan)', category: 'brassicas' },
  { id: 'romanesco', name: 'Romanesco', category: 'brassicas' },
  { id: 'turnip-tops', name: 'Turnip Tops (Rapini)', category: 'brassicas' },
  { id: 'sea-kale', name: 'Sea Kale', category: 'brassicas' },
  { id: 'mibuna', name: 'Mibuna', category: 'brassicas' },

  // Legumes
  { id: 'peas', name: 'Garden Peas', category: 'legumes' },
  { id: 'runner-beans', name: 'Runner Beans', category: 'legumes' },
  { id: 'broad-beans', name: 'Broad Beans', category: 'legumes' },
  { id: 'french-beans', name: 'French Beans', category: 'legumes' },
  { id: 'climbing-french-beans', name: 'Climbing French Beans', category: 'legumes' },
  { id: 'borlotti-beans', name: 'Borlotti Beans', category: 'legumes' },
  { id: 'edamame', name: 'Edamame (Soy Beans)', category: 'legumes' },
  { id: 'mangetout', name: 'Mangetout (Snow Peas)', category: 'legumes' },
  { id: 'sugar-snap-peas', name: 'Sugar Snap Peas', category: 'legumes' },
  { id: 'asparagus-peas', name: 'Asparagus Peas', category: 'legumes' },
  { id: 'black-turtle-beans', name: 'Black Turtle Beans', category: 'legumes' },
  { id: 'fenugreek', name: 'Fenugreek', category: 'legumes' },

  // Solanaceae
  { id: 'tomato', name: 'Tomato', category: 'solanaceae' },
  { id: 'cherry-tomato', name: 'Cherry Tomato', category: 'solanaceae' },
  { id: 'beefsteak-tomato', name: 'Beefsteak Tomato', category: 'solanaceae' },
  { id: 'plum-tomato', name: 'Plum Tomato', category: 'solanaceae' },
  { id: 'blight-resistant-tomato', name: 'Blight-Resistant Tomato', category: 'solanaceae' },
  { id: 'tomatillo', name: 'Tomatillo', category: 'solanaceae' },
  { id: 'aubergine', name: 'Aubergine', category: 'solanaceae' },
  
  // Cucurbits
  { id: 'courgette', name: 'Courgette', category: 'cucurbits' },
  { id: 'cucumber', name: 'Cucumber', category: 'cucurbits' },
  { id: 'squash', name: 'Winter Squash', category: 'cucurbits' },
  { id: 'pumpkin', name: 'Pumpkin', category: 'cucurbits' },
  { id: 'patty-pan-squash', name: 'Patty Pan Squash', category: 'cucurbits' },
  { id: 'butternut-squash', name: 'Butternut Squash', category: 'cucurbits' },
  { id: 'spaghetti-squash', name: 'Spaghetti Squash', category: 'cucurbits' },
  { id: 'acorn-squash', name: 'Acorn Squash', category: 'cucurbits' },
  { id: 'outdoor-melon', name: 'Outdoor Melon', category: 'cucurbits' },
  { id: 'luffa', name: 'Luffa (Ridged Gourd)', category: 'cucurbits' },
  
  // Alliums
  { id: 'onion', name: 'Onion', category: 'alliums' },
  { id: 'garlic', name: 'Garlic', category: 'alliums' },
  { id: 'leek', name: 'Leek', category: 'alliums' },
  { id: 'spring-onion', name: 'Spring Onion', category: 'alliums' },
  { id: 'shallot', name: 'Shallot', category: 'alliums' },
  { id: 'welsh-onion', name: 'Welsh Onion', category: 'alliums' },
  { id: 'elephant-garlic', name: 'Elephant Garlic', category: 'alliums' },
  { id: 'walking-onion', name: 'Walking Onion', category: 'alliums' },
  { id: 'potato-onion', name: 'Potato Onion', category: 'alliums' },
  { id: 'garlic-chives', name: 'Garlic Chives', category: 'alliums' },
  { id: 'ramps', name: 'Ramps (Wild Leeks)', category: 'alliums' },
  
  // Herbs
  { id: 'parsley', name: 'Parsley', category: 'herbs' },
  { id: 'coriander', name: 'Coriander', category: 'herbs' },
  { id: 'mint', name: 'Mint', category: 'herbs' },
  { id: 'thyme', name: 'Thyme', category: 'herbs' },
  { id: 'rosemary', name: 'Rosemary', category: 'herbs' },
  { id: 'chives', name: 'Chives', category: 'herbs' },
  { id: 'lovage', name: 'Lovage', category: 'herbs' },
  { id: 'sorrel', name: 'Sorrel', category: 'herbs' },
  { id: 'oregano', name: 'Oregano', category: 'herbs' },
  { id: 'sage', name: 'Sage', category: 'herbs' },
  { id: 'french-tarragon', name: 'French Tarragon', category: 'herbs' },
  { id: 'dill', name: 'Dill', category: 'herbs' },
  { id: 'herb-fennel', name: 'Herb Fennel', category: 'herbs' },
  { id: 'lemon-balm', name: 'Lemon Balm', category: 'herbs' },
  { id: 'marjoram', name: 'Marjoram', category: 'herbs' },
  { id: 'bay', name: 'Bay', category: 'herbs' },
  { id: 'borage', name: 'Borage', category: 'herbs' },
  { id: 'chamomile', name: 'Chamomile', category: 'herbs' },
  { id: 'winter-savory', name: 'Winter Savory', category: 'herbs' },
  { id: 'hyssop', name: 'Hyssop', category: 'herbs' },

  // Berries
  { id: 'strawberry', name: 'Strawberry', category: 'berries' },
  { id: 'raspberry', name: 'Raspberry', category: 'berries' },
  { id: 'blackcurrant', name: 'Blackcurrant', category: 'berries' },
  { id: 'redcurrant', name: 'Redcurrant', category: 'berries' },
  { id: 'gooseberry', name: 'Gooseberry', category: 'berries' },
  { id: 'blueberry', name: 'Blueberry', category: 'berries' },
  { id: 'blackberry', name: 'Blackberry', category: 'berries' },
  { id: 'tayberry', name: 'Tayberry', category: 'berries' },
  { id: 'loganberry', name: 'Loganberry', category: 'berries' },
  { id: 'jostaberry', name: 'Jostaberry', category: 'berries' },
  { id: 'honeyberry', name: 'Honeyberry (Haskap)', category: 'berries' },
  { id: 'goji-berry', name: 'Goji Berry', category: 'berries' },
  { id: 'aronia', name: 'Aronia (Chokeberry)', category: 'berries' },
  { id: 'elderberry', name: 'Elderberry', category: 'berries' },
  { id: 'sea-buckthorn', name: 'Sea Buckthorn', category: 'berries' },
  
  // Fruit Trees
  { id: 'apple-tree', name: 'Apple Tree', category: 'fruit-trees' },
  { id: 'pear-tree', name: 'Pear Tree', category: 'fruit-trees' },
  { id: 'plum-tree', name: 'Plum Tree', category: 'fruit-trees' },
  { id: 'cherry-tree', name: 'Cherry Tree', category: 'fruit-trees' },
  { id: 'damson-tree', name: 'Damson Tree', category: 'fruit-trees' },
  { id: 'greengage-tree', name: 'Greengage Tree', category: 'fruit-trees' },
  { id: 'medlar-tree', name: 'Medlar Tree', category: 'fruit-trees' },
  { id: 'quince-tree', name: 'Quince Tree', category: 'fruit-trees' },
  { id: 'fig-tree', name: 'Fig Tree', category: 'fruit-trees' },
  { id: 'mulberry-tree', name: 'Mulberry Tree', category: 'fruit-trees' },

  // Annual Flowers
  { id: 'cosmos', name: 'Cosmos', category: 'annual-flowers' },
  { id: 'sunflower', name: 'Sunflower', category: 'annual-flowers' },
  { id: 'zinnia', name: 'Zinnia', category: 'annual-flowers' },
  { id: 'marigold', name: 'Marigold', category: 'annual-flowers' },
  { id: 'calendula', name: 'Calendula', category: 'annual-flowers' },
  { id: 'nasturtium', name: 'Nasturtium', category: 'annual-flowers' },
  { id: 'cornflower', name: 'Cornflower', category: 'annual-flowers' },
  { id: 'sweet-alyssum', name: 'Sweet Alyssum', category: 'annual-flowers' },
  { id: 'phacelia', name: 'Phacelia', category: 'annual-flowers' },
  { id: 'cleome', name: 'Cleome (Spider Flower)', category: 'annual-flowers' },
  { id: 'nigella', name: 'Love-in-a-Mist (Nigella)', category: 'annual-flowers' },
  { id: 'poppy', name: 'Field Poppy', category: 'annual-flowers' },

  // Perennial Flowers
  { id: 'lavender', name: 'Lavender', category: 'perennial-flowers' },
  { id: 'echinacea', name: 'Echinacea', category: 'perennial-flowers' },
  { id: 'rudbeckia', name: 'Rudbeckia', category: 'perennial-flowers' },
  { id: 'sedum', name: 'Sedum', category: 'perennial-flowers' },
  { id: 'geranium', name: 'Hardy Geranium', category: 'perennial-flowers' },
  { id: 'salvia', name: 'Salvia', category: 'perennial-flowers' },
  { id: 'yarrow', name: 'Yarrow (Achillea)', category: 'perennial-flowers' },
  { id: 'bergamot', name: 'Bergamot (Monarda)', category: 'perennial-flowers' },
  { id: 'comfrey', name: 'Comfrey', category: 'perennial-flowers' },
  { id: 'tansy', name: 'Tansy', category: 'perennial-flowers' },
  { id: 'nepeta', name: 'Nepeta (Catmint)', category: 'perennial-flowers' },
  { id: 'agastache', name: 'Agastache (Anise Hyssop)', category: 'perennial-flowers' },

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
  { id: 'morning-glory', name: 'Morning Glory', category: 'climbers' },
  { id: 'hops', name: 'Hops', category: 'climbers' },
  { id: 'hardy-kiwi', name: 'Hardy Kiwi', category: 'climbers' },

  // Other (Specialty Vegetables)
  { id: 'sweetcorn', name: 'Sweetcorn', category: 'other' },
  { id: 'asparagus', name: 'Asparagus', category: 'other' },
  { id: 'globe-artichoke', name: 'Globe Artichoke', category: 'other' },
  { id: 'rhubarb', name: 'Rhubarb', category: 'other' },
  { id: 'celery', name: 'Celery', category: 'other' },
  { id: 'cardoon', name: 'Cardoon', category: 'other' },
  { id: 'mashua', name: 'Mashua', category: 'other' },
  { id: 'skirret', name: 'Skirret', category: 'root-vegetables' },
  { id: 'seakale', name: 'Sea Kale', category: 'brassicas' },
  { id: 'oca', name: 'Oca', category: 'root-vegetables' },
  { id: 'ulluco', name: 'Ulluco', category: 'root-vegetables' },
  { id: 'ground-nut', name: 'Ground Nut (Apios)', category: 'legumes' },
  { id: 'purple-sprouting-broccoli', name: 'Purple Sprouting Broccoli', category: 'brassicas' },

  // Green Manures
  { id: 'crimson-clover', name: 'Crimson Clover', category: 'green-manures' },
  { id: 'white-clover', name: 'White Clover', category: 'green-manures' },
  { id: 'winter-field-beans', name: 'Winter Field Beans', category: 'green-manures' },
  { id: 'winter-rye', name: 'Winter Rye (Grazing Rye)', category: 'green-manures' },
  { id: 'buckwheat', name: 'Buckwheat', category: 'green-manures' },
  { id: 'white-mustard', name: 'White Mustard', category: 'green-manures' },

  // Mushrooms
  { id: 'oyster-mushroom', name: 'Oyster Mushroom', category: 'mushrooms' },
  { id: 'shiitake', name: 'Shiitake', category: 'mushrooms' },
  { id: 'lions-mane', name: "Lion's Mane", category: 'mushrooms' },
  { id: 'king-oyster', name: 'King Oyster', category: 'mushrooms' },
  { id: 'button-mushroom', name: 'Button Mushroom', category: 'mushrooms' }
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




