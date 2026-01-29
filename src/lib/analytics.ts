/**
 * Simple Analytics Tracking
 *
 * Local-only analytics stored in localStorage.
 * No external services, no cookies, no PII.
 *
 * Used to understand local usage patterns only.
 */

// ============ TYPES ============

export interface AnalyticsEvent {
  category: string
  action: string
  label?: string
  timestamp: string
}

export interface AnalyticsData {
  events: AnalyticsEvent[]
}

// ============ CONSTANTS ============

import { STORAGE_KEY_ANALYTICS } from './storage-keys'

/** @deprecated Use STORAGE_KEY_ANALYTICS from storage-keys.ts */
export const ANALYTICS_STORAGE_KEY = STORAGE_KEY_ANALYTICS
const MAX_EVENTS = 100

// ============ CORE FUNCTIONS ============

/**
 * Load analytics data from localStorage
 */
export function loadAnalytics(): AnalyticsData {
  if (typeof window === 'undefined') {
    return { events: [] }
  }

  try {
    const stored = localStorage.getItem(ANALYTICS_STORAGE_KEY)
    if (!stored) {
      return { events: [] }
    }

    const parsed = JSON.parse(stored) as Partial<AnalyticsData>
    return {
      events: Array.isArray(parsed.events) ? parsed.events : [],
    }
  } catch {
    return { events: [] }
  }
}

/**
 * Save analytics data to localStorage
 */
function saveAnalytics(data: AnalyticsData): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Silently fail - analytics is non-critical
  }
}

/**
 * Track an analytics event
 *
 * @param category - Event category (e.g., 'feature', 'ai', 'planting', 'onboarding')
 * @param action - Event action (e.g., 'unlock', 'tool-executed', 'added', 'completed')
 * @param label - Optional label for additional context (e.g., feature name, tool name)
 */
export function trackEvent(
  category: string,
  action: string,
  label?: string
): void {
  if (typeof window === 'undefined') return

  const data = loadAnalytics()

  const event: AnalyticsEvent = {
    category,
    action,
    label,
    timestamp: new Date().toISOString(),
  }

  // Add event and keep only the last MAX_EVENTS (rolling window)
  data.events = [...data.events, event].slice(-MAX_EVENTS)

  saveAnalytics(data)
}

// ============ QUERY FUNCTIONS ============

/**
 * Get event counts grouped by category
 */
export function getEventCountsByCategory(): Record<string, number> {
  const data = loadAnalytics()
  const counts: Record<string, number> = {}

  for (const event of data.events) {
    counts[event.category] = (counts[event.category] || 0) + 1
  }

  return counts
}

/**
 * Get event counts grouped by category and action
 */
export function getEventCountsByAction(): Record<string, Record<string, number>> {
  const data = loadAnalytics()
  const counts: Record<string, Record<string, number>> = {}

  for (const event of data.events) {
    if (!counts[event.category]) {
      counts[event.category] = {}
    }
    counts[event.category][event.action] = (counts[event.category][event.action] || 0) + 1
  }

  return counts
}

/**
 * Get all analytics events
 */
export function getAllEvents(): AnalyticsEvent[] {
  return loadAnalytics().events
}

/**
 * Get recent events (most recent first)
 */
export function getRecentEvents(limit: number = 20): AnalyticsEvent[] {
  const data = loadAnalytics()
  return [...data.events].reverse().slice(0, limit)
}

/**
 * Export analytics as JSON string
 */
export function exportAnalytics(): string {
  const data = loadAnalytics()
  return JSON.stringify(data, null, 2)
}

/**
 * Clear all analytics data
 */
export function clearAnalytics(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(ANALYTICS_STORAGE_KEY)
  } catch {
    // Silently fail
  }
}

/**
 * Get analytics summary for display
 */
export function getAnalyticsSummary(): {
  totalEvents: number
  categoryBreakdown: Record<string, number>
  recentEvents: AnalyticsEvent[]
  oldestEvent: string | null
  newestEvent: string | null
} {
  const data = loadAnalytics()
  const counts = getEventCountsByCategory()

  return {
    totalEvents: data.events.length,
    categoryBreakdown: counts,
    recentEvents: getRecentEvents(10),
    oldestEvent: data.events.length > 0 ? data.events[0].timestamp : null,
    newestEvent: data.events.length > 0 ? data.events[data.events.length - 1].timestamp : null,
  }
}
