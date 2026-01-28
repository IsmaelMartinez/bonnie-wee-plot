import { test, expect } from '@playwright/test';
import { checkA11y } from './utils/accessibility';

// Helper to skip onboarding by marking setup as complete
async function skipOnboarding(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    localStorage.setItem('allotment-unified-data', JSON.stringify({
      meta: { setupCompleted: true },
      layout: { areas: [] },
      seasons: [],
      currentYear: new Date().getFullYear(),
      varieties: []
    }))
  })
}

test.describe('Homepage and Navigation', () => {
  test('should display the homepage with correct content', async ({ page }) => {
    await skipOnboarding(page)
    await page.goto('/');

    await expect(page).toHaveTitle(/Bonnie Wee Plot/);
    await expect(page.getByRole('heading', { name: /Today/i })).toBeVisible();
  });

  test('should navigate to AI advisor page', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await skipOnboarding(page)
    await page.goto('/');

    // AI advisor is now in "More" dropdown - click More button first
    const moreButton = page.locator('header button').filter({ hasText: 'More' });
    await moreButton.click();

    // Then click "Ask Aitor" link in dropdown
    const aiAdvisorLink = page.getByRole('menuitem', { name: /Ask Aitor/i });
    await aiAdvisorLink.click();
    await expect(page).toHaveURL(/ai-advisor/);
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Check that Today heading is still visible on mobile
    await expect(page.getByRole('heading', { name: /Today/i })).toBeVisible();
  });

  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/');

    // Check that the page has proper meta tags
    const title = await page.title();
    expect(title).toContain('Bonnie Wee Plot');

    // Check for viewport meta tag (important for mobile)
    const viewportTag = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewportTag).toContain('width=device-width');
  });

  test('should load without JavaScript errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');

    // Wait for any potential JavaScript to execute
    await page.waitForLoadState('networkidle');

    // Check that there are no critical JavaScript errors
    const criticalErrors = errors.filter(error =>
      !error.includes('favicon') &&
      !error.includes('404') &&
      !error.includes('net::ERR_ABORTED')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('should have no critical accessibility violations', async ({ page }) => {
    await page.goto('/');
    await checkA11y(page);
  });
});

test.describe('More Dropdown Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
  })

  test('should display More dropdown button on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    // Look for More button in navigation header
    const moreButton = page.locator('header button').filter({ hasText: 'More' });
    await expect(moreButton).toBeVisible();
  });

  test('should open More dropdown and show links', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    // Click on More to open dropdown
    const moreButton = page.locator('header button').filter({ hasText: 'More' });
    await moreButton.click();

    // Wait for dropdown links to become visible
    const compostLink = page.getByRole('menuitem', { name: /Compost/i });
    await expect(compostLink).toBeVisible();
  });

  test('should navigate to Compost from dropdown', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    // Open dropdown
    const moreButton = page.locator('header button').filter({ hasText: 'More' });
    await moreButton.click();

    // Wait for and click on Compost
    const compostLink = page.getByRole('menuitem', { name: /Compost/i });
    await expect(compostLink).toBeVisible();
    await compostLink.click();

    await expect(page).toHaveURL(/compost/);
  });

  test('should navigate to This Month from dropdown', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    // Open dropdown
    const moreButton = page.locator('header button').filter({ hasText: 'More' });
    await moreButton.click();

    // Wait for and click on This Month
    const thisMonthLink = page.getByRole('menuitem', { name: /This Month/i });
    await expect(thisMonthLink).toBeVisible();
    await thisMonthLink.click();

    await expect(page).toHaveURL(/this-month/);
  });

  test('should navigate to About from dropdown', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    // Open dropdown
    const moreButton = page.locator('header button').filter({ hasText: 'More' });
    await moreButton.click();

    // Wait for and click on About
    const aboutLink = page.getByRole('menuitem', { name: /About/i });
    await expect(aboutLink).toBeVisible();
    await aboutLink.click();

    await expect(page).toHaveURL(/about/);
  });

  test('should show mobile menu button on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Look for mobile menu button in header (the lg:hidden button)
    const mobileMenuButton = page.locator('header button.lg\\:hidden');
    await expect(mobileMenuButton).toBeVisible();
  });

  test('should open mobile menu and show navigation links', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Wait for hamburger button to be visible
    const menuButton = page.getByLabel('Open menu');
    await expect(menuButton).toBeVisible();

    // Click to open menu
    await menuButton.click();

    // Wait for mobile menu to open - button should change to "Close menu"
    await expect(page.getByLabel('Close menu')).toBeVisible();

    // Verify navigation links are visible in the mobile menu
    await expect(page.locator('a').filter({ hasText: 'Today' }).last()).toBeVisible();
    await expect(page.locator('a').filter({ hasText: 'Allotment' }).last()).toBeVisible();
  });
});
