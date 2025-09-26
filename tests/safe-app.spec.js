// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Safe App Context Tests', () => {
  test('should detect iframe context correctly', async ({ page }) => {
    // Test iframe detection by setting up iframe context
    await page.goto('/');

    // Test the standalone context first
    const isStandaloneIframe = await page.evaluate(() => {
      // Import the function to test
      return new Promise((resolve) => {
        import('/utils.js').then(module => {
          resolve(module.isInIframe());
        });
      });
    });

    expect(isStandaloneIframe).toBe(false);
  });

  test('should show correct connection status for standalone app', async ({ page }) => {
    await page.goto('/');

    // Mock wallet availability
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
            return '0x16345785d8a0000'; // Mock value
          }
          return null;
        },
        on: (event, callback) => {},
        removeListener: (event, callback) => {}
      };
    });

    // Connect wallet
    await page.click('#connect-button');
    await page.waitForTimeout(2000);

    // Should show "External Wallet" in connection status
    await expect(page.locator('.network-status')).toContainText('External Wallet');
  });

  test('should handle Safe App context when mocked', async ({ page }) => {
    // Mock Safe App environment by creating iframe-like context
    await page.addInitScript(() => {
      // Mock Safe Apps SDK
      window.SafeAppsSDK = class {
        constructor() {}
        
        get safe() {
          return {
            getInfo: async () => ({
              safeAddress: '0xabc1234567890123456789012345678901234567890',
              chainId: 100,
              network: 'GNOSIS_CHAIN'
            })
          };
        }
        
        get txs() {
          return {
            send: async (txs) => ({
              safeTxHash: '0xmocktxhash123'
            })
          };
        }
      };

      // Mock iframe context
      Object.defineProperty(window, 'top', {
        get: function() {
          // Throw error to simulate cross-origin restriction (typical iframe behavior)
          throw new Error('Cross-origin access denied');
        }
      });
    });

    await page.goto('/');
    await page.waitForTimeout(1000);

    // In a real Safe App context, the app would auto-connect
    // For now, we test that the iframe detection works
    const connectionType = await page.evaluate(async () => {
      const module = await import('/utils.js');
      return module.isInIframe();
    });

    expect(connectionType).toBe(true);
  });

  test('should display Safe App manifest correctly', async ({ page }) => {
    // Test that manifest.json exists and has correct structure
    const response = await page.request.get('/manifest.json');
    expect(response.ok()).toBeTruthy();
    
    const manifest = await response.json();
    expect(manifest.name).toBe('Gnosis Validator Safe App');
    expect(manifest.description).toContain('validator rewards');
  });

  test('should handle connection errors gracefully', async ({ page }) => {
    await page.goto('/');
    
    // Try to connect without wallet or Safe context
    await page.click('#connect-button');
    await page.waitForTimeout(1000);
    
    // Should show appropriate error message
    const errorMessage = await page.locator('.message').textContent();
    expect(errorMessage).toContain('Connection method not available');
  });
});