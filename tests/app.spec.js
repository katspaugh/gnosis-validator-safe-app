// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Gnosis Validator Safe App', () => {
  test('should load the main page with correct title and content', async ({ page }) => {
    await page.goto('/');

    // Check page title
    await expect(page).toHaveTitle('Gnosis Validator Safe App');

    // Check main heading
    await expect(page.locator('h1')).toHaveText('Gnosis Validator Safe App');

    // Check subtitle
    await expect(page.locator('.header p').first()).toHaveText('Manage your validator rewards on Gnosis Chain');

    // Check that Connect Wallet section is visible
    await expect(page.locator('h2')).toHaveText('Connect Your Wallet');
    await expect(page.locator('.card p').first()).toHaveText('Connect your wallet to view and claim your validator rewards.');
  });

  test('should display Connect Wallet button initially', async ({ page }) => {
    await page.goto('/');

    // Check Connect Wallet button is present and enabled
    const connectButton = page.locator('#connect-button');
    await expect(connectButton).toBeVisible();
    await expect(connectButton).toHaveText('Connect Wallet');
    await expect(connectButton).toBeEnabled();
  });

  test('should show appropriate error message when wallet is not available', async ({ page }) => {
    await page.goto('/');

    // Click Connect Wallet button
    await page.click('#connect-button');

    // Check error message appears
    await expect(page.locator('.error')).toBeVisible();
    await expect(page.locator('.error')).toHaveText('MetaMask or compatible wallet not found. Please install a Web3 wallet.');
  });

  test('should have proper CSS classes and styling', async ({ page }) => {
    await page.goto('/');

    // Check main container
    await expect(page.locator('.container')).toBeVisible();

    // Check header section
    await expect(page.locator('.header')).toBeVisible();

    // Check card elements
    await expect(page.locator('.card')).toBeVisible();

    // Check button styling
    const connectButton = page.locator('#connect-button');
    await expect(connectButton).toHaveClass(/button/);
    await expect(connectButton).toHaveClass(/connect-button/);
  });

  test('should handle button state changes correctly', async ({ page }) => {
    await page.goto('/');

    const connectButton = page.locator('#connect-button');
    
    // Initially enabled
    await expect(connectButton).toBeEnabled();
    await expect(connectButton).toHaveText('Connect Wallet');

    // Click and check if state changes appropriately
    await connectButton.click();

    // Should show error message (since no wallet is available in test environment)
    await expect(page.locator('.error')).toBeVisible();
    
    // Button should still be enabled after error
    await expect(connectButton).toBeEnabled();
  });

  test('should be responsive and mobile-friendly', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Check that elements are still visible in mobile view
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('#connect-button')).toBeVisible();
    await expect(page.locator('.container')).toBeVisible();

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    // Check elements are still properly displayed
    await expect(page.locator('.header')).toBeVisible();
    await expect(page.locator('.card')).toBeVisible();
  });

  test('should have no console errors on initial load', async ({ page }) => {
    const consoleErrors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    
    // Wait a bit for any async operations
    await page.waitForTimeout(2000);

    // Should have no console errors
    expect(consoleErrors).toHaveLength(0);
  });

  test('should load all required CSS and JS resources', async ({ page }) => {
    const failedRequests = [];
    
    page.on('requestfailed', request => {
      failedRequests.push(request.url());
    });

    await page.goto('/');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Should have no failed requests for local resources
    const localFailedRequests = failedRequests.filter(url => 
      url.includes('localhost') || url.includes('127.0.0.1')
    );
    expect(localFailedRequests).toHaveLength(0);
  });
});