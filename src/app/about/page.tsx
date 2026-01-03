import { Sprout, Grid3X3, Calendar, Package, MessageCircle, Leaf } from 'lucide-react'
import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-zen-stone-50 zen-texture">
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Leaf className="w-8 h-8 text-zen-moss-600" />
            <h1 className="text-zen-ink-900">Community Allotment</h1>
          </div>
          <p className="text-zen-stone-500 text-lg mb-8">
            Your personal digital companion for garden planning and seasonal growing
          </p>

          <div className="zen-card p-8 bg-zen-moss-50/50 border-zen-moss-200">
            <p className="text-zen-moss-700 text-lg leading-relaxed">
              Plan your garden with intention, track what grows best, and learn
              when to sow, plant, and harvest—all tailored for Scottish conditions.
            </p>
          </div>
        </header>

        {/* Core Features */}
        <section className="mb-12">
          <h2 className="font-display text-zen-ink-800 text-xl text-center mb-6">What You Can Do</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="zen-card p-6 text-center">
              <Grid3X3 className="w-10 h-10 text-zen-moss-600 mx-auto mb-4" />
              <h3 className="font-display text-zen-ink-800 text-lg mb-2">Plan Your Plot</h3>
              <p className="text-zen-stone-600 text-sm">
                Design your allotment layout, manage beds, and plan crop rotation across seasons.
              </p>
            </div>

            <div className="zen-card p-6 text-center">
              <Package className="w-10 h-10 text-zen-bamboo-600 mx-auto mb-4" />
              <h3 className="font-display text-zen-ink-800 text-lg mb-2">Track Seeds</h3>
              <p className="text-zen-stone-600 text-sm">
                Keep inventory of your seed collection, varieties, and where you source them.
              </p>
            </div>

            <div className="zen-card p-6 text-center">
              <Calendar className="w-10 h-10 text-zen-water-600 mx-auto mb-4" />
              <h3 className="font-display text-zen-ink-800 text-lg mb-2">Seasonal Timing</h3>
              <p className="text-zen-stone-600 text-sm">
                Know exactly when to sow, transplant, and harvest for your local climate.
              </p>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="zen-card p-6 bg-zen-moss-50/30 border-zen-moss-200">
            <div className="flex items-center gap-3 mb-3">
              <Sprout className="w-5 h-5 text-zen-moss-600" />
              <h3 className="font-display text-zen-moss-800">My Allotment</h3>
            </div>
            <p className="text-zen-stone-600 text-sm mb-4">
              Manage your beds, plan what to grow, and track your plantings year by year.
            </p>
            <Link
              href="/allotment"
              className="zen-btn-primary inline-block"
            >
              Open Allotment
            </Link>
          </div>

          <div className="zen-card p-6 bg-zen-water-50/30 border-zen-water-200">
            <div className="flex items-center gap-3 mb-3">
              <Calendar className="w-5 h-5 text-zen-water-600" />
              <h3 className="font-display text-zen-water-800">This Month</h3>
            </div>
            <p className="text-zen-stone-600 text-sm mb-4">
              See what to sow, plant, and harvest right now based on the season.
            </p>
            <Link
              href="/this-month"
              className="zen-btn-secondary inline-block"
            >
              View Tasks
            </Link>
          </div>
        </section>

        {/* AI Advisor */}
        <section className="mb-12">
          <div className="zen-card p-6 bg-zen-sakura-50/30 border-zen-sakura-200">
            <div className="flex items-center gap-3 mb-3">
              <MessageCircle className="w-5 h-5 text-zen-sakura-600" />
              <h3 className="font-display text-zen-sakura-800">Ask Aitor</h3>
              <span className="text-xs text-zen-sakura-600 bg-zen-sakura-100 px-2 py-0.5 rounded-full">BYO API Key</span>
            </div>
            <p className="text-zen-stone-600 text-sm mb-4">
              Get personalized gardening advice from our AI assistant. Ask about pests,
              planting schedules, companion plants, or anything else about your garden.
            </p>
            <Link
              href="/ai-advisor"
              className="inline-block text-zen-sakura-700 hover:text-zen-sakura-800 text-sm font-medium transition"
            >
              Talk to Aitor →
            </Link>
          </div>
        </section>

        {/* Philosophy */}
        <section className="mb-12">
          <div className="text-center">
            <h2 className="font-display text-zen-ink-800 text-xl mb-4">Growing with Intention</h2>
            <p className="text-zen-stone-600 text-sm leading-relaxed max-w-2xl mx-auto">
              This tool was built for allotment gardeners who want to keep things simple.
              No subscriptions, no complicated features—just a straightforward way to
              plan your plot and remember what works. Your data stays on your device,
              and you bring your own AI key if you want advice.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-8 border-t border-zen-stone-200 text-center">
          <p className="text-sm text-zen-stone-400">
            Tailored for Scottish gardens
          </p>
        </footer>
      </div>
    </div>
  )
}
