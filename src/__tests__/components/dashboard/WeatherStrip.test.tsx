import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import WeatherStrip from '@/components/dashboard/WeatherStrip'
import type { ForecastDay } from '@/lib/weather/open-meteo'

function makeDay(overrides: Partial<ForecastDay> = {}): ForecastDay {
  return {
    date: '2026-05-08',
    weatherCode: 1,
    tempMaxC: 12,
    tempMinC: 5,
    precipitationMm: 0,
    ...overrides,
  }
}

describe('WeatherStrip frost indicator', () => {
  it('renders nothing when forecast is empty', () => {
    const { container } = render(<WeatherStrip forecast={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('shows a snowflake when tempMinC is at or below 0', () => {
    const forecast = [makeDay({ tempMinC: -1 })]
    render(<WeatherStrip forecast={forecast} />)
    expect(screen.getByLabelText('Frost expected')).toBeInTheDocument()
  })

  it('shows a frost-risk dot when tempMinC is between 0 and 3', () => {
    const forecast = [makeDay({ tempMinC: 2 })]
    render(<WeatherStrip forecast={forecast} />)
    expect(screen.getByLabelText('Frost risk')).toBeInTheDocument()
  })

  it('shows neither indicator when tempMinC is above 3', () => {
    const forecast = [makeDay({ tempMinC: 5 })]
    render(<WeatherStrip forecast={forecast} />)
    expect(screen.queryByLabelText('Frost expected')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Frost risk')).not.toBeInTheDocument()
  })
})
