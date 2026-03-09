import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'
import { getVegetableById } from '@/lib/vegetable-database'
import { vegetableIndex } from '@/lib/vegetables/index'
import {
  MONTH_NAMES_SHORT,
  CATEGORY_INFO,
  type Month,
  type Vegetable,
  type EnhancedCompanion,
  type CareTip,
} from '@/types/garden-planner'

// Generate static params so Next.js can pre-render all plant pages
export function generateStaticParams() {
  return vegetableIndex.map(v => ({ id: v.id }))
}

export function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  return params.then(({ id }) => {
    const plant = getVegetableById(id)
    if (!plant) return { title: 'Plant Not Found' }
    return {
      title: `${plant.name} - Bonnie Wee Plot`,
      description: plant.description,
    }
  })
}

function categoryLabel(categoryId: string): string {
  return CATEGORY_INFO.find(c => c.id === categoryId)?.name ?? categoryId
}

function formatSun(sun: string): string {
  return sun.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function formatWater(water: string): string {
  return water.charAt(0).toUpperCase() + water.slice(1)
}

function formatDifficulty(d: string): string {
  return d.charAt(0).toUpperCase() + d.slice(1)
}

function difficultyColor(d: string): string {
  if (d === 'beginner') return 'zen-badge-moss'
  if (d === 'intermediate') return 'zen-badge-kitsune'
  return 'zen-badge-sakura'
}

// Month bar component for visualizing planting calendar
function MonthBar({
  label,
  months,
  color,
}: {
  label: string
  months: Month[]
  color: string
}) {
  if (months.length === 0) return null
  const allMonths: Month[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-zen-ink-600 w-20 sm:w-28 shrink-0">{label}</span>
      <div className="flex gap-0.5 flex-1">
        {allMonths.map(m => (
          <div
            key={m}
            className={`h-6 flex-1 rounded-sm text-[10px] flex items-center justify-center ${
              months.includes(m) ? color : 'bg-zen-stone-100 text-zen-stone-400'
            }`}
            title={MONTH_NAMES_SHORT[m]}
          >
            {MONTH_NAMES_SHORT[m][0]}
          </div>
        ))}
      </div>
    </div>
  )
}

function CompanionList({
  title,
  companions,
  variant,
}: {
  title: string
  companions: EnhancedCompanion[]
  variant: 'good' | 'avoid'
}) {
  if (companions.length === 0) return null
  const plantNames = new Map(vegetableIndex.map(v => [v.id, v.name]))

  return (
    <div>
      <h3 className="text-zen-ink-700 mb-3">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {companions.map(c => {
          const name = plantNames.get(c.plantId) ?? c.plantId
          return (
            <Link
              key={c.plantId}
              href={`/plants/${c.plantId}`}
              className={`px-3 py-1.5 rounded-full text-sm transition ${
                variant === 'good'
                  ? 'bg-zen-moss-50 text-zen-moss-700 hover:bg-zen-moss-100'
                  : 'bg-zen-sakura-50 text-zen-sakura-700 hover:bg-zen-sakura-100'
              }`}
            >
              {name}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function CareTipsList({ tips }: { tips: CareTip[] }) {
  if (tips.length === 0) return null

  // Group by category
  const grouped = tips.reduce((acc, tip) => {
    const cat = tip.category
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(tip)
    return acc
  }, {} as Record<string, CareTip[]>)

  const categoryLabels: Record<string, string> = {
    care: 'Care',
    harvest: 'Harvest',
    propagate: 'Propagation',
    protect: 'Protection',
    plant: 'Planting',
  }

  return (
    <div>
      <h3 className="text-zen-ink-700 mb-3">Seasonal Care Tips</h3>
      <div className="space-y-4">
        {Object.entries(grouped).map(([cat, catTips]) => (
          <div key={cat}>
            <h4 className="text-sm font-medium text-zen-ink-600 mb-2">
              {categoryLabels[cat] ?? cat}
            </h4>
            <div className="space-y-2">
              {catTips.map((tip) => (
                <div key={tip.tip} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
                  <span className="text-zen-stone-500">
                    {tip.months.map(m => MONTH_NAMES_SHORT[m as Month]).join(', ')}
                  </span>
                  <span className="text-zen-ink-700">{tip.tip}</span>
                  {tip.stage && (
                    <span className="zen-badge text-xs shrink-0">{tip.stage}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MaintenanceSchedule({ plant }: { plant: Vegetable }) {
  if (!plant.maintenance) return null
  const { pruneMonths, feedMonths, mulchMonths, notes } = plant.maintenance

  return (
    <div>
      <h3 className="text-zen-ink-700 mb-3">Maintenance Schedule</h3>
      <div className="space-y-2">
        {pruneMonths && pruneMonths.length > 0 && (
          <MonthBar label="Prune" months={pruneMonths as Month[]} color="bg-zen-kitsune-200 text-zen-kitsune-800" />
        )}
        {feedMonths && feedMonths.length > 0 && (
          <MonthBar label="Feed" months={feedMonths as Month[]} color="bg-zen-bamboo-200 text-zen-bamboo-800" />
        )}
        {mulchMonths && mulchMonths.length > 0 && (
          <MonthBar label="Mulch" months={mulchMonths as Month[]} color="bg-zen-stone-300 text-zen-stone-700" />
        )}
      </div>
      {notes && notes.length > 0 && (
        <div className="mt-3 space-y-1">
          {notes.map((note, i) => (
            <p key={i} className="text-sm text-zen-stone-600">{note}</p>
          ))}
        </div>
      )}
    </div>
  )
}

export default async function PlantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const plant = getVegetableById(id)

  if (!plant) notFound()

  return (
    <div className="min-h-screen bg-zen-stone-50 zen-texture">
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-zen-stone-500">
          <Link href="/plants" className="text-zen-moss-600 hover:text-zen-moss-700 transition">
            Plants
          </Link>
          <span className="mx-2">/</span>
          <span className="text-zen-ink-700">{plant.name}</span>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <div className="flex items-baseline gap-3 mb-2">
            <h1>{plant.name}</h1>
            <span className={difficultyColor(plant.care.difficulty)}>
              {formatDifficulty(plant.care.difficulty)}
            </span>
          </div>
          {plant.botanicalName && (
            <p className="text-zen-stone-500 italic mb-2">{plant.botanicalName}</p>
          )}
          <p className="text-zen-ink-600 text-lg">{plant.description}</p>
          <div className="mt-3">
            <Link
              href={`/plants?category=${plant.category}`}
              className="zen-badge-moss"
            >
              {categoryLabel(plant.category)}
            </Link>
          </div>
        </header>

        {/* Planting Calendar */}
        <section className="zen-card p-6 mb-6">
          <h2 className="mb-4">Planting Calendar</h2>
          <div className="space-y-2">
            <MonthBar
              label="Sow Indoors"
              months={plant.planting.sowIndoorsMonths}
              color="bg-zen-water-200 text-zen-water-800"
            />
            <MonthBar
              label="Sow Outdoors"
              months={plant.planting.sowOutdoorsMonths}
              color="bg-zen-moss-200 text-zen-moss-800"
            />
            <MonthBar
              label="Transplant"
              months={plant.planting.transplantMonths}
              color="bg-zen-bamboo-200 text-zen-bamboo-800"
            />
            <MonthBar
              label="Harvest"
              months={plant.planting.harvestMonths}
              color="bg-zen-kitsune-200 text-zen-kitsune-800"
            />
          </div>
          <p className="text-sm text-zen-stone-500 mt-4">
            {plant.planting.daysToHarvest.min}–{plant.planting.daysToHarvest.max} days to harvest
          </p>
        </section>

        {/* Care Requirements */}
        <section className="zen-card p-6 mb-6">
          <h2 className="mb-4">Care Requirements</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div>
              <div className="text-xs text-zen-stone-500 mb-1">Sun</div>
              <div className="text-sm text-zen-ink-700">{formatSun(plant.care.sun)}</div>
            </div>
            <div>
              <div className="text-xs text-zen-stone-500 mb-1">Water</div>
              <div className="text-sm text-zen-ink-700">{formatWater(plant.care.water)}</div>
            </div>
            <div>
              <div className="text-xs text-zen-stone-500 mb-1">Spacing</div>
              <div className="text-sm text-zen-ink-700">{plant.care.spacing.between}cm apart, {plant.care.spacing.rows}cm rows</div>
            </div>
            <div>
              <div className="text-xs text-zen-stone-500 mb-1">Depth</div>
              <div className="text-sm text-zen-ink-700">{plant.care.depth}cm</div>
            </div>
          </div>
          {plant.care.tips.length > 0 && (
            <div className="border-t border-zen-stone-100 pt-4">
              <h4 className="text-sm text-zen-ink-600 mb-2">Tips</h4>
              <ul className="space-y-1">
                {plant.care.tips.map((tip, i) => (
                  <li key={i} className="text-sm text-zen-ink-700 pl-4 relative before:content-['·'] before:absolute before:left-0 before:text-zen-stone-400">
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {plant.growingRequirement && plant.growingRequirement !== 'outdoor' && (
            <div className="mt-4 px-3 py-2 bg-zen-water-50 rounded-zen text-sm text-zen-water-700">
              Requires {plant.growingRequirement} growing
            </div>
          )}
        </section>

        {/* Perennial Info */}
        {plant.perennialInfo && (
          <section className="zen-card p-6 mb-6">
            <h2 className="mb-4">Perennial Lifecycle</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-zen-stone-500 mb-1">First Harvest</div>
                <div className="text-sm text-zen-ink-700">
                  Year {plant.perennialInfo.yearsToFirstHarvest.min}
                  {plant.perennialInfo.yearsToFirstHarvest.max !== plant.perennialInfo.yearsToFirstHarvest.min &&
                    `–${plant.perennialInfo.yearsToFirstHarvest.max}`}
                </div>
              </div>
              {plant.perennialInfo.productiveYears && (
                <div>
                  <div className="text-xs text-zen-stone-500 mb-1">Productive Years</div>
                  <div className="text-sm text-zen-ink-700">
                    {plant.perennialInfo.productiveYears.min}–{plant.perennialInfo.productiveYears.max} years
                  </div>
                </div>
              )}
              {plant.perennialInfo.isEvergreen !== undefined && (
                <div>
                  <div className="text-xs text-zen-stone-500 mb-1">Foliage</div>
                  <div className="text-sm text-zen-ink-700">
                    {plant.perennialInfo.isEvergreen ? 'Evergreen' : 'Deciduous'}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Maintenance Schedule */}
        {plant.maintenance && (
          <section className="zen-card p-6 mb-6">
            <MaintenanceSchedule plant={plant} />
          </section>
        )}

        {/* Care Tips */}
        {plant.careTips && plant.careTips.length > 0 && (
          <section className="zen-card p-6 mb-6">
            <CareTipsList tips={plant.careTips} />
          </section>
        )}

        {/* Companion Planting */}
        {(plant.enhancedCompanions.length > 0 || plant.enhancedAvoid.length > 0) && (
          <section className="zen-card p-6 mb-6">
            <h2 className="mb-4">Companion Planting</h2>
            <div className="space-y-6">
              <CompanionList
                title="Good Companions"
                companions={plant.enhancedCompanions}
                variant="good"
              />
              <CompanionList
                title="Avoid Planting Near"
                companions={plant.enhancedAvoid}
                variant="avoid"
              />
            </div>
          </section>
        )}

        {/* External Links */}
        {(plant.rhsUrl || plant.wikipediaUrl) && (
          <section className="zen-card p-6">
            <h2 className="mb-4">Learn More</h2>
            <div className="flex flex-wrap gap-3">
              {plant.rhsUrl && (
                <a
                  href={plant.rhsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="zen-btn-secondary gap-2"
                >
                  RHS Growing Guide
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
              {plant.wikipediaUrl && (
                <a
                  href={plant.wikipediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="zen-btn-secondary gap-2"
                >
                  Wikipedia
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
