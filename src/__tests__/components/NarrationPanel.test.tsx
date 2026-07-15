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
import { narrateSeason, type NarrationResult } from '@/lib/season-review/narration'

vi.mock('@/lib/season-review/narration', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/season-review/narration')>()),
  narrateSeason: vi.fn(),
}))

const narrateSeasonMock = vi.mocked(narrateSeason)

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
})
