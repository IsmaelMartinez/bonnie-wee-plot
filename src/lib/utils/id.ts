/**
 * Shared ID generation utility
 * Centralized ID generation for all entities in the application
 */

/**
 * Generate a unique ID with an optional prefix
 * @param prefix - Optional prefix for the ID (e.g., 'planting', 'task')
 * @returns A unique ID string
 */
export function generateId(prefix?: string): string {
  const base = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  return prefix ? `${prefix}-${base}` : base
}

/**
 * Convert a string to a URL-friendly slug
 * "Bed A" -> "bed-a"
 * "Raised Bed 1" -> "raised-bed-1"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-')      // Replace multiple hyphens with single
}

/**
 * Generate a unique slug-based ID, appending a number if needed
 * @param name - The name to slugify
 * @param existingIds - Set of IDs that already exist
 * @returns A unique slug ID
 */
export function generateSlugId(name: string, existingIds: Set<string>): string {
  const baseSlug = slugify(name)

  if (!existingIds.has(baseSlug)) {
    return baseSlug
  }

  // Append incrementing number until unique
  let counter = 2
  while (existingIds.has(`${baseSlug}-${counter}`)) {
    counter++
  }
  return `${baseSlug}-${counter}`
}


