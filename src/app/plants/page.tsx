'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { vegetableIndex } from '@/lib/vegetables/index'
import { CATEGORY_INFO, type VegetableCategory } from '@/types/garden-planner'
import { Suspense } from 'react'

function PlantsIndexContent() {
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get('category') as VegetableCategory | null

  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<VegetableCategory | 'all'>(
    initialCategory && CATEGORY_INFO.some(c => c.id === initialCategory) ? initialCategory : 'all'
  )

  // Group plants by category, applying search and category filters
  const grouped = useMemo(() => {
    const lowerSearch = search.toLowerCase()
    const filtered = vegetableIndex.filter(v => {
      if (selectedCategory !== 'all' && v.category !== selectedCategory) return false
      if (search && !v.name.toLowerCase().includes(lowerSearch) && !v.id.toLowerCase().includes(lowerSearch)) return false
      return true
    })

    const groups: Record<string, typeof filtered> = {}
    for (const v of filtered) {
      const cat = v.category
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(v)
    }
    return groups
  }, [search, selectedCategory])

  // Get categories that have plants (for ordering)
  const categoryOrder = CATEGORY_INFO.filter(c => grouped[c.id]?.length)

  const totalCount = Object.values(grouped).reduce((sum, g) => sum + g.length, 0)

  return (
    <div className="min-h-screen bg-zen-stone-50 zen-texture">
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-zen-ink-900 mb-2">Plant Guide</h1>
          <p className="text-zen-stone-500 text-lg">
            {vegetableIndex.length} plants with growing info for Scotland
          </p>
        </header>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zen-stone-400" />
            <input
              type="text"
              placeholder="Search plants..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="zen-input pl-10"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value as VegetableCategory | 'all')}
            className="zen-select sm:w-48"
          >
            <option value="all">All categories</option>
            {CATEGORY_INFO.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Results count */}
        <p className="text-sm text-zen-stone-500 mb-4">
          {totalCount} {totalCount === 1 ? 'plant' : 'plants'} found
        </p>

        {/* Plant groups */}
        {categoryOrder.length === 0 ? (
          <div className="zen-card p-8 text-center">
            <p className="text-zen-stone-500">No plants match your search.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {categoryOrder.map(cat => {
              const plants = grouped[cat.id]!
              return (
                <section key={cat.id}>
                  <h2 className="text-lg mb-3">{cat.name}</h2>
                  <div className="zen-card divide-y divide-zen-stone-100">
                    {plants.map(v => (
                      <Link
                        key={v.id}
                        href={`/plants/${v.id}`}
                        className="block px-4 py-3 hover:bg-zen-stone-50 transition-colors"
                      >
                        <span className="text-sm text-zen-ink-700">{v.name}</span>
                      </Link>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default function PlantsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zen-stone-50 flex items-center justify-center">
        <p className="text-zen-stone-500">Loading plants...</p>
      </div>
    }>
      <PlantsIndexContent />
    </Suspense>
  )
}
