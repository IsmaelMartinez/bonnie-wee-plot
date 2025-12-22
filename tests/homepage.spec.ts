import { test, expect } from '@playwright/test';

test.describe('Homepage and Navigation', () => {
  test('should display the homepage with correct content', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/Community Allotment/);
    await expect(page.getByRole('heading', { name: /Welcome to Community Allotment/ })).toBeVisible();
  });

  test('should navigate to AI advisor page', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    // Look for navigation link to AI advisor in header (labeled as "Aitor")
    const aiAdvisorLink = page.locator('header').getByRole('link', { name: 'Aitor' });
    await aiAdvisorLink.click();
    await expect(page).toHaveURL(/ai-advisor/);
  });

  test('should navigate to garden planner page', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    // Look for navigation link to garden planner in header
    const gardenPlannerLink = page.locator('header').getByRole('link', { name: 'Garden Planner' });
    await gardenPlannerLink.click();
    await expect(page).toHaveURL(/garden-planner/);
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Check that content is still visible on mobile
    await expect(page.getByRole('heading', { name: /Welcome to Community Allotment/ })).toBeVisible();
  });

  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/');

    // Check that the page has proper meta tags
    const title = await page.title();
    expect(title).toContain('Community Allotment');

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
});

test.describe('Growing Guides Navigation', () => {
  test('should display Growing Guides dropdown on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    // Look for Growing Guides button in navigation header
    const growingGuidesButton = page.locator('header button').filter({ hasText: /growing guides/i });
    await expect(growingGuidesButton).toBeVisible();
  });

  test('should open Growing Guides dropdown and show links', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    // Click on Growing Guides to open dropdown
    const growingGuidesButton = page.locator('header button').filter({ hasText: /growing guides/i });
    await growingGuidesButton.click();

    // Wait for dropdown link to become visible
    const companionLink = page.locator('a[href="/companion-planting"]');
    await expect(companionLink).toBeVisible();
  });

  test('should navigate to Companion Planting from dropdown', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    // Open dropdown
    const growingGuidesButton = page.locator('header button').filter({ hasText: /growing guides/i });
    await growingGuidesButton.click();

    // Wait for and click on Companion Planting
    const companionLink = page.locator('a[href="/companion-planting"]');
    await expect(companionLink).toBeVisible();
    await companionLink.click();

    await expect(page).toHaveURL(/companion-planting/);
  });

  test('should navigate to Composting from dropdown', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    // Open dropdown
    const growingGuidesButton = page.locator('header button').filter({ hasText: /growing guides/i });
    await growingGuidesButton.click();

    // Wait for and click on Composting
    const compostingLink = page.locator('a[href="/composting"]');
    await expect(compostingLink).toBeVisible();
    await compostingLink.click();

    await expect(page).toHaveURL(/composting/);
  });

  test('should navigate to Crop Rotation from dropdown', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    // Open dropdown
    const growingGuidesButton = page.locator('header button').filter({ hasText: /growing guides/i });
    await growingGuidesButton.click();

    // Wait for and click on Crop Rotation
    const cropRotationLink = page.locator('a[href="/crop-rotation"]');
    await expect(cropRotationLink).toBeVisible();
    await cropRotationLink.click();

    await expect(page).toHaveURL(/crop-rotation/);
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

    // Open mobile menu using the hamburger button
    const mobileMenuButton = page.locator('header button.lg\\:hidden');
    await mobileMenuButton.click();

    // Wait for mobile menu to open and verify navigation links are visible
    const gardenPlannerLink = page.locator('a[href="/garden-planner"]').first();
    await expect(gardenPlannerLink).toBeVisible();
  });
});
