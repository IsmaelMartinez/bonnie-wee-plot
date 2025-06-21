import { test, expect } from '@playwright/test';

test.describe('Admin Debug', () => {
  test.beforeEach(async ({ page }) => {
    // Listen to console logs
    page.on('console', msg => console.log(`[${msg.type()}] ${msg.text()}`));
    page.on('pageerror', error => console.log(`Page error: ${error.message}`));

    await page.goto('/admin?test-mode=true');
  });

  test('debug tab switching', async ({ page }) => {
    // Check initial state
    await expect(page.getByRole('heading', { name: '🔧 Admin Dashboard' })).toBeVisible();

    // Check that the Users tab button exists
    const usersTab = page.getByRole('button', { name: 'Users' });
    await expect(usersTab).toBeVisible();

    console.log('Users tab found, clicking...');
    await usersTab.click();

    // Wait for JavaScript to execute
    await page.waitForTimeout(2000);

    // Log current page state
    const pageContent = await page.content();
    console.log('Page has "Manage Users":', pageContent.includes('Manage Users'));
    console.log('Page has "users" active tab:', pageContent.includes('border-primary-500'));

    // Check if Manage Users header appears
    const usersHeader = page.getByRole('heading', { name: 'Manage Users' });
    console.log('Looking for Manage Users header...');
    await expect(usersHeader).toBeVisible();

    // Check if table appears
    const nameHeader = page.getByRole('columnheader', { name: 'Name' });
    console.log('Looking for Name column header...');
    await expect(nameHeader).toBeVisible();
  });
});
