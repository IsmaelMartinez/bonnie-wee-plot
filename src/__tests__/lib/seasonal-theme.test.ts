import { describe, it, expect } from 'vitest'
import {
  getCurrentSeason,
  getSeasonalTheme,
  getCurrentTheme,
  Season,
  SEASONAL_DECORATIONS,
  SEASON_NAMES,
} from '@/lib/seasonal-theme'

describe('getCurrentSeason', () => {
  it('should return winter for December (month 11)', () => {
    expect(getCurrentSeason(11)).toBe('winter')
  })

  it('should return winter for January (month 0)', () => {
    expect(getCurrentSeason(0)).toBe('winter')
  })

  it('should return winter for February (month 1)', () => {
    expect(getCurrentSeason(1)).toBe('winter')
  })

  it('should return spring for March (month 2)', () => {
    expect(getCurrentSeason(2)).toBe('spring')
  })

  it('should return spring for April (month 3)', () => {
    expect(getCurrentSeason(3)).toBe('spring')
  })

  it('should return spring for May (month 4)', () => {
    expect(getCurrentSeason(4)).toBe('spring')
  })

  it('should return summer for June (month 5)', () => {
    expect(getCurrentSeason(5)).toBe('summer')
  })

  it('should return summer for July (month 6)', () => {
    expect(getCurrentSeason(6)).toBe('summer')
  })

  it('should return summer for August (month 7)', () => {
    expect(getCurrentSeason(7)).toBe('summer')
  })

  it('should return autumn for September (month 8)', () => {
    expect(getCurrentSeason(8)).toBe('autumn')
  })

  it('should return autumn for October (month 9)', () => {
    expect(getCurrentSeason(9)).toBe('autumn')
  })

  it('should return autumn for November (month 10)', () => {
    expect(getCurrentSeason(10)).toBe('autumn')
  })

  it('should use current date when no month is provided', () => {
    const result = getCurrentSeason()
    expect(['winter', 'spring', 'summer', 'autumn']).toContain(result)
  })

  it('should map all 12 months to a valid season', () => {
    for (let m = 0; m < 12; m++) {
      const season = getCurrentSeason(m)
      expect(['winter', 'spring', 'summer', 'autumn']).toContain(season)
    }
  })
})

describe('getSeasonalTheme', () => {
  const seasons: Season[] = ['winter', 'spring', 'summer', 'autumn']

  it.each(seasons)('should return a theme object for %s', (season) => {
    const theme = getSeasonalTheme(season)
    expect(theme.season).toBe(season)
    expect(theme.bgPage).toBeTruthy()
    expect(theme.bgCard).toBeTruthy()
    expect(theme.bgAccent).toBeTruthy()
    expect(theme.textAccent).toBeTruthy()
    expect(theme.textMuted).toBeTruthy()
    expect(theme.borderAccent).toBeTruthy()
    expect(theme.badgeClass).toBeTruthy()
    expect(theme.decorPrimary).toBeTruthy()
    expect(theme.decorSecondary).toBeTruthy()
    expect(theme.bgImage).toBeTruthy()
    expect(theme.bgImageCredit).toBeTruthy()
    expect(theme.bgImageCredit.name).toBeTruthy()
    expect(theme.bgImageCredit.url).toBeTruthy()
  })

  it('should return distinct themes for each season', () => {
    const themes = seasons.map(s => getSeasonalTheme(s))
    const bgPages = themes.map(t => t.bgPage)
    expect(new Set(bgPages).size).toBe(4)
  })

  it('should return distinct accent colors for each season', () => {
    const themes = seasons.map(s => getSeasonalTheme(s))
    const decorPrimary = themes.map(t => t.decorPrimary)
    expect(new Set(decorPrimary).size).toBe(4)
  })

  it('should have valid hex color for decorPrimary', () => {
    for (const season of seasons) {
      const theme = getSeasonalTheme(season)
      expect(theme.decorPrimary).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })

  it('should have valid hex color for decorSecondary', () => {
    for (const season of seasons) {
      const theme = getSeasonalTheme(season)
      expect(theme.decorSecondary).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })

  it('should have valid Unsplash URLs for bgImage', () => {
    for (const season of seasons) {
      const theme = getSeasonalTheme(season)
      expect(theme.bgImage).toMatch(/^https:\/\/images\.unsplash\.com\//)
    }
  })
})

describe('getCurrentTheme', () => {
  it('should return a valid theme object', () => {
    const theme = getCurrentTheme()
    expect(theme.season).toBeTruthy()
    expect(theme.bgPage).toBeTruthy()
  })

  it('should match the theme for the current season', () => {
    const theme = getCurrentTheme()
    const expectedTheme = getSeasonalTheme(getCurrentSeason())
    expect(theme).toEqual(expectedTheme)
  })
})

describe('SEASONAL_DECORATIONS', () => {
  it('should have decorations for all four seasons', () => {
    expect(SEASONAL_DECORATIONS.winter).toBeDefined()
    expect(SEASONAL_DECORATIONS.spring).toBeDefined()
    expect(SEASONAL_DECORATIONS.summer).toBeDefined()
    expect(SEASONAL_DECORATIONS.autumn).toBeDefined()
  })

  it('should have motif and elements for each season', () => {
    const seasons: Season[] = ['winter', 'spring', 'summer', 'autumn']
    for (const season of seasons) {
      const decor = SEASONAL_DECORATIONS[season]
      expect(decor.motif).toBeTruthy()
      expect(Array.isArray(decor.elements)).toBe(true)
      expect(decor.elements.length).toBeGreaterThan(0)
    }
  })
})

describe('SEASON_NAMES', () => {
  it('should have names for all four seasons', () => {
    expect(SEASON_NAMES.winter).toBeDefined()
    expect(SEASON_NAMES.spring).toBeDefined()
    expect(SEASON_NAMES.summer).toBeDefined()
    expect(SEASON_NAMES.autumn).toBeDefined()
  })

  it('should have japanese, romaji, and english for each season', () => {
    const seasons: Season[] = ['winter', 'spring', 'summer', 'autumn']
    for (const season of seasons) {
      const name = SEASON_NAMES[season]
      expect(name.japanese).toBeTruthy()
      expect(name.romaji).toBeTruthy()
      expect(name.english).toBeTruthy()
    }
  })
})
