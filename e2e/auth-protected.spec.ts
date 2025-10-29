import { test, expect } from '@playwright/test';
import { LoginPage } from './test-helpers';

test.describe('Protected Routes', () => {
  test('should redirect to login when trying to access a protected route and not authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/auth/login?callbackUrl=%2Fdashboard');
  });

  test.describe('CLIENT_EXTERNAL role', () => {
    test.use({ storageState: 'e2e/sessions/client_external.json' });

    test('should access the client portal', async ({ page }) => {
      await page.goto('/client-portal');
      await expect(page).toHaveURL('/client-portal');
    });

    test('should not access the dashboard', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page).toHaveURL('/client-portal');
    });
  });

  test.describe('USER role', () => {
    test.use({ storageState: 'e2e/sessions/user.json' });

    test('should access the dashboard', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page).toHaveURL('/dashboard');
    });

    test('should not access the user management page', async ({ page }) => {
      await page.goto('/dashboard/users');
      await expect(page).toHaveURL('/dashboard');
    });
  });

  test.describe('MANAGER role', () => {
    test.use({ storageState: 'e2e/sessions/manager.json' });

    test('should access the user management page', async ({ page }) => {
      await page.goto('/dashboard/users');
      await expect(page).toHaveURL('/dashboard/users');
    });
  });
});
