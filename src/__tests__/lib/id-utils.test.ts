import { describe, it, expect, vi, afterEach } from 'vitest'
import { generateId, slugify, generateSlugId } from '@/lib/utils/id'

describe('generateId', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should generate a string ID', () => {
    const id = generateId()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
  })

  it('should generate unique IDs on successive calls', () => {
    const id1 = generateId()
    const id2 = generateId()
    expect(id1).not.toBe(id2)
  })

  it('should include the prefix when provided', () => {
    const id = generateId('planting')
    expect(id).toMatch(/^planting-/)
  })

  it('should include the prefix followed by a dash', () => {
    const id = generateId('task')
    expect(id.startsWith('task-')).toBe(true)
  })

  it('should not include a prefix when none is provided', () => {
    // Without prefix, ID starts with timestamp digits
    const id = generateId()
    expect(id).toMatch(/^\d+/)
  })

  it('should contain a timestamp component', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000)
    const id = generateId()
    expect(id).toContain('1700000000000')
  })

  it('should contain a random component after the timestamp', () => {
    const id = generateId()
    // Format: timestamp-random
    const parts = id.split('-')
    expect(parts.length).toBeGreaterThanOrEqual(2)
  })

  it('should work with various prefix values', () => {
    expect(generateId('area')).toMatch(/^area-/)
    expect(generateId('variety')).toMatch(/^variety-/)
    expect(generateId('event')).toMatch(/^event-/)
  })
})

describe('slugify', () => {
  it('should convert to lowercase', () => {
    expect(slugify('Bed A')).toBe('bed-a')
  })

  it('should replace spaces with hyphens', () => {
    expect(slugify('Raised Bed 1')).toBe('raised-bed-1')
  })

  it('should remove special characters', () => {
    expect(slugify('Bed #1!')).toBe('bed-1')
  })

  it('should collapse multiple hyphens into one', () => {
    expect(slugify('Bed  --  A')).toBe('bed-a')
  })

  it('should trim whitespace', () => {
    expect(slugify('  Bed A  ')).toBe('bed-a')
  })

  it('should handle multiple spaces between words', () => {
    expect(slugify('My   Garden   Bed')).toBe('my-garden-bed')
  })

  it('should handle already lowercase text', () => {
    expect(slugify('bed-a')).toBe('bed-a')
  })

  it('should handle numbers', () => {
    expect(slugify('Bed 42')).toBe('bed-42')
  })

  it('should handle underscores (treated as word characters)', () => {
    expect(slugify('my_bed')).toBe('my_bed')
  })

  it('should handle empty string', () => {
    expect(slugify('')).toBe('')
  })

  it('should handle string with only special characters', () => {
    expect(slugify('!@#$%')).toBe('')
  })

  it('should handle mixed alphanumeric and special characters', () => {
    expect(slugify("Tom's Garden (2024)")).toBe('toms-garden-2024')
  })
})

describe('generateSlugId', () => {
  it('should return the base slug when no collision', () => {
    const existingIds = new Set<string>()
    expect(generateSlugId('Bed A', existingIds)).toBe('bed-a')
  })

  it('should append -2 when base slug already exists', () => {
    const existingIds = new Set(['bed-a'])
    expect(generateSlugId('Bed A', existingIds)).toBe('bed-a-2')
  })

  it('should increment counter until unique', () => {
    const existingIds = new Set(['bed-a', 'bed-a-2', 'bed-a-3'])
    expect(generateSlugId('Bed A', existingIds)).toBe('bed-a-4')
  })

  it('should handle large collision chains', () => {
    const existingIds = new Set<string>()
    existingIds.add('garden')
    for (let i = 2; i <= 10; i++) {
      existingIds.add(`garden-${i}`)
    }
    expect(generateSlugId('Garden', existingIds)).toBe('garden-11')
  })

  it('should work with empty existing IDs set', () => {
    const existingIds = new Set<string>()
    const result = generateSlugId('My New Bed', existingIds)
    expect(result).toBe('my-new-bed')
  })

  it('should handle names that slugify to the same value', () => {
    const existingIds = new Set(['raised-bed-1'])
    // "Raised Bed 1" slugifies to "raised-bed-1" which already exists
    expect(generateSlugId('Raised Bed 1', existingIds)).toBe('raised-bed-1-2')
  })

  it('should not collide with unrelated existing IDs', () => {
    const existingIds = new Set(['bed-b', 'bed-c'])
    expect(generateSlugId('Bed A', existingIds)).toBe('bed-a')
  })
})
