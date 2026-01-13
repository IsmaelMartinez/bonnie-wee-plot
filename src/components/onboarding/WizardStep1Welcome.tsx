'use client'

import { Sprout, Map, Calendar, BookOpen } from 'lucide-react'

interface WizardStep1WelcomeProps {
  onNext: () => void
  onSkip: () => void
}

export default function WizardStep1Welcome({ onNext, onSkip }: WizardStep1WelcomeProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-zen-moss-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sprout className="w-8 h-8 text-zen-moss-600" />
        </div>
        <h2 className="text-2xl font-display text-zen-ink-800 mb-2">
          Welcome to Community Allotment
        </h2>
        <p className="text-zen-stone-600">
          Let&apos;s set up your garden in just a few steps
        </p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-zen-moss-50 rounded-zen-lg p-4 border border-zen-moss-200">
          <Map className="w-6 h-6 text-zen-moss-600 mb-2" />
          <h3 className="font-medium text-zen-ink-800 mb-1">Plan Your Layout</h3>
          <p className="text-sm text-zen-stone-600">
            Create and manage your allotment beds, permanent plantings, and infrastructure
          </p>
        </div>

        <div className="bg-zen-water-50 rounded-zen-lg p-4 border border-zen-water-200">
          <Calendar className="w-6 h-6 text-zen-water-600 mb-2" />
          <h3 className="font-medium text-zen-ink-800 mb-1">Track Seasons</h3>
          <p className="text-sm text-zen-stone-600">
            Record what you plant each year and track crop rotation
          </p>
        </div>

        <div className="bg-zen-sakura-50 rounded-zen-lg p-4 border border-zen-sakura-200">
          <BookOpen className="w-6 h-6 text-zen-sakura-600 mb-2" />
          <h3 className="font-medium text-zen-ink-800 mb-1">Vegetable Database</h3>
          <p className="text-sm text-zen-stone-600">
            Access planting guides and care instructions for 100+ vegetables
          </p>
        </div>

        <div className="bg-zen-kitsune-50 rounded-zen-lg p-4 border border-zen-kitsune-200">
          <Sprout className="w-6 h-6 text-zen-kitsune-600 mb-2" />
          <h3 className="font-medium text-zen-ink-800 mb-1">AI Gardening Advice</h3>
          <p className="text-sm text-zen-stone-600">
            Get personalized recommendations from Aitor, your AI gardening assistant
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={onSkip}
          className="flex-1 px-4 py-3 border border-zen-stone-300 text-zen-stone-700 rounded-zen-lg hover:bg-zen-stone-50 transition font-medium"
        >
          Skip Setup
        </button>
        <button
          onClick={onNext}
          className="flex-1 px-4 py-3 bg-zen-moss-600 text-white rounded-zen-lg hover:bg-zen-moss-700 transition font-medium"
        >
          Get Started →
        </button>
      </div>
    </div>
  )
}
