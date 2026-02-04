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

// Helper to unlock all features for navigation tests
async function unlockAllFeatures(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    localStorage.setItem('allotment-engagement', JSON.stringify({
      visitCount: 10,
      lastVisit: new Date().toISOString(),
      manuallyUnlocked: ['ai-advisor', 'compost', 'allotment-layout']
    }));
    // Mark all celebrations as already shown to prevent modals
    localStorage.setItem('allotment-celebrations-shown', JSON.stringify([
      'ai-advisor', 'compost', 'allotment-layout'
    ]));
  });
}

test.describe('Homepage and Navigation', () => {
  test('should display the homepage with correct content', async ({ page }) => {
    await skipOnboarding(page)
    await page.goto('/');

    await expect(page).toHaveTitle(/Bonnie Wee Plot/);
    await expect(page.getByRole('heading', { name: /Today/i })).toBeVisible();
  });

  test('should open AI advisor modal via floating button', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await skipOnboarding(page)
    await page.goto('/');

    // Unlock all features for navigation testing
    await unlockAllFeatures(page);
    await page.reload();

    // AI advisor is now accessed via floating button
    const aitorButton = page.locator('button[aria-label*="Aitor"]');
    await expect(aitorButton).toBeVisible();
    await aitorButton.click();

    // Modal should open
    await expect(page.locator('h2').filter({ hasText: /Ask Aitor/i })).toBeVisible();
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
    // Filter out expected/non-critical errors
    const criticalErrors = errors.filter(error =>
      !error.includes('favicon') &&
      !error.includes('404') &&
      !error.includes('net::ERR_ABORTED') &&
      !error.includes('GeolocationPositionError') // Expected when geolocation is unavailable/denied
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

    // Locked features show in dropdown with Unlock now button
    const unlockButton = page.locator('[role="menu"]').getByText('Unlock now');
    await expect(unlockButton.first()).toBeVisible();

    // Settings/About links are always in dropdown
    const aboutLink = page.locator('a[href^="/about"]');
    await expect(aboutLink).toBeVisible();
  });

  test('should navigate to Compost from primary nav when unlocked', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    // Unlock all features for navigation testing
    await unlockAllFeatures(page);
    await page.reload();

    // When unlocked, Compost appears in primary nav (not dropdown)
    const compostLink = page.getByRole('link', { name: /Compost/i });
    await expect(compostLink).toBeVisible();
    await compostLink.click();

    await expect(page).toHaveURL(/compost/);
  });

  test('should navigate to This Month from primary navigation', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    // This Month is now in primary navigation (not dropdown)
    const thisMonthLink = page.getByRole('link', { name: /This Month/i });
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

    // Wait for and click on About - use href selector with trailing slash flexibility
    const aboutLink = page.locator('a[href^="/about"]');
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
