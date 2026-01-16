'use client'

import { useEffect } from 'react'
import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals'
import { logger } from '@/lib/logger'

/**
 * Web Vitals Reporter Component
 *
 * Tracks Core Web Vitals metrics and logs them for observability:
 * - LCP (Largest Contentful Paint) - loading performance
 * - FCP (First Contentful Paint) - initial render time
 * - CLS (Cumulative Layout Shift) - visual stability
 * - INP (Interaction to Next Paint) - responsiveness (replaced FID)
 * - TTFB (Time to First Byte) - server response time
 *
 * Include this component once in the root layout.
 */
export function WebVitalsReporter() {
  useEffect(() => {
    try {
      // Report metrics to logger (and eventually to analytics service)
      const reportMetric = (metric: Metric) => {
        try {
          // Round values for cleaner logging
          const value = Math.round(metric.value * 100) / 100
          const rating = metric.rating // 'good', 'needs-improvement', or 'poor'

          logger.info(`Web Vitals: ${metric.name}`, {
            name: metric.name,
            value,
            rating,
            navigationType: metric.navigationType,
            id: metric.id,
          })

          // In production, send to analytics service if configured
          if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
            // Future: Send to analytics endpoint
            // sendToAnalytics({ name: metric.name, value, rating })
          }
        } catch (error) {
          console.warn('[WebVitals] Failed to report metric:', error)
        }
      }

      // Register all Core Web Vitals observers
      onLCP(reportMetric)
      onFCP(reportMetric)
      onCLS(reportMetric)
      onINP(reportMetric)
      onTTFB(reportMetric)
    } catch (error) {
      console.warn('[WebVitals] Failed to initialize observers:', error)
    }
  }, [])

  // This component renders nothing - it only reports metrics
  return null
}
