/**
 * Shared plant emoji utilities for garden planner components
 */

const categoryEmojis: Record<string, string> = {
  'leafy-greens': '🥬',
  'root-vegetables': '🥕',
  'brassicas': '🥦',
  'legumes': '🫛',
  'solanaceae': '🍅',
  'cucurbits': '🥒',
  'alliums': '🧅',
  'herbs': '🌿',
  'berries': '🍓',
  'fruit-trees': '🌳',
  'annual-flowers': '🌸',
  'perennial-flowers': '🌺',
  'bulbs': '🌷',
  'climbers': '🪴',
  'green-manures': '🌱',
  'mushrooms': '🍄',
  'other': '🌱'
}

const plantEmojis: Record<string, string> = {
  'potato': '🥔',
  'pepper': '🌶️',
  'aubergine': '🍆',
  'peas': '🫛',
  'sugar-snap-peas': '🫛',
  'asparagus-peas': '🫛',
}

/**
 * Get an emoji for a plant ID or vegetable category
 */
export function getPlantEmoji(plantIdOrCategory: string): string {
  return plantEmojis[plantIdOrCategory] || categoryEmojis[plantIdOrCategory] || '🌱'
}

