import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  trackEvent,
  loadAnalytics,
  getAnalyticsSummary,
  clearAnalytics,
  exportAnalytics,
  getEventCountsByCategory,
  getEventCountsByAction,
  getAllEvents,
  getRecentEvents,
} from '@/lib/analytics'
import { STORAGE_KEY_ANALYTICS } from '@/lib/storage-keys'

describe('analytics', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-06-15T10:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
    localStorage.clear()
  })

  describe('loadAnalytics', () => {
    it('should return empty events when no data exists', () => {
      const data = loadAnalytics()
      expect(data.events).toEqual([])
    })

    it('should return stored events', () => {
      const stored = {
        events: [
          { category: 'test', action: 'run', timestamp: '2025-01-01T00:00:00Z' },
        ],
      }
      localStorage.setItem(STORAGE_KEY_ANALYTICS, JSON.stringify(stored))

      const data = loadAnalytics()
      expect(data.events).toHaveLength(1)
      expect(data.events[0].category).toBe('test')
    })

    it('should return empty events for invalid JSON', () => {
      localStorage.setItem(STORAGE_KEY_ANALYTICS, 'not-json')
      const data = loadAnalytics()
      expect(data.events).toEqual([])
    })

    it('should return empty events when events is not an array', () => {
      localStorage.setItem(STORAGE_KEY_ANALYTICS, JSON.stringify({ events: 'not-array' }))
      const data = loadAnalytics()
      expect(data.events).toEqual([])
    })
  })

  describe('trackEvent', () => {
    it('should add an event to localStorage', () => {
      trackEvent('planting', 'added', 'tomato')

      const data = loadAnalytics()
      expect(data.events).toHaveLength(1)
      expect(data.events[0].category).toBe('planting')
      expect(data.events[0].action).toBe('added')
      expect(data.events[0].label).toBe('tomato')
    })

    it('should include ISO timestamp', () => {
      trackEvent('feature', 'unlock')

      const data = loadAnalytics()
      expect(data.events[0].timestamp).toBe('2025-06-15T10:00:00.000Z')
    })

    it('should handle events without a label', () => {
      trackEvent('app', 'opened')

      const data = loadAnalytics()
      expect(data.events[0].label).toBeUndefined()
    })

    it('should accumulate multiple events', () => {
      trackEvent('a', 'one')
      trackEvent('b', 'two')
      trackEvent('c', 'three')

      const data = loadAnalytics()
      expect(data.events).toHaveLength(3)
    })

    it('should keep only the last 100 events (rolling window)', () => {
      // Track 105 events
      for (let i = 0; i < 105; i++) {
        trackEvent('bulk', `action-${i}`)
      }

      const data = loadAnalytics()
      expect(data.events).toHaveLength(100)
      // Should have dropped the first 5
      expect(data.events[0].action).toBe('action-5')
      expect(data.events[99].action).toBe('action-104')
    })
  })

  describe('clearAnalytics', () => {
    it('should remove analytics data from localStorage', () => {
      trackEvent('test', 'event')
      expect(loadAnalytics().events).toHaveLength(1)

      clearAnalytics()
      expect(loadAnalytics().events).toEqual([])
    })

    it('should not throw when no data exists', () => {
      expect(() => clearAnalytics()).not.toThrow()
    })
  })

  describe('exportAnalytics', () => {
    it('should return JSON string of analytics data', () => {
      trackEvent('export', 'test')

      const exported = exportAnalytics()
      const parsed = JSON.parse(exported)
      expect(parsed.events).toHaveLength(1)
      expect(parsed.events[0].category).toBe('export')
    })

    it('should return formatted JSON (pretty-printed)', () => {
      trackEvent('format', 'check')
      const exported = exportAnalytics()
      // Pretty-printed JSON has newlines
      expect(exported).toContain('\n')
    })

    it('should return empty events when no data', () => {
      const exported = exportAnalytics()
      const parsed = JSON.parse(exported)
      expect(parsed.events).toEqual([])
    })
  })

  describe('getEventCountsByCategory', () => {
    it('should return empty object when no events', () => {
      expect(getEventCountsByCategory()).toEqual({})
    })

    it('should count events by category', () => {
      trackEvent('planting', 'added')
      trackEvent('planting', 'removed')
      trackEvent('ai', 'query')

      const counts = getEventCountsByCategory()
      expect(counts['planting']).toBe(2)
      expect(counts['ai']).toBe(1)
    })
  })

  describe('getEventCountsByAction', () => {
    it('should return empty object when no events', () => {
      expect(getEventCountsByAction()).toEqual({})
    })

    it('should count events by category and action', () => {
      trackEvent('planting', 'added')
      trackEvent('planting', 'added')
      trackEvent('planting', 'removed')
      trackEvent('ai', 'query')

      const counts = getEventCountsByAction()
      expect(counts['planting']['added']).toBe(2)
      expect(counts['planting']['removed']).toBe(1)
      expect(counts['ai']['query']).toBe(1)
    })
  })

  describe('getAllEvents', () => {
    it('should return empty array when no events', () => {
      expect(getAllEvents()).toEqual([])
    })

    it('should return all tracked events', () => {
      trackEvent('a', 'one')
      trackEvent('b', 'two')

      const events = getAllEvents()
      expect(events).toHaveLength(2)
    })
  })

  describe('getRecentEvents', () => {
    it('should return events in reverse order (most recent first)', () => {
      vi.setSystemTime(new Date('2025-06-15T10:00:00Z'))
      trackEvent('first', 'event')
      vi.setSystemTime(new Date('2025-06-15T11:00:00Z'))
      trackEvent('second', 'event')
      vi.setSystemTime(new Date('2025-06-15T12:00:00Z'))
      trackEvent('third', 'event')

      const recent = getRecentEvents()
      expect(recent[0].category).toBe('third')
      expect(recent[1].category).toBe('second')
      expect(recent[2].category).toBe('first')
    })

    it('should limit results to specified count', () => {
      for (let i = 0; i < 10; i++) {
        trackEvent(`cat-${i}`, 'event')
      }

      const recent = getRecentEvents(3)
      expect(recent).toHaveLength(3)
    })

    it('should default to 20 results', () => {
      for (let i = 0; i < 30; i++) {
        trackEvent(`cat-${i}`, 'event')
      }

      const recent = getRecentEvents()
      expect(recent).toHaveLength(20)
    })
  })

  describe('getAnalyticsSummary', () => {
    it('should return summary with zero events when empty', () => {
      const summary = getAnalyticsSummary()
      expect(summary.totalEvents).toBe(0)
      expect(summary.categoryBreakdown).toEqual({})
      expect(summary.recentEvents).toEqual([])
      expect(summary.oldestEvent).toBeNull()
      expect(summary.newestEvent).toBeNull()
    })

    it('should return correct total event count', () => {
      trackEvent('a', 'one')
      trackEvent('b', 'two')
      trackEvent('c', 'three')

      const summary = getAnalyticsSummary()
      expect(summary.totalEvents).toBe(3)
    })

    it('should return category breakdown', () => {
      trackEvent('planting', 'added')
      trackEvent('planting', 'removed')
      trackEvent('ai', 'query')

      const summary = getAnalyticsSummary()
      expect(summary.categoryBreakdown['planting']).toBe(2)
      expect(summary.categoryBreakdown['ai']).toBe(1)
    })

    it('should return oldest and newest event timestamps', () => {
      vi.setSystemTime(new Date('2025-01-01T00:00:00Z'))
      trackEvent('first', 'event')
      vi.setSystemTime(new Date('2025-06-15T12:00:00Z'))
      trackEvent('last', 'event')

      const summary = getAnalyticsSummary()
      expect(summary.oldestEvent).toBe('2025-01-01T00:00:00.000Z')
      expect(summary.newestEvent).toBe('2025-06-15T12:00:00.000Z')
    })

    it('should return up to 10 recent events', () => {
      for (let i = 0; i < 20; i++) {
        trackEvent(`cat-${i}`, 'event')
      }

      const summary = getAnalyticsSummary()
      expect(summary.recentEvents).toHaveLength(10)
    })
  })
})
