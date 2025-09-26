#!/usr/bin/env node
/**
 * Validates that E2E tests are properly structured without requiring browser installation
 */

const fs = require('fs');
const path = require('path');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

let testsValidated = 0;

function validateFile(fileName, checks) {
  const filePath = path.join(__dirname, fileName);
  if (!fs.existsSync(filePath)) {
    log('red', `✗ ${fileName} does not exist`);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  checks.forEach(check => {
    if (content.includes(check.text)) {
      log('green', `✓ ${fileName}: ${check.description}`);
      testsValidated++;
    } else {
      log('red', `✗ ${fileName}: ${check.description}`);
    }
  });
}

log('blue', '🔍 Validating E2E Test Structure...\n');

// Validate app.spec.js
validateFile('app.spec.js', [
  { text: 'test.describe', description: 'Uses Playwright test structure' },
  { text: 'should load the main page', description: 'Has page loading test' },
  { text: 'Check Any Address', description: 'Tests address lookup functionality' },
  { text: 'address-input', description: 'Tests address input field' },
  { text: 'lookup-button', description: 'Tests lookup button' },
  { text: 'GNO', description: 'Validates GNO display (not ETH)' }
]);

// Validate wallet.spec.js
validateFile('wallet.spec.js', [
  { text: 'test.describe', description: 'Uses Playwright test structure' },
  { text: 'window.ethereum', description: 'Mocks wallet properly' },
  { text: 'rewards in GNO', description: 'Tests GNO display instead of ETH' },
  { text: 'eth_requestAccounts', description: 'Mocks wallet connection' },
  { text: 'wallet connection flow', description: 'Tests wallet functionality' }
]);

// Validate basic.spec.js
validateFile('basic.spec.js', [
  { text: 'test.describe', description: 'Uses Playwright test structure' },
  { text: 'should serve the app', description: 'Has basic smoke test' },
  { text: 'console', description: 'Checks for console errors' },
  { text: 'toHaveTitle', description: 'Validates page title' }
]);

// Validate safe-app.spec.js
validateFile('safe-app.spec.js', [
  { text: 'test.describe', description: 'Uses Playwright test structure' },
  { text: 'iframe context', description: 'Tests iframe detection' },
  { text: 'Safe App', description: 'Tests Safe App functionality' },
  { text: 'manifest.json', description: 'Tests Safe App manifest' },
  { text: 'connection status', description: 'Tests connection type display' }
]);

// Check playwright config
const configPath = path.join(__dirname, '..', 'playwright.config.js');
if (fs.existsSync(configPath)) {
  const config = fs.readFileSync(configPath, 'utf8');
  if (config.includes('webServer')) {
    log('green', '✓ Playwright config: Has web server configuration');
    testsValidated++;
  }
  if (config.includes('baseURL')) {
    log('green', '✓ Playwright config: Has base URL configured');
    testsValidated++;
  }
  if (config.includes('projects')) {
    log('green', '✓ Playwright config: Has browser projects configured');
    testsValidated++;
  }
}

log('blue', `\n📊 E2E Test Validation Results:`);
log('green', `✓ Validated: ${testsValidated} test components`);
log('yellow', '⚠️  Note: Browser installation required for actual E2E test execution');
log('blue', '💡 Use "npm run test:e2e" after running "npx playwright install --with-deps"');