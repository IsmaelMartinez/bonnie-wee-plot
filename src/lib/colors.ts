/**
 * Color mapping utility for zen color palette
 *
 * Converts semantic Tailwind color names to their hex values.
 * This is necessary because semantic class names like 'zen-moss' cannot
 * be used directly in inline styles - only hex colors work in style attributes.
 */

export const ZEN_COLOR_MAP: Record<string, string> = {
  'zen-moss': '#768a5e',      // summer primary - moss green
  'zen-water': '#5a8dad',     // water blue
  'zen-sakura': '#e07294',    // spring primary - cherry blossom pink
  'zen-kitsune': '#d4805a',   // autumn primary - fox orange
  'zen-stone': '#78716c',     // neutral stone gray
  'zen-ume': '#bc728a',       // winter primary - plum purple
}

/**
 * Get hex color value for a semantic color name
 *
 * @param semanticName - The semantic color name (e.g., 'zen-moss')
 * @returns Hex color value, or default gray if not found
 */
export function getColorValue(semanticName: string | undefined): string {
  if (!semanticName) return '#e5e7eb' // default gray

  // Check if it's already a hex color
  if (semanticName.startsWith('#')) {
    return semanticName
  }

  return ZEN_COLOR_MAP[semanticName] || '#e5e7eb'
}
