// Shared category color utilities
// Keep it simple - one place for color mappings

export const CATEGORY_BG_COLORS: Record<string, string> = {
  green: 'bg-green-500',
  orange: 'bg-orange-500',
  purple: 'bg-purple-500',
  lime: 'bg-lime-500',
  red: 'bg-red-500',
  yellow: 'bg-yellow-500',
  amber: 'bg-amber-500',
  emerald: 'bg-emerald-500',
  pink: 'bg-pink-500',
  rose: 'bg-rose-500'
}

export const CATEGORY_FILTER_COLORS: Record<string, string> = {
  green: 'bg-green-100 text-green-800 border-green-300',
  orange: 'bg-orange-100 text-orange-800 border-orange-300',
  purple: 'bg-purple-100 text-purple-800 border-purple-300',
  lime: 'bg-lime-100 text-lime-800 border-lime-300',
  red: 'bg-red-100 text-red-800 border-red-300',
  yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  amber: 'bg-amber-100 text-amber-800 border-amber-300',
  emerald: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  pink: 'bg-pink-100 text-pink-800 border-pink-300',
  rose: 'bg-rose-100 text-rose-800 border-rose-300'
}

export function getCategoryBgClass(color: string): string {
  return CATEGORY_BG_COLORS[color] || 'bg-gray-500'
}

export function getCategoryFilterClass(color: string): string {
  return CATEGORY_FILTER_COLORS[color] || 'bg-gray-100 text-gray-800 border-gray-300'
}


