'use client'

import { CheckCircle2, Leaf, Calendar, Book, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface WizardStep4CompleteProps {
  onFinish: () => void
  areasCount: number
}

export default function WizardStep4Complete({ onFinish, areasCount }: WizardStep4CompleteProps) {
  return (
    <div className="space-y-6">
      {/* Success Icon */}
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-display text-zen-ink-800 mb-2">
          You&apos;re All Set!
        </h2>
        <p className="text-zen-stone-600">
          Your allotment has been created with {areasCount} {areasCount === 1 ? 'area' : 'areas'}
        </p>
      </div>

      {/* Next Steps */}
      <div className="bg-zen-moss-50 border border-zen-moss-200 rounded-zen-lg p-6">
        <h3 className="font-medium text-zen-ink-800 mb-4">What&apos;s Next?</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-zen-moss-100 rounded-zen flex items-center justify-center shrink-0">
              <Leaf className="w-4 h-4 text-zen-moss-600" />
            </div>
            <div>
              <h4 className="font-medium text-zen-ink-800 text-sm">Add Your First Plantings</h4>
              <p className="text-sm text-zen-stone-600">
                Click on any bed in the layout to add what you&apos;re growing this season
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-zen-water-100 rounded-zen flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 text-zen-water-600" />
            </div>
            <div>
              <h4 className="font-medium text-zen-ink-800 text-sm">Check Your Monthly Tasks</h4>
              <p className="text-sm text-zen-stone-600">
                Visit &ldquo;This Month&rdquo; to see what you should be planting or harvesting now
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-zen-sakura-100 rounded-zen flex items-center justify-center shrink-0">
              <Book className="w-4 h-4 text-zen-sakura-600" />
            </div>
            <div>
              <h4 className="font-medium text-zen-ink-800 text-sm">Explore the Seed Catalog</h4>
              <p className="text-sm text-zen-stone-600">
                Browse 100+ vegetables with detailed planting and care guides
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-zen-kitsune-100 rounded-zen flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-zen-kitsune-600" />
            </div>
            <div>
              <h4 className="font-medium text-zen-ink-800 text-sm">Ask Aitor for Advice</h4>
              <p className="text-sm text-zen-stone-600">
                Get personalized gardening tips from your AI companion (requires OpenAI API key)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/seeds"
          className="px-4 py-3 bg-zen-stone-100 text-zen-stone-700 rounded-zen-lg hover:bg-zen-stone-200 transition text-center font-medium text-sm"
        >
          Browse Seeds
        </Link>
        <Link
          href="/this-month"
          className="px-4 py-3 bg-zen-stone-100 text-zen-stone-700 rounded-zen-lg hover:bg-zen-stone-200 transition text-center font-medium text-sm"
        >
          This Month
        </Link>
      </div>

      {/* Finish Button */}
      <button
        onClick={onFinish}
        className="w-full px-4 py-3 bg-zen-moss-600 text-white rounded-zen-lg hover:bg-zen-moss-700 transition font-medium"
      >
        Start Gardening! 🌱
      </button>
    </div>
  )
}
