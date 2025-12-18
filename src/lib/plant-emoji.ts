/**
 * Shared plant emoji utilities for garden planner components
 */

/**
 * Get an emoji representation for a vegetable category
 */
export function getPlantEmoji(category: string): string {
  const emojis: Record<string, string> = {
    'leafy-greens': '🥬',
    'root-vegetables': '🥕',
    'brassicas': '🥦',
    'legumes': '🫛',
    'solanaceae': '🍅',
    'cucurbits': '🥒',
    'alliums': '🧅',
    'herbs': '🌿',
    'berries': '🍓',
    'fruit-trees': '🍎'
  }
  return emojis[category] || '🌱'
}

