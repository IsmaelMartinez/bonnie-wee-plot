/**
 * Unit tests for ShareDialog component
 *
 * Tests share flow, loading states, error handling, copy functionality,
 * countdown timer, and dialog behavior.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ShareDialog } from '@/components/share/ShareDialog'
import { AllotmentData, CURRENT_SCHEMA_VERSION } from '@/types/unified-allotment'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock clipboard API
const mockWriteText = vi.fn().mockResolvedValue(undefined)
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: mockWriteText,
  },
  writable: true,
})

// Mock QRCodeSVG component
vi.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value }: { value: string }) => (
    <svg data-testid="qr-code" data-value={value}>QR Code</svg>
  ),
}))

// Mock window.location.origin
Object.defineProperty(window, 'location', {
  value: {
    origin: 'https://example.com',
  },
  writable: true,
})

// Test data
const mockAllotmentData: AllotmentData = {
  version: CURRENT_SCHEMA_VERSION,
  meta: {
    name: 'Test Allotment',
    location: 'Test Location',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  layout: { areas: [] },
  seasons: [],
  currentYear: 2024,
  maintenanceTasks: [],
  varieties: [],
}

// Helper to open dialog and click create share link button
async function openDialogAndShare() {
  await userEvent.click(screen.getByRole('button', { name: /share my allotment/i }))
  await waitFor(() => {
    expect(screen.getByRole('button', { name: /create share link/i })).toBeInTheDocument()
  })
  await userEvent.click(screen.getByRole('button', { name: /create share link/i }))
}

describe('ShareDialog Component', () => {
  const mockFlushSave = vi.fn().mockResolvedValue(true)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Dialog trigger button', () => {
    it('renders share button', () => {
      render(<ShareDialog data={mockAllotmentData} />)

      expect(screen.getByRole('button', { name: /share my allotment/i })).toBeInTheDocument()
    })

    it('disables share button when no data is provided', () => {
      render(<ShareDialog data={null} />)

      const button = screen.getByRole('button', { name: /share my allotment/i })
      expect(button).toBeDisabled()
    })

    it('enables share button when data is provided', () => {
      render(<ShareDialog data={mockAllotmentData} />)

      const button = screen.getByRole('button', { name: /share my allotment/i })
      expect(button).not.toBeDisabled()
    })
  })

  describe('Dialog opening and expiration selection', () => {
    it('opens dialog when share button is clicked', async () => {
      render(<ShareDialog data={mockAllotmentData} />)

      await userEvent.click(screen.getByRole('button', { name: /share my allotment/i }))

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        // Check for the dialog title specifically (in h2 element)
        expect(screen.getByRole('heading', { name: /share your allotment/i })).toBeInTheDocument()
      })
    })

    it('shows expiration selection options when dialog opens', async () => {
      render(<ShareDialog data={mockAllotmentData} />)

      await userEvent.click(screen.getByRole('button', { name: /share my allotment/i }))

      await waitFor(() => {
        expect(screen.getByLabelText(/how long should the share link be valid/i)).toBeInTheDocument()
        expect(screen.getByRole('option', { name: '5 minutes' })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: '1 hour' })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: '1 day' })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: '7 days' })).toBeInTheDocument()
      })
    })

    it('starts sharing when create share link button is clicked', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          code: 'ABC123',
          expiresAt: new Date(Date.now() + 300000).toISOString(),
          expiresInSeconds: 300,
        }),
      })

      render(<ShareDialog data={mockAllotmentData} flushSave={mockFlushSave} />)

      await openDialogAndShare()

      await waitFor(() => {
        expect(mockFlushSave).toHaveBeenCalled()
        expect(mockFetch).toHaveBeenCalledWith('/api/share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ allotment: mockAllotmentData, expirationMinutes: 1440 }),
        })
      })
    })

    it('sends selected expiration duration to API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          code: 'ABC123',
          expiresAt: new Date(Date.now() + 300000).toISOString(),
          expiresInSeconds: 300,
        }),
      })

      render(<ShareDialog data={mockAllotmentData} />)

      await userEvent.click(screen.getByRole('button', { name: /share my allotment/i }))

      await waitFor(() => {
        expect(screen.getByLabelText(/how long should the share link be valid/i)).toBeInTheDocument()
      })

      // Select 5 minutes option
      await userEvent.selectOptions(screen.getByLabelText(/how long should the share link be valid/i), '5')

      await userEvent.click(screen.getByRole('button', { name: /create share link/i }))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ allotment: mockAllotmentData, expirationMinutes: 5 }),
        })
      })
    })
  })

  describe('Loading state', () => {
    it('shows loading spinner while sharing', async () => {
      // Keep the fetch pending
      mockFetch.mockImplementationOnce(() => new Promise(() => {}))

      render(<ShareDialog data={mockAllotmentData} />)

      await openDialogAndShare()

      await waitFor(() => {
        expect(screen.getByText(/creating share link/i)).toBeInTheDocument()
      })
    })
  })

  describe('Success state', () => {
    it('shows QR code and share code on success', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          code: 'ABC123',
          expiresAt: new Date(Date.now() + 300000).toISOString(),
          expiresInSeconds: 300,
        }),
      })

      render(<ShareDialog data={mockAllotmentData} />)

      await openDialogAndShare()

      await waitFor(() => {
        // QR code should be visible
        expect(screen.getByTestId('qr-code')).toBeInTheDocument()

        // Share code should be displayed (split into two parts: ABC 123)
        expect(screen.getByText('ABC 123')).toBeInTheDocument()
      })
    })

    it('shows share URL in input field', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          code: 'XYZ789',
          expiresAt: new Date(Date.now() + 300000).toISOString(),
          expiresInSeconds: 300,
        }),
      })

      render(<ShareDialog data={mockAllotmentData} />)

      await openDialogAndShare()

      await waitFor(() => {
        const urlInput = screen.getByRole('textbox')
        expect(urlInput).toHaveValue('https://example.com/receive/XYZ789')
      })
    })

    it('shows QR code with correct URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          code: 'TEST01',
          expiresAt: new Date(Date.now() + 300000).toISOString(),
          expiresInSeconds: 300,
        }),
      })

      render(<ShareDialog data={mockAllotmentData} />)

      await openDialogAndShare()

      await waitFor(() => {
        const qrCode = screen.getByTestId('qr-code')
        expect(qrCode).toHaveAttribute('data-value', 'https://example.com/receive/TEST01')
      })
    })
  })

  describe('Error state', () => {
    it('shows error message when share fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Server error' }),
      })

      render(<ShareDialog data={mockAllotmentData} />)

      await openDialogAndShare()

      await waitFor(() => {
        expect(screen.getByText(/unable to share/i)).toBeInTheDocument()
        expect(screen.getByText(/server error/i)).toBeInTheDocument()
      })
    })

    it('shows retry button on error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Network error' }),
      })

      render(<ShareDialog data={mockAllotmentData} />)

      await openDialogAndShare()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
      })
    })

    it('retries sharing when retry button is clicked', async () => {
      // First call fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Network error' }),
      })

      render(<ShareDialog data={mockAllotmentData} />)

      await openDialogAndShare()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
      })

      // Second call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          code: 'RETRY1',
          expiresAt: new Date(Date.now() + 300000).toISOString(),
          expiresInSeconds: 300,
        }),
      })

      await userEvent.click(screen.getByRole('button', { name: /try again/i }))

      await waitFor(() => {
        expect(screen.getByTestId('qr-code')).toBeInTheDocument()
        expect(screen.getByText('RET RY1')).toBeInTheDocument()
      })
    })

    it('handles network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network failed'))

      render(<ShareDialog data={mockAllotmentData} />)

      await openDialogAndShare()

      await waitFor(() => {
        expect(screen.getByText(/unable to share/i)).toBeInTheDocument()
        expect(screen.getByText(/network failed/i)).toBeInTheDocument()
      })
    })
  })

  describe('Copy functionality', () => {
    it('copies share URL to clipboard when copy button is clicked', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          code: 'COPY01',
          expiresAt: new Date(Date.now() + 300000).toISOString(),
          expiresInSeconds: 300,
        }),
      })

      render(<ShareDialog data={mockAllotmentData} />)

      await openDialogAndShare()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument()
      })

      await userEvent.click(screen.getByRole('button', { name: /copy link/i }))

      expect(mockWriteText).toHaveBeenCalledWith('https://example.com/receive/COPY01')
    })

    it('shows copied confirmation message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          code: 'COPY02',
          expiresAt: new Date(Date.now() + 300000).toISOString(),
          expiresInSeconds: 300,
        }),
      })

      render(<ShareDialog data={mockAllotmentData} />)

      await openDialogAndShare()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument()
      })

      await userEvent.click(screen.getByRole('button', { name: /copy link/i }))

      await waitFor(() => {
        expect(screen.getByText(/copied to clipboard/i)).toBeInTheDocument()
      })
    })

    it('hides copied confirmation after timeout', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          code: 'COPY03',
          expiresAt: new Date(Date.now() + 300000).toISOString(),
          expiresInSeconds: 300,
        }),
      })

      render(<ShareDialog data={mockAllotmentData} />)

      await openDialogAndShare()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument()
      })

      await userEvent.click(screen.getByRole('button', { name: /copy link/i }))

      await waitFor(() => {
        expect(screen.getByText(/copied to clipboard/i)).toBeInTheDocument()
      })

      // Advance time past the 2 second timeout
      await act(async () => {
        vi.advanceTimersByTime(2500)
      })

      await waitFor(() => {
        expect(screen.queryByText(/copied to clipboard/i)).not.toBeInTheDocument()
      })

      vi.useRealTimers()
    })
  })

  describe('Countdown timer', () => {
    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('shows countdown timer after successful share', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          code: 'TIME01',
          expiresAt: new Date(Date.now() + 300000).toISOString(),
          expiresInSeconds: 300, // 5 minutes
        }),
      })

      render(<ShareDialog data={mockAllotmentData} />)

      await openDialogAndShare()

      await waitFor(() => {
        expect(screen.getByText(/expires in/i)).toBeInTheDocument()
        expect(screen.getByText('5:00')).toBeInTheDocument()
      })
    })

    it('counts down every second', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          code: 'TIME02',
          expiresAt: new Date(Date.now() + 60000).toISOString(),
          expiresInSeconds: 60, // 1 minute
        }),
      })

      render(<ShareDialog data={mockAllotmentData} />)

      await openDialogAndShare()

      await waitFor(() => {
        expect(screen.getByText('1:00')).toBeInTheDocument()
      })

      // Advance time by 1 second
      await act(async () => {
        vi.advanceTimersByTime(1000)
      })

      await waitFor(() => {
        expect(screen.getByText('0:59')).toBeInTheDocument()
      })

      // Advance time by 10 more seconds
      await act(async () => {
        vi.advanceTimersByTime(10000)
      })

      await waitFor(() => {
        expect(screen.getByText('0:49')).toBeInTheDocument()
      })
    })

    it('shows expired error when timer reaches zero', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          code: 'TIME03',
          expiresAt: new Date(Date.now() + 2000).toISOString(),
          expiresInSeconds: 2, // 2 seconds
        }),
      })

      render(<ShareDialog data={mockAllotmentData} />)

      await openDialogAndShare()

      await waitFor(() => {
        expect(screen.getByText('0:02')).toBeInTheDocument()
      })

      // Advance time past expiration
      await act(async () => {
        vi.advanceTimersByTime(3000)
      })

      await waitFor(() => {
        expect(screen.getByText(/share code has expired/i)).toBeInTheDocument()
      })
    })

    it('formats time correctly for minutes and seconds', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          code: 'TIME04',
          expiresAt: new Date(Date.now() + 125000).toISOString(),
          expiresInSeconds: 125, // 2 minutes 5 seconds
        }),
      })

      render(<ShareDialog data={mockAllotmentData} />)

      await openDialogAndShare()

      await waitFor(() => {
        expect(screen.getByText('2:05')).toBeInTheDocument()
      })
    })
  })

  describe('Dialog close behavior', () => {
    it('resets state when dialog is closed', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          code: 'CLOSE1',
          expiresAt: new Date(Date.now() + 300000).toISOString(),
          expiresInSeconds: 300,
        }),
      })

      render(<ShareDialog data={mockAllotmentData} />)

      // Open dialog and share
      await openDialogAndShare()

      await waitFor(() => {
        expect(screen.getByTestId('qr-code')).toBeInTheDocument()
      })

      // Close dialog
      await userEvent.click(screen.getByRole('button', { name: /close dialog/i }))

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })

      // Re-open dialog - should show selection screen again
      await userEvent.click(screen.getByRole('button', { name: /share my allotment/i }))

      await waitFor(() => {
        // Should show expiration selection again
        expect(screen.getByRole('button', { name: /create share link/i })).toBeInTheDocument()
      })

      // Share again
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          code: 'CLOSE2',
          expiresAt: new Date(Date.now() + 300000).toISOString(),
          expiresInSeconds: 300,
        }),
      })

      await userEvent.click(screen.getByRole('button', { name: /create share link/i }))

      await waitFor(() => {
        // Should have made a second API call
        expect(mockFetch).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('Instructions', () => {
    it('shows instructions for receiving device', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          code: 'INST01',
          expiresAt: new Date(Date.now() + 300000).toISOString(),
          expiresInSeconds: 300,
        }),
      })

      render(<ShareDialog data={mockAllotmentData} />)

      await openDialogAndShare()

      await waitFor(() => {
        expect(screen.getByText(/on the receiving device/i)).toBeInTheDocument()
        expect(screen.getByText(/example.com\/receive/i)).toBeInTheDocument()
      })
    })

    it('shows code entry option', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          code: 'INST02',
          expiresAt: new Date(Date.now() + 300000).toISOString(),
          expiresInSeconds: 300,
        }),
      })

      render(<ShareDialog data={mockAllotmentData} />)

      await openDialogAndShare()

      await waitFor(() => {
        expect(screen.getByText(/or enter this code/i)).toBeInTheDocument()
      })
    })
  })
})
