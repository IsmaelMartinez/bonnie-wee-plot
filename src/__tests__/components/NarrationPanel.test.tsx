/**
 * NarrationPanel — the ephemerality guarantee. The panel must never show
 * prose about inputs that have since changed: an in-flight request whose year
 * or findings were swapped out from under it is orphaned, not rendered.
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import NarrationPanel from '@/components/season-review/NarrationPanel'
import type { Finding } from '@/lib/season-review/findings'
import {
  HostedNarrationError,
  narrateSeason,
  narrateSeasonHosted,
  type NarrationResult,
} from '@/lib/season-review/narration'
import { useOptionalAuth } from '@/hooks/useOptionalAuth'

vi.mock('@/lib/season-review/narration', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/season-review/narration')>()),
  narrateSeason: vi.fn(),
  narrateSeasonHosted: vi.fn(),
}))

vi.mock('@/hooks/useOptionalAuth', () => ({
  useOptionalAuth: vi.fn(),
}))

const narrateSeasonMock = vi.mocked(narrateSeason)
const narrateSeasonHostedMock = vi.mocked(narrateSeasonHosted)
const useOptionalAuthMock = vi.mocked(useOptionalAuth)

function authState(isSignedIn: boolean) {
  return {
    isSignedIn,
    userId: isSignedIn ? 'user_1' : null,
    getToken: async () => null,
    signOut: async () => {},
    userEmail: undefined,
  }
}

const FINDINGS: Finding[] = [
  {
    id: 'rule:2024:x',
    ruleId: 'rule',
    severity: 'notice',
    summary: 'June was warm.',
    metrics: {},
    entities: [],
  },
]

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

describe('NarrationPanel', () => {
  beforeEach(() => {
    narrateSeasonMock.mockReset()
    narrateSeasonHostedMock.mockReset()
    useOptionalAuthMock.mockReturnValue(authState(false))
    localStorage.clear()
    sessionStorage.clear()
  })

  it('shows verified narration after Generate', async () => {
    narrateSeasonMock.mockResolvedValue({ status: 'ok', text: 'A warm June.' })
    render(<NarrationPanel findings={FINDINGS} year={2024} />)

    await userEvent.click(screen.getByRole('button', { name: /generate narration/i }))

    expect(await screen.findByText('A warm June.')).toBeInTheDocument()
    expect(screen.getByText(/every number above appears in the findings/i)).toBeInTheDocument()
  })

  it('shows the fallback note when the draft is rejected', async () => {
    narrateSeasonMock.mockResolvedValue({
      status: 'rejected',
      text: 'It hit 99°C.',
      unverifiedNumbers: ['99'],
    })
    render(<NarrationPanel findings={FINDINGS} year={2024} />)

    await userEvent.click(screen.getByRole('button', { name: /generate narration/i }))

    expect(await screen.findByText(/numbers that aren't in the findings/i)).toBeInTheDocument()
    expect(screen.getByText(/\(99\)/)).toBeInTheDocument()
    expect(screen.queryByText('It hit 99°C.')).not.toBeInTheDocument()
  })

  it('discards an in-flight result when the year changes mid-request', async () => {
    const pending = deferred<NarrationResult>()
    narrateSeasonMock.mockReturnValue(pending.promise)
    const { rerender } = render(<NarrationPanel findings={FINDINGS} year={2024} />)

    await userEvent.click(screen.getByRole('button', { name: /generate narration/i }))
    expect(screen.getByRole('button', { name: /writing/i })).toBeInTheDocument()

    // The user flips to another season while the model is still writing.
    rerender(<NarrationPanel findings={FINDINGS} year={2023} />)

    pending.resolve({ status: 'ok', text: 'Stale prose about 2024.' })
    // The orphaned resolution must not repopulate the panel.
    await waitFor(() => {
      expect(narrateSeasonMock).toHaveBeenCalledTimes(1)
    })
    expect(screen.queryByText('Stale prose about 2024.')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /generate narration/i })).toBeInTheDocument()
  })

  describe('provider selection', () => {
    it('never offers the built-in provider when signed out', () => {
      render(<NarrationPanel findings={FINDINGS} year={2024} />)

      expect(screen.queryByRole('radio', { name: /built-in/i })).not.toBeInTheDocument()
      // The direct-endpoint fields are the only path.
      expect(screen.getByLabelText(/openai-compatible/i)).toBeInTheDocument()
    })

    it('defaults signed-in users to the built-in provider and hides the endpoint fields', async () => {
      useOptionalAuthMock.mockReturnValue(authState(true))
      narrateSeasonHostedMock.mockResolvedValue({ status: 'ok', text: 'A grand year.' })
      render(<NarrationPanel findings={FINDINGS} year={2024} allotmentName="Plot" />)

      expect(screen.getByRole('radio', { name: /built-in/i })).toBeChecked()
      expect(screen.queryByLabelText(/openai-compatible/i)).not.toBeInTheDocument()

      await userEvent.click(screen.getByRole('button', { name: /generate narration/i }))

      expect(await screen.findByText('A grand year.')).toBeInTheDocument()
      expect(screen.getByText(/every number above appears in the findings/i)).toBeInTheDocument()
      expect(narrateSeasonHostedMock).toHaveBeenCalledTimes(1)
      expect(narrateSeasonHostedMock.mock.calls[0][0]).toBe(FINDINGS)
      expect(narrateSeasonHostedMock.mock.calls[0][1]).toEqual({ year: 2024, allotmentName: 'Plot' })
      expect(narrateSeasonMock).not.toHaveBeenCalled()
    })

    it('runs the hosted draft through the same verify gate — rejected drafts are discarded', async () => {
      useOptionalAuthMock.mockReturnValue(authState(true))
      narrateSeasonHostedMock.mockResolvedValue({
        status: 'rejected',
        text: 'It hit 99°C.',
        unverifiedNumbers: ['99'],
      })
      render(<NarrationPanel findings={FINDINGS} year={2024} />)

      await userEvent.click(screen.getByRole('button', { name: /generate narration/i }))

      expect(await screen.findByText(/numbers that aren't in the findings/i)).toBeInTheDocument()
      expect(screen.queryByText('It hit 99°C.')).not.toBeInTheDocument()
    })

    it('shows the friendly two-options message when the free quota is exhausted', async () => {
      useOptionalAuthMock.mockReturnValue(authState(true))
      narrateSeasonHostedMock.mockRejectedValue(
        new HostedNarrationError(
          "You've used your 30 free AI requests for this month.",
          429,
          true
        )
      )
      render(<NarrationPanel findings={FINDINGS} year={2024} />)

      await userEvent.click(screen.getByRole('button', { name: /generate narration/i }))

      expect(await screen.findByText(/free quota used up/i)).toBeInTheDocument()
      expect(screen.getByText(/30 free AI requests/i)).toBeInTheDocument()
      expect(screen.getByText(/your own endpoint/i, { selector: 'strong' })).toBeInTheDocument()
      expect(screen.getByText(/free quota resets then/i)).toBeInTheDocument()
      // A quota stop is guidance, not a failure.
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('lets signed-in users switch to their own endpoint, which uses the direct client', async () => {
      useOptionalAuthMock.mockReturnValue(authState(true))
      narrateSeasonMock.mockResolvedValue({ status: 'ok', text: 'Prose from Ollama.' })
      render(<NarrationPanel findings={FINDINGS} year={2024} />)

      await userEvent.click(screen.getByRole('radio', { name: /your own endpoint/i }))
      expect(screen.getByLabelText(/openai-compatible/i)).toBeInTheDocument()

      await userEvent.click(screen.getByRole('button', { name: /generate narration/i }))

      expect(await screen.findByText('Prose from Ollama.')).toBeInTheDocument()
      expect(narrateSeasonMock).toHaveBeenCalledTimes(1)
      expect(narrateSeasonHostedMock).not.toHaveBeenCalled()
    })

    it('remembers the provider choice across mounts', async () => {
      useOptionalAuthMock.mockReturnValue(authState(true))
      const { unmount } = render(<NarrationPanel findings={FINDINGS} year={2024} />)
      await userEvent.click(screen.getByRole('radio', { name: /your own endpoint/i }))
      unmount()

      render(<NarrationPanel findings={FINDINGS} year={2024} />)
      expect(screen.getByRole('radio', { name: /your own endpoint/i })).toBeChecked()
    })

    it('discards an in-flight result when the provider is switched mid-request', async () => {
      useOptionalAuthMock.mockReturnValue(authState(true))
      const pending = deferred<NarrationResult>()
      narrateSeasonHostedMock.mockReturnValue(pending.promise)
      render(<NarrationPanel findings={FINDINGS} year={2024} />)

      await userEvent.click(screen.getByRole('button', { name: /generate narration/i }))
      expect(screen.getByRole('button', { name: /writing/i })).toBeInTheDocument()

      // The user switches provider while the model is still writing.
      await userEvent.click(screen.getByRole('radio', { name: /your own endpoint/i }))

      pending.resolve({ status: 'ok', text: 'Late prose from the previous provider.' })
      // The orphaned resolution must not repopulate the panel.
      await waitFor(() => {
        expect(narrateSeasonHostedMock).toHaveBeenCalledTimes(1)
      })
      expect(screen.queryByText('Late prose from the previous provider.')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: /generate narration/i })).toBeInTheDocument()
    })

    it('keeps an edited endpoint when switching provider — no silent revert across mounts', async () => {
      useOptionalAuthMock.mockReturnValue(authState(true))
      const { unmount } = render(<NarrationPanel findings={FINDINGS} year={2024} />)

      await userEvent.click(screen.getByRole('radio', { name: /your own endpoint/i }))
      const endpointInput = screen.getByLabelText(/openai-compatible/i)
      await userEvent.clear(endpointInput)
      await userEvent.type(endpointInput, 'http://my-llm.local:8080/v1')
      // Switching provider persists the config as the UI showed it.
      await userEvent.click(screen.getByRole('radio', { name: /built-in/i }))
      unmount()

      render(<NarrationPanel findings={FINDINGS} year={2024} />)
      await userEvent.click(screen.getByRole('radio', { name: /your own endpoint/i }))
      expect(screen.getByLabelText(/openai-compatible/i)).toHaveValue('http://my-llm.local:8080/v1')
    })

    it('does not stamp a provider choice the user never made when generating signed out', async () => {
      narrateSeasonMock.mockResolvedValue({ status: 'ok', text: 'Prose.' })
      render(<NarrationPanel findings={FINDINGS} year={2024} />)

      await userEvent.click(screen.getByRole('button', { name: /generate narration/i }))
      await screen.findByText('Prose.')

      const stored = JSON.parse(localStorage.getItem('bwp-narration-config') ?? '{}')
      expect(stored.provider).toBeUndefined()
    })
  })
})
