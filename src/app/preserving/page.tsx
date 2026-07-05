'use client'

import { useState, useMemo, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Search, ExternalLink } from 'lucide-react'
import { vegetableIndex } from '@/lib/vegetables/index'
import { CATEGORY_INFO, type StorageMethod, type VegetableCategory } from '@/types/garden-planner'
import {
  preservationGuides,
  getMethodsInUse,
  PRESERVATION_METHOD_LABELS,
} from '@/lib/preservation'
import type { PreservationGuide, PreservationResource } from '@/types/preservation'

function ResourceLinks({ resources }: { resources: PreservationResource[] }) {
  return (
    <ul className="space-y-1">
      {resources.map(r => (
        <li key={r.url}>
          <a
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-zen-water-700 hover:text-zen-water-800 hover:underline"
          >
            {r.title}
            <ExternalLink className="w-3 h-3 shrink-0" />
          </a>
          <span className="text-xs text-zen-stone-400 ml-1.5">{r.source}</span>
        </li>
      ))}
    </ul>
  )
}

function GuideCard({
  guide,
  name,
  defaultOpen = false,
}: {
  guide: PreservationGuide
  name: string
  defaultOpen?: boolean
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null)

  // Deep links (/preserving?plant=<id>) land expanded and scrolled into view
  useEffect(() => {
    if (defaultOpen) detailsRef.current?.scrollIntoView({ block: 'start' })
  }, [defaultOpen])

  return (
    <details ref={detailsRef} open={defaultOpen || undefined} className="group px-4 py-3">
      <summary className="flex flex-wrap items-center gap-2 cursor-pointer list-none [&::-webkit-details-marker]:hidden min-h-[44px]">
        <span className="text-sm text-zen-ink-700 font-medium">{name}</span>
        <span className="flex flex-wrap gap-1.5">
          {guide.methods.map(m => (
            <span key={m.method} className="zen-badge-moss text-xs">
              {PRESERVATION_METHOD_LABELS[m.method]}
            </span>
          ))}
        </span>
        <span className="ml-auto text-zen-stone-400 text-xs group-open:rotate-180 transition-transform">
          ▾
        </span>
      </summary>

      <div className="mt-3 space-y-4">
        {guide.summary && (
          <p className="text-sm text-zen-stone-600">{guide.summary}</p>
        )}

        {guide.methods.map(m => (
          <div key={m.method}>
            <h4 className="text-sm font-medium text-zen-ink-700 mb-1">
              {PRESERVATION_METHOD_LABELS[m.method]}
              {m.storageLife && (
                <span className="font-normal text-zen-stone-500"> · keeps {m.storageLife}</span>
              )}
            </h4>
            <p className="text-sm text-zen-ink-700 mb-1.5">{m.how}</p>
            {m.resources && m.resources.length > 0 && (
              <ResourceLinks resources={m.resources} />
            )}
          </div>
        ))}

        {guide.recipeIdeas && guide.recipeIdeas.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-zen-ink-700 mb-1">Recipe ideas</h4>
            <ResourceLinks resources={guide.recipeIdeas} />
          </div>
        )}

        <Link
          href={`/plants/${guide.plantId}`}
          className="inline-block text-sm text-zen-moss-700 hover:text-zen-moss-800 hover:underline"
        >
          Growing guide for {name} →
        </Link>
      </div>
    </details>
  )
}

function PreservingContent() {
  const [search, setSearch] = useState('')
  const [selectedMethod, setSelectedMethod] = useState<StorageMethod | 'all'>('all')
  const [selectedCategory, setSelectedCategory] = useState<VegetableCategory | 'all'>('all')
  // ?plant=<id> deep link from the plant detail page expands that crop's card
  const highlightedPlantId = useSearchParams().get('plant')

  const indexById = useMemo(() => new Map(vegetableIndex.map(v => [v.id, v])), [])
  const methodsInUse = useMemo(() => getMethodsInUse(), [])

  // Categories that have at least one authored guide, in CATEGORY_INFO order
  const categoriesInUse = useMemo(() => {
    const inUse = new Set(
      preservationGuides
        .map(g => indexById.get(g.plantId)?.category)
        .filter((c): c is VegetableCategory => c !== undefined)
    )
    return CATEGORY_INFO.filter(c => inUse.has(c.id))
  }, [indexById])

  const grouped = useMemo(() => {
    const lowerSearch = search.toLowerCase()
    const groups: Record<string, { guide: PreservationGuide; name: string }[]> = {}

    for (const guide of preservationGuides) {
      const entry = indexById.get(guide.plantId)
      if (!entry) continue
      if (selectedCategory !== 'all' && entry.category !== selectedCategory) continue
      if (selectedMethod !== 'all' && !guide.methods.some(m => m.method === selectedMethod)) continue
      if (
        search &&
        !entry.name.toLowerCase().includes(lowerSearch) &&
        !guide.plantId.toLowerCase().includes(lowerSearch)
      ) continue

      if (!groups[entry.category]) groups[entry.category] = []
      groups[entry.category].push({ guide, name: entry.name })
    }
    return groups
  }, [search, selectedMethod, selectedCategory, indexById])

  const categoryOrder = CATEGORY_INFO.filter(c => grouped[c.id]?.length)
  const totalCount = Object.values(grouped).reduce((sum, g) => sum + g.length, 0)

  return (
    <div className="min-h-screen bg-zen-stone-50 zen-texture">
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <header className="mb-8">
          <h1 className="text-zen-ink-900 mb-2">Preserving</h1>
          <p className="text-zen-stone-500 text-lg">
            How to store and preserve your harvest — from the fridge and freezer
            to jams, chutneys, pickles, ferments and bakes. All linked resources
            are free to read.
          </p>
        </header>

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zen-stone-400" />
            <input
              type="text"
              placeholder="Search crops..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="zen-input pl-10"
              aria-label="Search crops"
            />
          </div>
          <select
            value={selectedMethod}
            onChange={e => setSelectedMethod(e.target.value as StorageMethod | 'all')}
            className="zen-select sm:w-48"
            aria-label="Filter by preservation method"
          >
            <option value="all">All methods</option>
            {methodsInUse.map(m => (
              <option key={m} value={m}>{PRESERVATION_METHOD_LABELS[m]}</option>
            ))}
          </select>
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value as VegetableCategory | 'all')}
            className="zen-select sm:w-48"
            aria-label="Filter by category"
          >
            <option value="all">All categories</option>
            {categoriesInUse.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <p className="text-sm text-zen-stone-500 mb-4">
          {totalCount} {totalCount === 1 ? 'crop' : 'crops'} found
        </p>

        {categoryOrder.length === 0 ? (
          <div className="zen-card p-8 text-center">
            <p className="text-zen-stone-500">
              {preservationGuides.length === 0
                ? 'Preserving guides are on their way — check back soon.'
                : 'No crops match your search.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {categoryOrder.map(cat => (
              <section key={cat.id}>
                <h2 className="text-lg mb-3">{cat.name}</h2>
                <div className="zen-card divide-y divide-zen-stone-100">
                  {grouped[cat.id]!.map(({ guide, name }) => (
                    <GuideCard
                      key={guide.plantId}
                      guide={guide}
                      name={name}
                      defaultOpen={guide.plantId === highlightedPlantId}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// useSearchParams requires a Suspense boundary during static generation
export default function PreservingPage() {
  return (
    <Suspense fallback={null}>
      <PreservingContent />
    </Suspense>
  )
}
