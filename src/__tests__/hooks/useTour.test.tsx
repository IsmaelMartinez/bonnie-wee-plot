/**
 * Tests for useTour — settings tour tab handling.
 *
 * Focus: the element-existence filter can only inspect the active tab's
 * content at tour start (inactive tab panels are unmounted), so steps behind
 * a tab switch must be re-checked at navigation time and skipped gracefully
 * when their target never renders (e.g. the ai-quota section is hidden for
 * users with their own API key).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Mock } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { Config, DriveStep } from 'driver.js'

interface MockDriverInstance {
  drive: Mock<(index?: number) => void>
  moveNext: Mock<() => void>
  movePrevious: Mock<() => void>
  moveTo: Mock<(index: number) => void>
  getActiveIndex: Mock<() => number | undefined>
  destroy: Mock<() => void>
  refresh: Mock<() => void>
}

let lastConfig: Config | null = null
let lastInstance: MockDriverInstance | null = null
let driverCreateCount = 0

vi.mock('driver.js', () => ({
  driver: (config: Config) => {
    lastConfig = config
    driverCreateCount += 1
    let activeIndex: number | undefined
    const instance: MockDriverInstance = {
      drive: vi.fn((index = 0) => {
        activeIndex = index
      }),
      moveNext: vi.fn(() => {
        activeIndex = (activeIndex ?? 0) + 1
      }),
      movePrevious: vi.fn(() => {
        activeIndex = (activeIndex ?? 0) - 1
      }),
      moveTo: vi.fn((index: number) => {
        activeIndex = index
      }),
      getActiveIndex: vi.fn(() => activeIndex),
      destroy: vi.fn(),
      refresh: vi.fn(),
    }
    lastInstance = instance
    return instance
  },
}))

import { useTour } from '@/hooks/useTour'

/**
 * Build a DOM that mimics the Settings page Tabs component: tab buttons with
 * aria-selected, and a panel that only contains the active tab's content.
 * Clicking a tab button synchronously re-renders the panel, like the real
 * Tabs component does on the next React render.
 */
function setupSettingsDom(options: {
  tabs: string[]
  activeTab: string
  /** data-tour attribute values rendered inside each tab's panel */
  content: Record<string, string[]>
}) {
  const { tabs, activeTab, content } = options

  // The tabs bar itself is always present (intro step target).
  const tabsCard = document.createElement('div')
  tabsCard.setAttribute('data-tour', 'settings-tabs')
  document.body.appendChild(tabsCard)

  const panel = document.createElement('div')

  const renderPanel = (tabId: string) => {
    panel.innerHTML = ''
    for (const name of content[tabId] ?? []) {
      const el = document.createElement('div')
      el.setAttribute('data-tour', name)
      panel.appendChild(el)
    }
  }

  const activate = (tabId: string) => {
    for (const other of tabs) {
      document
        .getElementById(`tab-${other}`)!
        .setAttribute('aria-selected', other === tabId ? 'true' : 'false')
    }
    renderPanel(tabId)
  }

  for (const tabId of tabs) {
    const btn = document.createElement('button')
    btn.id = `tab-${tabId}`
    btn.setAttribute('aria-selected', tabId === activeTab ? 'true' : 'false')
    btn.addEventListener('click', () => activate(tabId))
    tabsCard.appendChild(btn)
  }
  tabsCard.appendChild(panel)
  renderPanel(activeTab)
}

const stepElements = (config: Config): string[] =>
  (config.steps ?? []).map((s: DriveStep) => s.element as string)

const activeTabId = (): string | undefined =>
  document
    .querySelector('[aria-selected="true"]')
    ?.id.replace(/^tab-/, '')

/** Start the settings tour and run past the 600ms initial delay. */
function startSettingsTour(result: { current: ReturnType<typeof useTour> }) {
  act(() => {
    result.current.startTour('settings')
  })
  act(() => {
    vi.advanceTimersByTime(600)
  })
}

