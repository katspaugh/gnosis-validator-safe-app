// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Wallet Integration Tests', () => {
  test('should handle wallet connection flow correctly', async ({ page }) => {
    await page.goto('/');

    // Initially should show connect wallet UI
    await expect(page.locator('h2')).toHaveText('Connect Your Wallet');
    await expect(page.locator('#connect-button')).toBeVisible();
  });

  test('should mock successful wallet connection', async ({ page }) => {
    // Mock window.ethereum for testing wallet connection
    await page.addInitScript(() => {
      window.ethereum = {
        request: async (params) => {
          if (params.method === 'eth_requestAccounts') {
            return ['0x1234567890123456789012345678901234567890'];
          }
          if (params.method === 'eth_accounts') {
            return ['0x1234567890123456789012345678901234567890'];
          }
          if (params.method === 'wallet_switchEthereumChain') {
            return null;
          }
          if (params.method === 'eth_call') {
            return '0x0';
          }
          return null;
        },
        on: (event, callback) => {},
        removeListener: (event, callback) => {}
      };
    });

    await page.goto('/');

    // Click connect wallet
    await page.click('#connect-button');

    // Wait for the connection to process
    await page.waitForTimeout(1000);

    // Should show connected state (check for account address display)
    await expect(page.locator('.address')).toBeVisible();
    await expect(page.locator('.network-status')).toBeVisible();
  });

  test('should display connected account information', async ({ page }) => {
    // Mock wallet connection
    await page.addInitScript(() => {
      window.ethereum = {
        request: async (params) => {
          if (params.method === 'eth_requestAccounts' || params.method === 'eth_accounts') {
            return ['0x1234567890123456789012345678901234567890'];
          }
          if (params.method === 'wallet_switchEthereumChain') {
            return null;
          }
          if (params.method === 'eth_call') {
            return '0x16345785d8a0000'; // Mock value representing some ETH
          }
          return null;
        },
        on: (event, callback) => {},
        removeListener: (event, callback) => {}
      };
    });

    await page.goto('/');
    
    // Connect wallet
    await page.click('#connect-button');
    await page.waitForTimeout(2000);

    // Check connected state elements
    await expect(page.locator('.label')).toContainText(['Connected Account', 'Rewards to Date', 'GNO Token Balance']);
    await expect(page.locator('.address')).toHaveText('0x1234567890123456789012345678901234567890');
    await expect(page.locator('.network-status')).toHaveText('✅ Gnosis Chain');
  });

  test('should show rewards and balance information when connected', async ({ page }) => {
    // Mock wallet with some balance
    await page.addInitScript(() => {
      window.ethereum = {
        request: async (params) => {
          if (params.method === 'eth_requestAccounts' || params.method === 'eth_accounts') {
            return ['0x1234567890123456789012345678901234567890'];
          }
          if (params.method === 'wallet_switchEthereumChain') {
            return null;
          }
          if (params.method === 'eth_call') {
            // Mock withdrawable amount and GNO balance
            return '0x16345785d8a0000'; // ~0.1 ETH
          }
          return null;
        },
        on: (event, callback) => {},
        removeListener: (event, callback) => {}
      };
    });

    await page.goto('/');
    await page.click('#connect-button');
    await page.waitForTimeout(2000);

    // Check that balance displays are visible
    const balanceElements = page.locator('.balance');
    await expect(balanceElements).toHaveCount(2); // Rewards and GNO balance

    // Check for refresh button
    await expect(page.locator('#refresh-button')).toBeVisible();
    await expect(page.locator('#refresh-button')).toHaveText('Refresh Data');
  });

  test('should handle wallet errors gracefully', async ({ page }) => {
    // Mock wallet that throws errors
    await page.addInitScript(() => {
      window.ethereum = {
        request: async (params) => {
          throw new Error('User rejected the request');
        },
        on: (event, callback) => {},
        removeListener: (event, callback) => {}
      };
    });

    await page.goto('/');
    await page.click('#connect-button');
    await page.waitForTimeout(1000);

    // Should show error message
    await expect(page.locator('.error')).toBeVisible();
    await expect(page.locator('.error')).toContainText('Failed to connect wallet');
  });

  test('should handle refresh data functionality', async ({ page }) => {
    // Mock connected wallet
    await page.addInitScript(() => {
      window.ethereum = {
        request: async (params) => {
          if (params.method === 'eth_requestAccounts' || params.method === 'eth_accounts') {
            return ['0x1234567890123456789012345678901234567890'];
          }
          if (params.method === 'wallet_switchEthereumChain') {
            return null;
          }
          if (params.method === 'eth_call') {
            return '0x16345785d8a0000';
          }
          return null;
        },
        on: (event, callback) => {},
        removeListener: (event, callback) => {}
      };
    });

    await page.goto('/');
    await page.click('#connect-button');
    await page.waitForTimeout(2000);

    // Click refresh button
    const refreshButton = page.locator('#refresh-button');
    await expect(refreshButton).toBeVisible();
    await refreshButton.click();

    // Should show loading state briefly
    await expect(refreshButton).toHaveText('Refreshing...');
    await page.waitForTimeout(1000);

    // Should return to normal state
    await expect(refreshButton).toHaveText('Refresh Data');
  });

  test('should handle claim rewards functionality', async ({ page }) => {
    // Mock connected wallet with rewards
    await page.addInitScript(() => {
      window.ethereum = {
        request: async (params) => {
          if (params.method === 'eth_requestAccounts' || params.method === 'eth_accounts') {
            return ['0x1234567890123456789012345678901234567890'];
          }
          if (params.method === 'wallet_switchEthereumChain') {
            return null;
          }
          if (params.method === 'eth_call') {
            return '0x16345785d8a0000'; // Has rewards available
          }
          if (params.method === 'eth_sendTransaction') {
            return '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
          }
          return null;
        },
        on: (event, callback) => {},
        removeListener: (event, callback) => {}
      };
    });

    await page.goto('/');
    await page.click('#connect-button');
    await page.waitForTimeout(2000);

    // Check that claim button is available and enabled
    const claimButton = page.locator('#claim-button');
    await expect(claimButton).toBeVisible();
    await expect(claimButton).toBeEnabled();
    await expect(claimButton).toHaveText('Claim Rewards');

    // Click claim button
    await claimButton.click();

    // Should show claiming state
    await expect(claimButton).toHaveText('Claiming...');
    await page.waitForTimeout(1000);

    // Should show success message
    await expect(page.locator('.success')).toBeVisible();
    await expect(page.locator('.success')).toContainText('Transaction submitted');
  });
});