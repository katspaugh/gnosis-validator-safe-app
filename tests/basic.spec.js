// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Basic App Tests', () => {
  test('should serve the app without errors', async ({ page }) => {
    // Track console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    
    // Basic page load test
    await expect(page).toHaveTitle('Gnosis Validator Safe App');
    
    // Check no console errors
    expect(errors).toHaveLength(0);
  });

  test('should display main UI elements', async ({ page }) => {
    await page.goto('/');
    
    // Check main elements exist
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.container')).toBeVisible();
    await expect(page.locator('#connect-button')).toBeVisible();
  });
});