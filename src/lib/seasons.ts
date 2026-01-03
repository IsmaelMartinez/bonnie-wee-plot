/**
 * Seasonal phases for Scottish allotment gardening
 * Based on month index (0-11 for January-December)
 */

export interface SeasonalPhase {
  name: string
  emoji: string
  action: string
}

export const SEASONAL_PHASES: Record<number, SeasonalPhase> = {
  0: { name: 'Planning Season', emoji: '❄️', action: 'Order seeds & plan rotation' },
  1: { name: 'Early Spring', emoji: '🌱', action: 'Start seeds indoors' },
  2: { name: 'Spring Prep', emoji: '🌿', action: 'Prepare beds & sow early crops' },
  3: { name: 'Planting Time', emoji: '🌻', action: 'Transplant & direct sow' },
  4: { name: 'Growing Season', emoji: '☀️', action: 'Maintain & water' },
  5: { name: 'Peak Season', emoji: '🌽', action: 'Harvest & succession plant' },
  6: { name: 'Midsummer', emoji: '🍅', action: 'Harvest & preserve' },
  7: { name: 'Late Summer', emoji: '🎃', action: 'Harvest main crops' },
  8: { name: 'Autumn', emoji: '🍂', action: 'Clear beds & plant garlic' },
  9: { name: 'Late Autumn', emoji: '🥕', action: 'Lift roots & protect crops' },
  10: { name: 'Early Winter', emoji: '🥬', action: 'Harvest hardy crops' },
  11: { name: 'Rest Period', emoji: '❄️', action: 'Rest & reflect' }
}

/**
 * Get the seasonal phase for a given month
 * @param month - Month index (0-11) where 0 is January
 */
export function getSeasonalPhase(month: number): SeasonalPhase {
  return SEASONAL_PHASES[month] ?? SEASONAL_PHASES[0]
}
