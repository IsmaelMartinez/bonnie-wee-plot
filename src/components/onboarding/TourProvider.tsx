'use client'

import { useEffect } from 'react'
import 'driver.js/dist/driver.css'

/**
 * TourProvider - Loads driver.js CSS and applies custom styles for guided tours
 *
 * This component must be included in the app layout to enable tours.
 * It doesn't render any visible content.
 */
export default function TourProvider({ children }: { children: React.ReactNode }) {
  // Inject custom CSS for tour styling
  useEffect(() => {
    const styleId = 'bonnie-tour-styles'
    if (document.getElementById(styleId)) return

    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      /* Custom driver.js styles for Bonnie Wee Plot */
      .driver-popover {
        background: #fafaf9 !important;
        border: 1px solid #e7e5e4 !important;
        border-radius: 12px !important;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
        font-family: var(--font-sans), system-ui, sans-serif !important;
      }

      .driver-popover-title {
        font-size: 1.125rem !important;
        font-weight: 600 !important;
        color: #1c1917 !important;
        font-family: var(--font-display), system-ui, sans-serif !important;
        margin-bottom: 0.5rem !important;
      }

      .driver-popover-description {
        font-size: 0.875rem !important;
        color: #57534e !important;
        line-height: 1.5 !important;
      }

      .driver-popover-progress-text {
        font-size: 0.75rem !important;
        color: #a8a29e !important;
      }

      .driver-popover-prev-btn,
      .driver-popover-next-btn {
        font-size: 0.875rem !important;
        font-weight: 500 !important;
        padding: 0.5rem 1rem !important;
        border-radius: 8px !important;
        transition: all 0.15s ease !important;
        min-height: 40px !important;
      }

      .driver-popover-prev-btn {
        background: #f5f5f4 !important;
        color: #57534e !important;
        border: 1px solid #e7e5e4 !important;
      }

      .driver-popover-prev-btn:hover {
        background: #e7e5e4 !important;
        color: #1c1917 !important;
      }

      .driver-popover-next-btn {
        background: #4a7c59 !important;
        color: white !important;
        border: none !important;
      }

      .driver-popover-next-btn:hover {
        background: #3d6a4a !important;
      }

      .driver-popover-close-btn {
        color: #a8a29e !important;
        transition: color 0.15s ease !important;
      }

      .driver-popover-close-btn:hover {
        color: #57534e !important;
      }

      .driver-popover-arrow-side-left,
      .driver-popover-arrow-side-right,
      .driver-popover-arrow-side-top,
      .driver-popover-arrow-side-bottom {
        border-color: #e7e5e4 !important;
      }

      .driver-overlay {
        background: rgba(28, 25, 23, 0.6) !important;
      }

      /* Subtle highlight animation */
      .driver-active-element {
        animation: bonnie-tour-pulse 2s ease-in-out infinite !important;
      }

      @keyframes bonnie-tour-pulse {
        0%, 100% {
          box-shadow: 0 0 0 4px rgba(74, 124, 89, 0.2);
        }
        50% {
          box-shadow: 0 0 0 8px rgba(74, 124, 89, 0.1);
        }
      }

      /* Respect reduced motion preferences */
      @media (prefers-reduced-motion: reduce) {
        .driver-active-element {
          animation: none !important;
        }
      }
    `
    document.head.appendChild(style)

    return () => {
      const existingStyle = document.getElementById(styleId)
      if (existingStyle) {
        existingStyle.remove()
      }
    }
  }, [])

  return <>{children}</>
}
