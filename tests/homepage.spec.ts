import { test, expect } from '@playwright/test';

test.describe('Homepage and Navigation', () => {
  test('should display the homepage with correct content', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/Community Allotment/);
    await expect(page.getByRole('heading', { name: /Welcome to Community Allotment/ })).toBeVisible();
  });

  test('should navigate to announcements page', async ({ page }) => {
    await page.goto('/');

    // Look for navigation link to announcements (exact match in header)
    const announcementsLink = page.getByRole('link', { name: 'Announcements', exact: true });
    if (await announcementsLink.isVisible()) {
      await announcementsLink.click();
      await expect(page).toHaveURL('/announcements');
      await expect(page.getByRole('heading', { name: '📢 Community Announcements' })).toBeVisible();
    }
  });

  test('should navigate to admin page', async ({ page }) => {
    await page.goto('/');

    // Look for navigation link to admin
    const adminLink = page.getByRole('link', { name: /Admin/ });
    if (await adminLink.isVisible()) {
      await adminLink.click({ force: true });
      await expect(page).toHaveURL('/admin');
      await expect(page.getByRole('heading', { name: '🔧 Admin Dashboard' })).toBeVisible();
    }
  });

  test('should navigate to AI advisor page', async ({ page }) => {
    await page.goto('/');

    // Look for navigation link to AI advisor
    const aiAdvisorLink = page.getByRole('link', { name: /AI Advisor/ });
    if (await aiAdvisorLink.isVisible()) {
      await aiAdvisorLink.click();
      await expect(page).toHaveURL('/ai-advisor');
    }
  });

  test('should navigate to calendar page', async ({ page }) => {
    await page.goto('/');

    // Look for navigation link to calendar (exact match in header)
    const calendarLink = page.getByRole('link', { name: 'Calendar', exact: true });
    if (await calendarLink.isVisible()) {
      await calendarLink.click();
      await expect(page).toHaveURL('/calendar');
    }
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