/** Click "next" and run past the 100ms tab-switch render delay. */
function clickNext() {
  act(() => {
    lastConfig!.onNextClick!(undefined, {} as DriveStep, {
      config: lastConfig!,
      state: {},
      driver: lastInstance as never,
      index: lastInstance!.getActiveIndex(),
    })
    vi.advanceTimersByTime(100)
  })
}

function clickPrev() {
  act(() => {
    lastConfig!.onPrevClick!(undefined, {} as DriveStep, {
      config: lastConfig!,
      state: {},
      driver: lastInstance as never,
      index: lastInstance!.getActiveIndex(),
    })
    vi.advanceTimersByTime(100)
  })
}

describe('useTour - settings tour tab handling', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    document.body.innerHTML = ''
    localStorage.clear()
    lastConfig = null
    lastInstance = null
    driverCreateCount = 0
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('keeps the Data → Help fallback when signed out (no AI tab rendered)', () => {
    setupSettingsDom({
      tabs: ['data', 'help'],
      activeTab: 'data',
      content: {
        data: ['data-management'],
        help: ['tour-management'],
      },
    })

    const { result } = renderHook(() => useTour())
    startSettingsTour(result)

    expect(lastConfig).not.toBeNull()
    expect(stepElements(lastConfig!)).toEqual([
      '[data-tour="settings-tabs"]',
      '[data-tour="data-management"]',
      '[data-tour="tour-management"]',
    ])
    expect(lastInstance!.drive).toHaveBeenCalledWith(0)
  })

  it('filters a missing target on the already-active tab at tour start', () => {
    // Signed-in user with a BYO key: ai-quota is not rendered. Starting the
    // tour while AI & Location is active lets the filter see the gap.
    setupSettingsDom({
      tabs: ['ai-location', 'data', 'help'],
      activeTab: 'ai-location',
      content: {
        'ai-location': [
          'ai-settings',
          'ai-toggle',
          'ai-byok-disclosure',
          'location-settings',
        ],
        data: ['data-management'],
        help: ['tour-management'],
      },
    })

    const { result } = renderHook(() => useTour())
    startSettingsTour(result)

    expect(stepElements(lastConfig!)).not.toContain('[data-tour="ai-quota"]')
  })

  it('skips a step whose target is missing after its tab switch', () => {
    // Same BYO-key user, but the tour starts from the Data tab, so the AI
    // steps cannot be checked up front — ai-quota must be skipped at
    // navigation time instead of driver.js landing on a missing element.
    setupSettingsDom({
      tabs: ['ai-location', 'data', 'help'],
      activeTab: 'data',
      content: {
        'ai-location': [
          'ai-settings',
          'ai-toggle',
          'ai-byok-disclosure',
          'location-settings',
        ],
        data: ['data-management'],
        help: ['tour-management'],
      },
    })

    const { result } = renderHook(() => useTour())
    startSettingsTour(result)

    // All 8 steps survive the start-time filter: the 5 AI steps sit behind an
    // inactive tab, so their existence is unknown until the switch.
    expect(stepElements(lastConfig!)).toHaveLength(8)
    expect(stepElements(lastConfig!)[3]).toBe('[data-tour="ai-quota"]')

    // Step 0 (settings-tabs intro) → step 1 (ai-settings): switches tab.
    clickNext()
    expect(activeTabId()).toBe('ai-location')
    expect(lastInstance!.moveNext).toHaveBeenCalledTimes(1)

    // Step 1 → step 2 (ai-toggle): same tab.
    clickNext()
    expect(lastInstance!.moveNext).toHaveBeenCalledTimes(2)

    // Step 2 → step 3 would be ai-quota, which never rendered: the tour must
    // jump over it to step 4 (ai-byok-disclosure).
    clickNext()
    expect(lastInstance!.moveNext).toHaveBeenCalledTimes(2)
    expect(lastInstance!.moveTo).toHaveBeenCalledWith(4)
  })

  it('skips a missing step when navigating backwards too', () => {
    setupSettingsDom({
      tabs: ['ai-location', 'data', 'help'],
      activeTab: 'data',
      content: {
        'ai-location': [
          'ai-settings',
          'ai-toggle',
          'ai-byok-disclosure',
          'location-settings',
        ],
        data: ['data-management'],
        help: ['tour-management'],
      },
    })

    const { result } = renderHook(() => useTour())
    startSettingsTour(result)

    // Walk forward to step 4 (ai-byok-disclosure), skipping ai-quota.
    clickNext() // → 1
    clickNext() // → 2
    clickNext() // → 4 via moveTo
    expect(lastInstance!.getActiveIndex()).toBe(4)

    // Backwards from 4: step 3 (ai-quota) is missing → jump to step 2.
    clickPrev()
    expect(lastInstance!.movePrevious).not.toHaveBeenCalled()
    expect(lastInstance!.moveTo).toHaveBeenCalledWith(2)
  })

  it('does not create a driver instance when unmounted during the initial delay', () => {
    // Navigating away in the 600ms window between startTour and the deferred
    // driver.js creation must cancel the pending timeout — otherwise a tour
    // spins up after unmount, unreachable by the unmount cleanup (driverRef
    // is still null while the timeout is pending).
    setupSettingsDom({
      tabs: ['data', 'help'],
      activeTab: 'data',
      content: {
        data: ['data-management'],
        help: ['tour-management'],
      },
    })

    const { result, unmount } = renderHook(() => useTour())
    act(() => {
      result.current.startTour('settings')
    })

    // Unmount before the initial delay fires.
    unmount()
    act(() => {
      vi.advanceTimersByTime(600)
    })

    // No driver.js instance should have been constructed.
    expect(driverCreateCount).toBe(0)
    expect(lastConfig).toBeNull()
    expect(lastInstance).toBeNull()
  })

  it('cancels a pending start timeout when startTour is called again', () => {
    // A second startTour during the initial delay must replace, not stack:
    // only one driver.js instance should be created when the timer fires.
    setupSettingsDom({
      tabs: ['data', 'help'],
      activeTab: 'data',
      content: {
        data: ['data-management'],
        help: ['tour-management'],
      },
    })

    const { result } = renderHook(() => useTour())
    act(() => {
      result.current.startTour('settings')
    })
    act(() => {
      result.current.startTour('settings')
    })

    // Both start timeouts share the 600ms delay; advancing once should fire
    // only the surviving one and drive a single tour.
    act(() => {
      vi.advanceTimersByTime(600)
    })

    // Exactly one driver.js instance is built — the earlier pending timeout
    // was cancelled rather than firing a second, orphaned tour.
    expect(driverCreateCount).toBe(1)
    expect(lastInstance).not.toBeNull()
    expect(lastInstance!.drive).toHaveBeenCalledTimes(1)
  })

  it('completes the tour when every remaining target is missing', () => {
    // The Help tab renders nothing: advancing from the Data step should end
    // the tour cleanly instead of showing a detached popover.
    setupSettingsDom({
      tabs: ['ai-location', 'data', 'help'],
      activeTab: 'data',
      content: {
        'ai-location': [
          'ai-settings',
          'ai-toggle',
          'ai-quota',
          'ai-byok-disclosure',
          'location-settings',
        ],
        data: ['data-management'],
        help: [],
      },
    })

    const { result } = renderHook(() => useTour())
    startSettingsTour(result)
    expect(stepElements(lastConfig!)).toHaveLength(8)

    // Jump straight to step 6 (data-management); index bookkeeping only.
    act(() => {
      lastInstance!.moveTo(6)
    })
    lastInstance!.moveTo.mockClear()

    // Next would be step 7 (tour-management) on the empty Help tab: no live
    // target remains, so the tour completes and tears down.
    clickNext()
    expect(lastInstance!.moveNext).not.toHaveBeenCalled()
    expect(lastInstance!.moveTo).not.toHaveBeenCalled()
    expect(lastInstance!.destroy).toHaveBeenCalled()
    expect(result.current.isCompleted('settings')).toBe(true)
  })
})
