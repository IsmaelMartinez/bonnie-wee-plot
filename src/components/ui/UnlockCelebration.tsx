/**
 * Unlock Celebration Modal
 *
 * Shows when a feature becomes unlocked through progressive disclosure.
 * Educational tone - explains what the feature does rather than gamifying.
 * Simple, clean UI with a "Got it" dismiss button.
 */

'use client'

import { ReactNode } from 'react'
import Dialog from './Dialog'
import type { UnlockableFeature } from '@/lib/feature-flags'

export interface FeatureInfo {
  name: string
  description: string
  icon: ReactNode
  /** Optional tips or guidance for using the feature */
  tips?: string[]
}

interface UnlockCelebrationProps {
  isOpen: boolean
  onClose: () => void
  feature: FeatureInfo | null
}

export default function UnlockCelebration({
  isOpen,
  onClose,
  feature,
}: UnlockCelebrationProps) {
  if (!feature) return null

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="New Feature Available"
      maxWidth="sm"
      showCloseButton={false}
    >
      <div className="text-center">
        {/* Feature Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-zen-moss-50 flex items-center justify-center text-zen-moss-600">
            {feature.icon}
          </div>
        </div>

        {/* Feature Name */}
        <h3 className="text-xl font-semibold text-zen-ink-800 mb-2">
          {feature.name}
        </h3>

        {/* Feature Description */}
        <p className="text-zen-stone-600 mb-4">
          {feature.description}
        </p>

        {/* Tips (if provided) */}
        {feature.tips && feature.tips.length > 0 && (
          <div className="bg-zen-stone-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm font-medium text-zen-ink-700 mb-2">Getting started:</p>
            <ul className="text-sm text-zen-stone-600 space-y-1">
              {feature.tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-zen-moss-500 mt-0.5">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={onClose}
          className="zen-btn-primary w-full"
        >
          Got it
        </button>
      </div>
    </Dialog>
  )
}

/**
 * Feature information for each unlockable feature
 */
export const FEATURE_INFO: Record<UnlockableFeature, Omit<FeatureInfo, 'icon'>> = {
  'ai-advisor': {
    name: 'Ask Aitor',
    description: 'Get personalized gardening advice from Aitor, your AI garden assistant. Ask questions about planting, pest control, companion planting, and more.',
    tips: [
      'Look for the Aitor chat button in the bottom-right corner',
      'You can ask about specific plants in your plot',
      'Upload photos for plant identification help',
    ],
  },
  'compost': {
    name: 'Compost Tracker',
    description: 'Track your compost piles and learn when they\'re ready to use. Monitor temperature, moisture, and turning schedules.',
    tips: [
      'Find Compost in the More menu',
      'Add your existing piles to start tracking',
      'Log when you turn or water your compost',
    ],
  },
  'allotment-layout': {
    name: 'Allotment Layout',
    description: 'Visualize and plan your entire allotment. Arrange beds, paths, and permanent features in a customizable grid.',
    tips: [
      'Find Allotment in the More menu',
      'Drag and drop to arrange your plot',
      'Add trees, berries, and infrastructure',
    ],
  },
}
