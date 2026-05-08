import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FrostWarningBanner from '@/components/dashboard/FrostWarningBanner'

const todayIso = new Date().toISOString().slice(0, 10)

const baseProps = {
  forecastMinC: -1,
  affectedAreas: [{ areaId: 'a', areaName: 'Bed A', plantNames: ['Tomato'] }],
  todayIso,
}

describe('FrostWarningBanner', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders nothing when forecastMinC is above 0', () => {
    const { container } = render(
      <FrostWarningBanner {...baseProps} forecastMinC={2} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when there are no affected areas', () => {
    const { container } = render(
      <FrostWarningBanner {...baseProps} affectedAreas={[]} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('shows the warning copy and the affected bed name when frost is forecast', () => {
    render(<FrostWarningBanner {...baseProps} />)
    expect(screen.getByText(/Frost tonight/i)).toBeInTheDocument()
    expect(screen.getByText(/Bed A/)).toBeInTheDocument()
    expect(screen.getByText(/Tomato/)).toBeInTheDocument()
  })

  it('hides itself once the dismiss button has been clicked for today', () => {
    const { rerender } = render(<FrostWarningBanner {...baseProps} />)
    fireEvent.click(screen.getByLabelText('Dismiss'))
    rerender(<FrostWarningBanner {...baseProps} />)
    expect(screen.queryByText(/Frost tonight/i)).not.toBeInTheDocument()
  })
})
