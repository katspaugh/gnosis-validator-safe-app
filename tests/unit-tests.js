#!/usr/bin/env node
/**
 * Simple unit tests that validate the app structure and functionality
 * without requiring browser installation
 */

const fs = require('fs');
const path = require('path');

// Test colors for output
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

let testsPassed = 0;
let testsFailed = 0;

function test(description, testFn) {
  try {
    testFn();
    log('green', `✓ ${description}`);
    testsPassed++;
  } catch (error) {
    log('red', `✗ ${description}`);
    log('red', `  Error: ${error.message}`);
    testsFailed++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function fileExists(filePath) {
  return fs.existsSync(path.join(__dirname, '..', filePath));
}

function fileContains(filePath, content) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (!fs.existsSync(fullPath)) {
    return false;
  }
  const fileContent = fs.readFileSync(fullPath, 'utf8');
  return fileContent.includes(content);
}

// Run tests
log('blue', '🧪 Running Gnosis Validator Safe App Tests...\n');

// Test 1: Core files exist
test('Core application files exist', () => {
  assert(fileExists('index.html'), 'index.html should exist');
  assert(fileExists('app.js'), 'app.js should exist');
  assert(fileExists('styles.css'), 'styles.css should exist');
  assert(fileExists('config.js'), 'config.js should exist');
  assert(fileExists('contractService.js'), 'contractService.js should exist');
  assert(fileExists('walletService.js'), 'walletService.js should exist');
  assert(fileExists('utils.js'), 'utils.js should exist');
});

// Test 2: Package.json is valid
test('package.json is valid and has required scripts', () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  assert(packageJson.name === 'gnosis-validator-safe-app', 'Package name should be correct');
  assert(packageJson.scripts.test, 'Should have test script');
  assert(packageJson.scripts.dev, 'Should have dev script');
  assert(packageJson.devDependencies['@playwright/test'], 'Should have playwright dependency');
});

// Test 3: HTML structure is correct
test('index.html has correct structure', () => {
  assert(fileContains('index.html', '<title>Gnosis Validator Safe App</title>'), 'Should have correct title');
  assert(fileContains('index.html', '<div id="root">'), 'Should have root div');
  assert(fileContains('index.html', 'type="module"'), 'Should load app.js as module');
  assert(!fileContains('index.html', 'unpkg.com'), 'Should not depend on external CDNs');
});

// Test 4: App.js uses ES6 modules correctly
test('app.js uses ES6 modules and has required functionality', () => {
  assert(fileContains('app.js', 'import {'), 'Should use ES6 imports');
  assert(fileContains('app.js', 'fetchAddressData'), 'Should have address lookup function');
  assert(fileContains('app.js', 'connectWallet'), 'Should have wallet connection function');
  assert(fileContains('app.js', 'Check Any Address'), 'Should have address lookup UI');
  assert(fileContains('app.js', 'GNO'), 'Should display rewards in GNO');
  assert(!fileContains('app.js', ' ETH'), 'Should not display rewards in ETH');
});

// Test 5: Contract service has proper fallback
test('contractService.js has proper RPC fallback', () => {
  assert(fileContains('contractService.js', 'callContract'), 'Should have callContract function');
  assert(fileContains('contractService.js', 'mock data'), 'Should have mock data fallback');
  assert(fileContains('contractService.js', 'fetch(CONFIG.GNOSIS_RPC_URL'), 'Should try RPC calls');
  assert(fileContains('contractService.js', '0x6f05b59d3b20000'), 'Should have correct mock withdrawable amount');
  assert(fileContains('contractService.js', '0x8e3f50b173c10000'), 'Should have correct mock GNO balance');
  assert(fileContains('contractService.js', 'getValidatorCount'), 'Should have getValidatorCount function');
  assert(fileContains('contractService.js', 'gnosis.beaconcha.in'), 'Should query Gnosis beacon chain API');
});

// Test 6: Wallet service exists and has required functions
test('walletService.js has required wallet functions', () => {
  assert(fileContains('walletService.js', 'requestAccounts'), 'Should have requestAccounts function');
  assert(fileContains('walletService.js', 'switchToGnosisChain'), 'Should have chain switching');
  assert(fileContains('walletService.js', 'setupWalletEventListeners'), 'Should have event listeners');
});

// Test 7: Utils has validation functions
test('utils.js has required utility functions', () => {
  assert(fileContains('utils.js', 'isValidAddress'), 'Should have address validation');
  assert(fileContains('utils.js', 'formatEther'), 'Should have ether formatting');
  assert(fileContains('utils.js', 'isWalletAvailable'), 'Should have wallet availability check');
});

// Test 8: Configuration is correct
test('config.js has correct Gnosis Chain configuration', () => {
  assert(fileContains('config.js', 'VALIDATOR_CONTRACT_ADDRESS'), 'Should have validator contract address');
  assert(fileContains('config.js', 'GNO_TOKEN_ADDRESS'), 'Should have GNO token address');
  assert(fileContains('config.js', 'GNOSIS_CHAIN_ID'), 'Should have Gnosis chain ID');
  assert(fileContains('config.js', '0x64'), 'Should have correct chain ID (100 in hex)');
});

// Test 9: E2E test files exist
test('E2E test files exist', () => {
  assert(fileExists('tests/app.spec.js'), 'Should have app e2e tests');
  assert(fileExists('tests/wallet.spec.js'), 'Should have wallet e2e tests');
  assert(fileExists('tests/basic.spec.js'), 'Should have basic e2e tests');
  assert(fileExists('playwright.config.js'), 'Should have playwright config');
});

// Test 10: GitHub Actions workflow exists
test('GitHub Actions workflow is configured', () => {
  assert(fileExists('.github/workflows/e2e-tests.yml'), 'Should have GitHub Actions workflow');
  assert(fileContains('.github/workflows/e2e-tests.yml', 'npx playwright install'), 'Should install browsers in CI');
  assert(fileContains('.github/workflows/e2e-tests.yml', 'npm test'), 'Should run tests in CI');
});

// Test 11: Documentation exists
test('Documentation files exist', () => {
  assert(fileExists('AGENTS.md'), 'Should have AGENTS.md');
  assert(fileExists('README.md'), 'Should have README.md');
  assert(fileContains('AGENTS.md', 'Testing Guide'), 'AGENTS.md should be a testing guide');
  assert(fileContains('AGENTS.md', 'Playwright'), 'Should document Playwright usage');
});

// Test 12: App has address lookup functionality
test('Address lookup functionality is implemented', () => {
  assert(fileContains('app.js', 'lookupAddress'), 'Should have lookup address state');
  assert(fileContains('app.js', 'address-input'), 'Should have address input field');
  assert(fileContains('app.js', 'lookup-button'), 'Should have lookup button');
  assert(fileContains('app.js', 'isValidAddress'), 'Should validate addresses');
});

// Summary
log('blue', '\n📊 Test Results:');
log('green', `✓ Passed: ${testsPassed}`);
if (testsFailed > 0) {
  log('red', `✗ Failed: ${testsFailed}`);
  process.exit(1);
} else {
  log('green', '🎉 All tests passed!');
  process.exit(0);
}