import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

const useTodayDataMock = vi.fn()
const useAllotmentMock = vi.fn()

vi.mock('@/hooks/useTodayData', () => ({ useTodayData: () => useTodayDataMock() }))
vi.mock('@/hooks/useAllotment', () => ({ useAllotment: () => useAllotmentMock() }))
vi.mock('@/hooks/useOptionalAuth', () => ({ useOptionalAuth: () => ({ isSignedIn: false }) }))
vi.mock('@/contexts/AitorChatContext', () => ({ useAitorChat: () => ({ openChat: vi.fn() }) }))

// Stub the children unrelated to the frost banner.
vi.mock('@/components/dashboard/SeasonCard', () => ({ default: () => null }))
vi.mock('@/components/dashboard/TaskList', () => ({ default: () => null }))
vi.mock('@/components/dashboard/QuickActions', () => ({ default: () => null }))
vi.mock('@/components/dashboard/CompostAlerts', () => ({ default: () => null }))
vi.mock('@/components/dashboard/LocationPromptBanner', () => ({ default: () => null }))
vi.mock('@/components/dashboard/WeatherStrip', () => ({ default: () => null }))
vi.mock('@/components/dashboard/AitorOptInBanner', () => ({ default: () => null }))
vi.mock('@/components/onboarding/OnboardingWizard', () => ({ default: () => null }))
vi.mock('@/components/onboarding/PageTour', () => ({ default: () => null }))
vi.mock('@/components/auth/SignInPrompt', () => ({ default: () => null }))

import TodayDashboard from '@/components/dashboard/TodayDashboard'

describe('TodayDashboard frost banner', () => {
  beforeEach(() => {
    localStorage.clear()
    useTodayDataMock.mockReturnValue({
      currentMonth: 5,
      generatedTasks: [],
      hasCoordinates: true,
      isLoading: false,
      showOnboarding: false,
      rainfall: { past3DaysMm: 0, todayMm: 0, forecast: [{ tempMinC: -2 }] },
    })
    useAllotmentMock.mockReturnValue({
      updateMeta: vi.fn(),
      data: {
        meta: {},
        currentYear: 2026,
        layout: { areas: [{ id: 'bed-a', name: 'Bed A' }] },
        seasons: [
          {
            year: 2026,
            areas: [
              {
                areaId: 'bed-a',
                plantings: [
                  { id: 'p1', plantId: 'courgette', status: 'active' },
                  { id: 'p2', plantId: 'garlic', status: 'active' },
                ],
              },
            ],
          },
        ],
      },
    })
  })

  it('lists tender plantings in the affected area when frost is forecast', () => {
    render(<TodayDashboard />)
    const banner = screen.getByRole('alert')
    expect(banner).toHaveTextContent('Bed A:')
    expect(banner).toHaveTextContent('Courgettes (Zucchini)')
    expect(banner).not.toHaveTextContent(/garlic/i)
  })
})
