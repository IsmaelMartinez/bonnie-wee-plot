/**
 * useLastSeasonAdjustments — the shared cache-first weather → findings →
 * adjustments hook behind LastSeasonPanel and the Add Planting nudges.
 * The contract under test: `settled` flips true once the outcome is known
 * (including "no previous season at all"), and the fetch effect keys on
 * values — not object identities — so unrelated data mutations that
 * regenerate the snapshot don't reset state or re-run the fetch.
 */
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useLastSeasonAdjustments } from '@/hooks/useLastSeasonAdjustments'
import { fetchSeasonWeather } from '@/lib/weather/open-meteo-archive'
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

const COORDINATES = { latitude: 55.95, longitude: -3.19 }

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

describe('useLastSeasonAdjustments', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('settles immediately, with no fetch, when there is no previous season', async () => {
    const { result } = renderHook(() =>
      useLastSeasonAdjustments({
        planYear: 2026,
        areas: AREAS,
        seasonRecord: null,
        coordinates: COORDINATES,
      })
    )

    await waitFor(() => expect(result.current.settled).toBe(true))
    expect(result.current.adjustments).toEqual([])
    expect(fetchSeasonWeather).not.toHaveBeenCalled()
  })

  it('derives adjustments from a log-only season and settles', async () => {
    const { result } = renderHook(() =>
      useLastSeasonAdjustments({
        planYear: 2026,
        areas: AREAS,
        seasonRecord: seasonWithPestCluster(),
        coordinates: COORDINATES,
      })
    )

    await waitFor(() => expect(result.current.settled).toBe(true))
    expect(result.current.adjustments).toHaveLength(1)
    expect(result.current.adjustments[0].ruleId).toBe('pest-disease-cluster')
    expect(fetchSeasonWeather).toHaveBeenCalledTimes(1)
  })

  it('does not refetch or unsettle when object identities change but values do not', async () => {
    const { result, rerender } = renderHook(
      (props: Parameters<typeof useLastSeasonAdjustments>[0]) =>
        useLastSeasonAdjustments(props),
      {
        initialProps: {
          planYear: 2026,
          areas: AREAS,
          seasonRecord: seasonWithPestCluster(),
          coordinates: COORDINATES,
        },
      }
    )
    await waitFor(() => expect(result.current.settled).toBe(true))

    // Fresh object identities, same values — the shape every snapshot
    // regeneration after an unrelated mutation produces.
    rerender({
      planYear: 2026,
      areas: [...AREAS],
      seasonRecord: seasonWithPestCluster(),
      coordinates: { ...COORDINATES },
    })

    expect(result.current.settled).toBe(true)
    expect(result.current.adjustments).toHaveLength(1)
    expect(fetchSeasonWeather).toHaveBeenCalledTimes(1)
  })

  it('settles back to empty when the season record goes away', async () => {
    const { result, rerender } = renderHook(
      (props: Parameters<typeof useLastSeasonAdjustments>[0]) =>
        useLastSeasonAdjustments(props),
      {
        initialProps: {
          planYear: 2026,
          areas: AREAS,
          seasonRecord: seasonWithPestCluster() as SeasonRecord | null,
          coordinates: COORDINATES,
        },
      }
    )
    await waitFor(() => expect(result.current.adjustments).toHaveLength(1))

    rerender({
      planYear: 2026,
      areas: AREAS,
      seasonRecord: null,
      coordinates: COORDINATES,
    })

    await waitFor(() => expect(result.current.settled).toBe(true))
    expect(result.current.adjustments).toEqual([])
  })
})
