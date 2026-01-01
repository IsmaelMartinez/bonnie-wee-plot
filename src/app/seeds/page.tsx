'use client'

import { useState } from 'react'
import { Sprout, ChevronDown, ChevronRight, ExternalLink, Package } from 'lucide-react'
import { myVarieties, getSuppliers, getTotalSpendForYear } from '@/data/my-varieties'
import { getVegetableById } from '@/lib/vegetable-database'

const SUPPLIER_URLS: Record<string, string> = {
  'Organic Gardening': 'https://www.organiccatalogue.com/',
  'Potato House': 'https://www.jbapotatoexperience.co.uk/',
  'Allotment': '',
  'Garden Organic': 'https://www.gardenorganic.org.uk/shop/seeds',
}

export default function SeedsPage() {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  // Group varieties by vegetable
  const grouped = myVarieties.reduce((acc, v) => {
    const veg = getVegetableById(v.vegetableId)
    const groupName = veg?.name || v.vegetableId
    if (!acc[groupName]) acc[groupName] = []
    acc[groupName].push(v)
    return acc
  }, {} as Record<string, typeof myVarieties>)

  const groupNames = Object.keys(grouped).sort()
  const suppliers = getSuppliers()
  const spend2024 = getTotalSpendForYear(2024)
  const spend2025 = getTotalSpendForYear(2025)

  const toggleGroup = (name: string) => {
    const next = new Set(expandedGroups)
    if (next.has(name)) next.delete(name)
    else next.add(name)
    setExpandedGroups(next)
  }

  const expandAll = () => setExpandedGroups(new Set(groupNames))
  const collapseAll = () => setExpandedGroups(new Set())

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Package className="w-10 h-10 text-green-600 mr-3" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
              Seeds & Varieties
            </h1>
          </div>
          <p className="text-gray-600">
            Your tracked seed varieties, suppliers, and spending
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 shadow text-center">
            <div className="text-2xl font-bold text-green-600">{myVarieties.length}</div>
            <div className="text-sm text-gray-500">Varieties</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow text-center">
            <div className="text-2xl font-bold text-green-600">{groupNames.length}</div>
            <div className="text-sm text-gray-500">Vegetables</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow text-center">
            <div className="text-2xl font-bold text-amber-600">£{spend2024.toFixed(2)}</div>
            <div className="text-sm text-gray-500">Spent 2024</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow text-center">
            <div className="text-2xl font-bold text-amber-600">£{spend2025.toFixed(2)}</div>
            <div className="text-sm text-gray-500">Spent 2025</div>
          </div>
        </div>

        {/* Expand/Collapse buttons */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={expandAll}
            className="text-sm text-green-600 hover:text-green-700"
          >
            Expand all
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={collapseAll}
            className="text-sm text-green-600 hover:text-green-700"
          >
            Collapse all
          </button>
        </div>

        {/* Variety groups */}
        <div className="space-y-2">
          {groupNames.map(name => {
            const varieties = grouped[name]
            const isExpanded = expandedGroups.has(name)

            return (
              <div key={name} className="bg-white rounded-lg shadow overflow-hidden">
                <button
                  onClick={() => toggleGroup(name)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                    <Sprout className="w-5 h-5 text-green-500" />
                    <span className="font-medium text-gray-800">{name}</span>
                    <span className="text-sm text-gray-400">({varieties.length})</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-gray-100">
                    <div className="space-y-3">
                      {varieties.map(v => (
                        <div key={v.id} className="pl-7">
                          <div className="flex flex-wrap items-baseline gap-2">
                            <span className="font-medium text-gray-700">{v.name}</span>
                            {v.supplier && (
                              <span className="text-sm text-gray-500">
                                {SUPPLIER_URLS[v.supplier] ? (
                                  <a
                                    href={SUPPLIER_URLS[v.supplier]}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-green-600 hover:underline inline-flex items-center gap-1"
                                  >
                                    {v.supplier}
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                ) : (
                                  v.supplier
                                )}
                              </span>
                            )}
                            {v.price && (
                              <span className="text-sm text-amber-600">£{v.price.toFixed(2)}</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {v.yearsUsed.length > 0 ? (
                              <span>Used: {v.yearsUsed.join(', ')}</span>
                            ) : (
                              <span className="text-red-500">Not used yet</span>
                            )}
                          </div>
                          {v.notes && (
                            <div className="text-sm text-gray-400 italic">{v.notes}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Suppliers section */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Suppliers</h2>
          <div className="flex flex-wrap gap-3">
            {suppliers.map(s => (
              <div key={s}>
                {SUPPLIER_URLS[s] ? (
                  <a
                    href={SUPPLIER_URLS[s]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm hover:bg-green-100"
                  >
                    {s}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm">
                    {s}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Garden Organic link */}
          <div className="mt-6 pt-4 border-t">
            <a
              href="https://www.gardenorganic.org.uk/shop/seeds"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
            >
              Browse Garden Organic Heritage Seeds
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
