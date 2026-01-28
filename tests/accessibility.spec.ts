import { test, expect } from '@playwright/test'
import { checkA11y, runA11yScan, formatViolations } from './utils/accessibility'

/**
 * Accessibility tests for all main routes
 *
 * These tests use axe-core to scan pages for WCAG 2.1 AA compliance.
 * Tests fail on critical and serious violations. Minor/moderate violations
 * are logged as warnings but don't cause test failures.
 */

test.describe('Accessibility - Homepage', () => {
  test('homepage should have no critical accessibility violations', async ({ page }) => {
    await page.goto('/')
    await checkA11y(page)
  })

  test('homepage mobile view should be accessible', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await checkA11y(page)
  })
})

test.describe('Accessibility - Allotment Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/allotment')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.waitForLoadState('networkidle')
  })

  test('allotment page should have no critical accessibility violations', async ({ page }) => {
    await checkA11y(page)
  })

  test('allotment page with dialog open should be accessible', async ({ page }) => {
    // Need to enable edit mode first, then click Add Area
    const lockButton = page.locator('button').filter({ hasText: /Lock/ })
    if (await lockButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await lockButton.click()
      await page.waitForTimeout(300)

      const addAreaButton = page.locator('button').filter({ hasText: 'Add Area' })
      if (await addAreaButton.isEnabled({ timeout: 3000 }).catch(() => false)) {
        await addAreaButton.click()
        await page.waitForTimeout(300)
        await checkA11y(page)
      }
    }
  })
})

test.describe('Accessibility - AI Advisor Page', () => {
  test('ai-advisor page should have no critical accessibility violations', async ({ page }) => {
    await page.goto('/ai-advisor')
    await checkA11y(page)
  })
})

test.describe('Accessibility - Seeds Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/seeds')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.waitForLoadState('networkidle')
  })

  test('seeds page should have no critical accessibility violations', async ({ page }) => {
    await checkA11y(page)
  })

  test('seeds page with dialog open should be accessible', async ({ page }) => {
    const addVarietyButton = page.locator('button').filter({ hasText: 'Add Variety' })
    if (await addVarietyButton.isVisible()) {
      await addVarietyButton.click()
      await page.waitForTimeout(300)
      await checkA11y(page)
    }
  })
})

test.describe('Accessibility - This Month Page', () => {
  test('this-month page should have no critical accessibility violations', async ({ page }) => {
    await page.goto('/this-month')
    await checkA11y(page)
  })
})

test.describe('Accessibility - Compost Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/compost')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.waitForLoadState('networkidle')
  })

  test('compost page should have no critical accessibility violations', async ({ page }) => {
    await checkA11y(page)
  })

  test('compost page with dialog open should be accessible', async ({ page }) => {
    await page.locator('button').filter({ hasText: 'New Compost Pile' }).click()
    await page.waitForTimeout(300)
    await checkA11y(page)
  })
})

test.describe('Accessibility - About Page', () => {
  test('about page should have no critical accessibility violations', async ({ page }) => {
    await page.goto('/about')
    await checkA11y(page)
  })
})

test.describe('Accessibility - Navigation', () => {
  test('navigation menu should be accessible on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/')

    // Dismiss onboarding wizard if it appears
    const skipButton = page.getByRole('button', { name: 'Skip' })
    if (await skipButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await skipButton.click()
      await page.waitForTimeout(300)
    }

    // Open More dropdown
    const moreButton = page.locator('header button').filter({ hasText: 'More' })
    if (await moreButton.isVisible()) {
      await moreButton.click()
      await page.waitForTimeout(200)
      await checkA11y(page)
    }
  })

  test('mobile navigation should be accessible', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // Dismiss onboarding wizard if it appears
    const skipButton = page.getByRole('button', { name: 'Skip' })
    if (await skipButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await skipButton.click()
      await page.waitForTimeout(300)
    }

    // Open mobile menu
    const menuButton = page.getByLabel('Open menu')
    if (await menuButton.isVisible()) {
      await menuButton.click()
      await expect(page.getByLabel('Close menu')).toBeVisible()
      await checkA11y(page)
    }
  })
})

test.describe('Accessibility - Detailed Report', () => {
  test('generate accessibility report for all pages', async ({ page }) => {
    const routes = [
      { path: '/', name: 'Homepage' },
      { path: '/allotment', name: 'Allotment' },
      { path: '/ai-advisor', name: 'AI Advisor' },
      { path: '/seeds', name: 'Seeds' },
      { path: '/this-month', name: 'This Month' },
      { path: '/compost', name: 'Compost' },
      { path: '/about', name: 'About' },
    ]

    const reports: { name: string; violations: number; details: string }[] = []

    for (const route of routes) {
      await page.goto(route.path)
      await page.waitForLoadState('networkidle')

      const results = await runA11yScan(page)
      const criticalSerious = results.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      )

      reports.push({
        name: route.name,
        violations: criticalSerious.length,
        details:
          criticalSerious.length > 0
            ? formatViolations({ ...results, violations: criticalSerious })
            : 'No critical/serious violations',
      })
    }

    // Log the summary report
    console.log('\n=== Accessibility Summary Report ===\n')
    for (const report of reports) {
      console.log(`${report.name}: ${report.violations} critical/serious violation(s)`)
    }

    // Check if any page has violations
    const totalViolations = reports.reduce((sum, r) => sum + r.violations, 0)
    if (totalViolations > 0) {
      console.log('\n=== Detailed Violations ===\n')
      for (const report of reports) {
        if (report.violations > 0) {
          console.log(`\n--- ${report.name} ---`)
          console.log(report.details)
        }
      }
    }

    // This test passes but logs the report for visibility
    // Individual page tests will fail if there are actual violations
    expect(true).toBe(true)
  })
})
