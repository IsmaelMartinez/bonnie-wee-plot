import AxeBuilder from '@axe-core/playwright'
import { Page } from '@playwright/test'
import type { AxeResults, Result } from 'axe-core'

/**
 * Violation severity levels for filtering
 */
export type ViolationSeverity = 'critical' | 'serious' | 'moderate' | 'minor'

/**
 * Options for running accessibility checks
 */
export interface A11yCheckOptions {
  /** Fail on these severity levels (default: critical, serious) */
  failOnSeverity?: ViolationSeverity[]
  /** Disable specific axe rules */
  disabledRules?: string[]
  /** Include only these rules */
  includeRules?: string[]
  /** Wait for page to be ready before scanning */
  waitForReady?: boolean
}

const DEFAULT_FAIL_SEVERITY: ViolationSeverity[] = ['critical', 'serious']

/**
 * Disabled rules with rationale
 *
 * color-contrast: Some intentional low-contrast decorative elements exist.
 *   The app uses a zen garden aesthetic with muted tones that may trigger
 *   false positives on non-text elements. Critical text maintains proper contrast.
 */
const DEFAULT_DISABLED_RULES: string[] = []

/**
 * Format a single violation for readable test output
 */
function formatViolation(violation: Result): string {
  const nodes = violation.nodes.map((node) => {
    const target = node.target.join(', ')
    const failureSummary = node.failureSummary || 'No specific failure summary'
    return `    - Element: ${target}\n      ${failureSummary}`
  })

  return [
    `[${violation.impact?.toUpperCase()}] ${violation.id}: ${violation.description}`,
    `  Help: ${violation.helpUrl}`,
    `  Affected elements:`,
    ...nodes,
  ].join('\n')
}

/**
 * Format all violations into a readable report
 */
export function formatViolations(results: AxeResults): string {
  if (results.violations.length === 0) {
    return 'No accessibility violations found.'
  }

  const header = `Found ${results.violations.length} accessibility violation(s):\n`
  const formatted = results.violations.map(formatViolation).join('\n\n')

  return header + '\n' + formatted
}

/**
 * Run axe accessibility scan on the page
 */
export async function runA11yScan(
  page: Page,
  options: A11yCheckOptions = {}
): Promise<AxeResults> {
  const { disabledRules = DEFAULT_DISABLED_RULES, waitForReady = true } = options

  if (waitForReady) {
    await page.waitForLoadState('networkidle')
  }

  let builder = new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])

  if (disabledRules.length > 0) {
    builder = builder.disableRules(disabledRules)
  }

  if (options.includeRules && options.includeRules.length > 0) {
    builder = builder.withRules(options.includeRules)
  }

  return builder.analyze()
}

/**
 * Check for accessibility violations and fail if critical/serious issues are found
 *
 * @param page - Playwright page
 * @param options - Check options
 * @throws Error if violations exceed severity threshold
 */
export async function checkA11y(
  page: Page,
  options: A11yCheckOptions = {}
): Promise<void> {
  const { failOnSeverity = DEFAULT_FAIL_SEVERITY } = options

  const results = await runA11yScan(page, options)

  const failingViolations = results.violations.filter(
    (v) => v.impact && failOnSeverity.includes(v.impact as ViolationSeverity)
  )

  const warningViolations = results.violations.filter(
    (v) => v.impact && !failOnSeverity.includes(v.impact as ViolationSeverity)
  )

  // Log warnings for minor/moderate violations
  if (warningViolations.length > 0) {
    console.log('\nAccessibility warnings (non-failing):')
    console.log(
      formatViolations({
        ...results,
        violations: warningViolations,
      })
    )
  }

  // Fail on critical/serious violations
  if (failingViolations.length > 0) {
    const report = formatViolations({
      ...results,
      violations: failingViolations,
    })
    throw new Error(`Accessibility check failed:\n\n${report}`)
  }
}

/**
 * Assert no accessibility violations (for use with expect)
 * Fails on critical and serious violations by default
 */
export async function expectNoA11yViolations(
  page: Page,
  options: A11yCheckOptions = {}
): Promise<void> {
  await checkA11y(page, options)
}
