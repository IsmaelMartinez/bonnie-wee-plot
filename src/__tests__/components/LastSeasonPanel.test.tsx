/**
 * LastSeasonPanel — the silence and dismissal guarantees. The panel must
 * render nothing without a previous season or without actionable adjustments,
 * work log-only when weather is unavailable, and keep a dismissal for the
 * plan year in localStorage (never the CRDT).
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LastSeasonPanel from '@/components/allotment/LastSeasonPanel'
import type { Area, CareLogEntry, SeasonRecord } from '@/types/unified-allotment'

vi.mock('@/lib/weather/open-meteo-archive', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/weather/open-meteo-archive')>()),
  fetchSeasonWeather: vi.fn().mockResolvedValue(null),
}))
vi.mock('@/lib/weather/weather-baseline', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/weather/weather-baseline')>()),
  getBaseline: vi.fn().mockResolvedValue(null),
}))

const AREAS: Area[] = [
  {
    id: 'bed-b',
    kind: 'rotation-bed',
    name: 'Bed B',
    canHavePlantings: true,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
]

function pestLog(id: string, date: string): CareLogEntry {
  return { id, type: 'pest', date, severity: 2 }
}

/** A 2025 season whose pest logs trigger the log-only cluster rule. */
function seasonWithPestCluster(): SeasonRecord {
  return {
    year: 2025,
    status: 'historical',
    areas: [
      {
        areaId: 'bed-b',
        plantings: [],
        careLogs: [
          pestLog('l1', '2025-06-05'),
          pestLog('l2', '2025-06-12'),
          pestLog('l3', '2025-06-28'),
        ],
      },
    ],
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-12-01T00:00:00.000Z',
  }
}

function quietSeason(): SeasonRecord {
  return { ...seasonWithPestCluster(), areas: [{ areaId: 'bed-b', plantings: [] }] }
}

describe('LastSeasonPanel', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders actionable suggestions derived from the previous season', async () => {
    render(
      <LastSeasonPanel planYear={2026} areas={AREAS} seasonRecord={seasonWithPestCluster()} />
    )

    expect(await screen.findByText('Learning from 2025')).toBeInTheDocument()
    expect(screen.getByText(/3 pest observations were logged in Bed B/)).toBeInTheDocument()
    expect(screen.getByText(/protect Bed B from the start/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /full season review/i })).toHaveAttribute(
      'href',
      '/season-review'
    )
  })

  it('renders nothing without a previous season record', () => {
    const { container } = render(
      <LastSeasonPanel planYear={2026} areas={AREAS} seasonRecord={null} />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when the previous season yields no actionable adjustments', async () => {
    const { container } = render(
      <LastSeasonPanel planYear={2026} areas={AREAS} seasonRecord={quietSeason()} />
    )
    await waitFor(() => expect(container).toBeEmptyDOMElement())
  })

  it('dismissal hides the panel and persists per plan year in localStorage', async () => {
    const { unmount } = render(
      <LastSeasonPanel planYear={2026} areas={AREAS} seasonRecord={seasonWithPestCluster()} />
    )
    await userEvent.click(
      await screen.findByRole('button', { name: /dismiss last season's suggestions for 2026/i })
    )
    expect(screen.queryByText('Learning from 2025')).not.toBeInTheDocument()
    expect(localStorage.getItem('bwp-plan-feedback-dismissed:2026')).toBe('1')
    unmount()

    // A remount for the same plan year stays hidden…
    const { container } = render(
      <LastSeasonPanel planYear={2026} areas={AREAS} seasonRecord={seasonWithPestCluster()} />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('a dismissal for one plan year does not silence another', async () => {
    localStorage.setItem('bwp-plan-feedback-dismissed:2026', '1')
    const record2026 = { ...seasonWithPestCluster(), year: 2026 }
    record2026.areas[0].careLogs = record2026.areas[0].careLogs!.map((log, i) => ({
      ...log,
      date: log.date.replace('2025-', '2026-'),
      id: `l${i + 1}-2026`,
    }))
    render(<LastSeasonPanel planYear={2027} areas={AREAS} seasonRecord={record2026} />)
    expect(await screen.findByText('Learning from 2026')).toBeInTheDocument()
  })
})
