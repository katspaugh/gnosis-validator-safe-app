# Gnosis Validator Safe App - Testing Guide for Agents

This document provides comprehensive instructions for running and maintaining the end-to-end (e2e) tests for the Gnosis Validator Safe App.

## Overview

The Gnosis Validator Safe App is a pure HTML/CSS/JavaScript application that manages Gnosis Chain validator rewards. It requires no build step and uses ES6 modules for client-side functionality.

## Prerequisites

- **Node.js** (version 16 or higher)
- **npm** (comes with Node.js)
- **Python 3** (for local development server)

## Test Infrastructure

### Testing Framework
- **Playwright**: Used for end-to-end browser testing
- **Test Runner**: Built-in Playwright test runner
- **Browsers**: Tests run on Chromium, Firefox, WebKit, and mobile viewports

### Test Structure
```
tests/
├── app.spec.js      # Core application functionality tests
└── wallet.spec.js   # Wallet integration and mocking tests
```

## Running Tests

### 1. Initial Setup

```bash
# Install Node.js dependencies
npm install

# Install Playwright browsers (required for first run)
npx playwright install
```

### 2. Running All Tests

```bash
# Run all e2e tests
npm test

# Run tests with UI mode (visual test runner)
npm run test:ui

# Run tests in debug mode
npm run test:debug
```

### 3. Running Specific Tests

```bash
# Run only app functionality tests
npx playwright test tests/app.spec.js

# Run only wallet integration tests
npx playwright test tests/wallet.spec.js

# Run tests in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### 4. Development Server

The tests automatically start a development server, but you can also start it manually:

```bash
# Start local server for manual testing
npm run dev

# Or using Python directly
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

## Test Categories

### 1. Core Application Tests (`app.spec.js`)

- **Page Loading**: Verifies the app loads correctly with proper title and content
- **UI Elements**: Checks that all buttons, cards, and text elements are present
- **Error Handling**: Tests appropriate error messages when wallet is unavailable
- **Responsive Design**: Validates mobile and tablet viewport compatibility
- **Resource Loading**: Ensures all CSS and JS files load without errors
- **Console Errors**: Verifies no JavaScript errors occur during normal usage

### 2. Wallet Integration Tests (`wallet.spec.js`)

- **Wallet Connection Flow**: Tests the complete wallet connection process
- **Mock Wallet Integration**: Uses mocked wallet responses for testing
- **Account Display**: Verifies connected account information is shown correctly
- **Balance Display**: Tests rewards and GNO token balance display
- **Refresh Functionality**: Tests data refresh mechanisms
- **Claim Rewards**: Tests the reward claiming process
- **Error Scenarios**: Tests various wallet error conditions

## Understanding Test Results

### Successful Test Run
```
Running 15 tests using 5 workers
  15 passed (2.5s)
```

### Failed Test Example
```
  1) [chromium] › app.spec.js:10:3 › should load the main page
     Error: expect(locator).toHaveText(expected)
```

### Test Reports
- **HTML Report**: Generated in `playwright-report/` directory
- **Screenshots**: Captured on test failures in `test-results/`
- **Videos**: Optional video recordings of test runs

## Mock Wallet Testing

The wallet tests use JavaScript mocking to simulate MetaMask/Web3 wallet interactions:

```javascript
// Example mock setup
window.ethereum = {
  request: async (params) => {
    if (params.method === 'eth_requestAccounts') {
      return ['0x1234567890123456789012345678901234567890'];
    }
    // ... other methods
  },
  on: (event, callback) => {},
  removeListener: (event, callback) => {}
};
```

This allows testing wallet functionality without requiring actual wallet extensions.

## Continuous Integration

### GitHub Actions Workflow

The app includes a GitHub Actions workflow (`.github/workflows/e2e-tests.yml`) that:

1. **Triggers on**: Pull requests and pushes to main/master branches
2. **Environment**: Ubuntu latest with Node.js 18
3. **Steps**:
   - Checkout code
   - Install Node.js dependencies
   - Install Playwright browsers
   - Run all e2e tests
   - Upload test reports and screenshots

### Workflow Status

Check the workflow status in the GitHub Actions tab of the repository. Tests must pass before PRs can be merged.

## Troubleshooting

### Common Issues

1. **Browser Installation Fails**
   ```bash
   # Try installing with dependencies
   npx playwright install --with-deps
   
   # Or install specific browser
   npx playwright install chromium
   ```

2. **Port Already in Use**
   ```bash
   # Kill existing server
   pkill -f "python3 -m http.server"
   
   # Or use different port in playwright.config.js
   ```

3. **Test Timeouts**
   ```bash
   # Increase timeout in test files
   test.setTimeout(60000); // 60 seconds
   ```

4. **Mock Wallet Issues**
   - Ensure mock setup is complete in test files
   - Check that all required wallet methods are mocked

### Debug Commands

```bash
# Run with verbose output
npx playwright test --reporter=list

# Run single test with debug
npx playwright test tests/app.spec.js:10 --debug

# Generate trace files
npx playwright test --trace=on
```

## Adding New Tests

### Test File Structure

```javascript
const { test, expect } = require('@playwright/test');

test.describe('Feature Name', () => {
  test('should do something specific', async ({ page }) => {
    await page.goto('/');
    // Test implementation
  });
});
```

### Best Practices

1. **Descriptive Test Names**: Use clear, specific test descriptions
2. **Page Object Pattern**: Consider using page objects for complex interactions
3. **Wait Strategies**: Use appropriate wait strategies for async operations
4. **Mock Data**: Use consistent mock data across tests
5. **Cleanup**: Ensure tests don't affect each other

## Configuration

### playwright.config.js

Key configuration options:
- **testDir**: `./tests` - Test directory location
- **baseURL**: `http://localhost:8000` - Development server URL
- **browsers**: Chromium, Firefox, WebKit + mobile devices
- **webServer**: Automatic dev server startup
- **retries**: CI retry strategy
- **screenshots**: Failure screenshot capture

### Package.json Scripts

- `npm test`: Run all tests
- `npm run test:ui`: Visual test runner
- `npm run test:debug`: Debug mode
- `npm run dev`: Start development server

## Maintenance

### Regular Tasks

1. **Update Dependencies**
   ```bash
   npm update
   npx playwright install # Update browsers
   ```

2. **Review Test Coverage**
   - Ensure new features have corresponding tests
   - Update existing tests when functionality changes

3. **Monitor CI Performance**
   - Check for flaky tests
   - Optimize test execution time
   - Review failure patterns

### Test Health

- All tests should run consistently across different environments
- Mock data should remain stable and realistic
- Test descriptions should be kept up-to-date with functionality changes

## Support

For issues with the testing infrastructure:

1. Check existing GitHub issues
2. Review Playwright documentation: https://playwright.dev/
3. Examine console output and error messages
4. Use debug mode for detailed investigation

---

**Note**: This app uses pure HTML/CSS/JavaScript with ES6 modules. No build step is required, making it simple to test and deploy.