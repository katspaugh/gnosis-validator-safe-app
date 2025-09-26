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
    await expect(page.locator('h2').first()).toHaveText('Connect Your Wallet');
    await expect(page.locator('.card p').first()).toHaveText('Connect your wallet to view and claim your validator rewards.');
  });

  test('should display Connect Wallet button and Address Lookup section initially', async ({ page }) => {
    await page.goto('/');

    // Check Connect Wallet button is present and enabled
    const connectButton = page.locator('#connect-button');
    await expect(connectButton).toBeVisible();
    await expect(connectButton).toHaveText('Connect Wallet');
    await expect(connectButton).toBeEnabled();

    // Check Address Lookup section is present
    await expect(page.locator('h2').nth(1)).toHaveText('Check Any Address');
    await expect(page.locator('#address-input')).toBeVisible();
    await expect(page.locator('#lookup-button')).toBeVisible();
    await expect(page.locator('#lookup-button')).toBeDisabled(); // Should be disabled initially
  });

  test('should show appropriate error message when wallet is not available', async ({ page }) => {
    await page.goto('/');

    // Click Connect Wallet button
    await page.click('#connect-button');

    // Check error message appears
    await expect(page.locator('.error')).toBeVisible();
    await expect(page.locator('.error')).toHaveText('Connection method not available. Please install a Web3 wallet or ensure Safe App context.');
  });

  test('should have proper CSS classes and styling', async ({ page }) => {
    await page.goto('/');

    // Check main container
    await expect(page.locator('.container')).toBeVisible();

    // Check header section
    await expect(page.locator('.header')).toBeVisible();

    // Check card elements (first card should be visible)
    await expect(page.locator('.card').first()).toBeVisible();

    // Check button styling
    const connectButton = page.locator('#connect-button');
    await expect(connectButton).toHaveClass(/button/);
    await expect(connectButton).toHaveClass(/connect-button/);
  });

  test('should enable lookup button when valid address is entered', async ({ page }) => {
    await page.goto('/');

    const addressInput = page.locator('#address-input');
    const lookupButton = page.locator('#lookup-button');
    
    // Initially disabled
    await expect(lookupButton).toBeDisabled();

    // Enter valid address
    await addressInput.fill('0x1234567890123456789012345678901234567890');
    
    // Should be enabled now
    await expect(lookupButton).toBeEnabled();
    await expect(lookupButton).toHaveText('Check Address');
  });

  test('should display address lookup results with mock data', async ({ page }) => {
    await page.goto('/');

    const addressInput = page.locator('#address-input');
    const lookupButton = page.locator('#lookup-button');
    
    // Enter address and click lookup
    await addressInput.fill('0x1234567890123456789012345678901234567890');
    await lookupButton.click();
    
    // Wait for results to appear
    await page.waitForTimeout(2000);
    
    // Check that results are displayed
    await expect(page.locator('text=Address: 0x1234567890123456789012345678901234567890')).toBeVisible();
    await expect(page.locator('text=0.500000 GNO')).toBeVisible(); // Validator rewards
    await expect(page.locator('text=10.250000 GNO')).toBeVisible(); // GNO balance
    
    // Check that validator count section is displayed (even if 0 due to API limitations in test)
    await expect(page.locator('text=Validators Staked')).toBeVisible();
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
    await expect(page.locator('.card').first()).toBeVisible();
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