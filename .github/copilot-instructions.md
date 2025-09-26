# Copilot Instructions for Gnosis Validator Safe App

## Repository Overview

This is a **pure HTML/CSS/JavaScript** Safe App for managing Gnosis Chain validator rewards. It requires **no build step** and uses ES6 modules for clean, modular client-side functionality.

### Key Architecture Principles
- **Zero dependencies at runtime** - pure web standards
- **ES6 modules** for code organization 
- **Safe Apps SDK integration** for Safe wallet compatibility
- **Dual connectivity** - works as standalone dApp or Safe App
- **Mock-friendly design** for comprehensive testing

## Development Guidelines

### Code Organization
```
app.js              # Main application entry point and state management
config.js           # Configuration constants and chain settings
connectionAdapter.js # Abstraction layer for Safe App vs MetaMask connections
contractService.js  # Blockchain interaction with fallback mock data
walletService.js    # Wallet-specific operations and network switching  
safeService.js      # Safe Apps SDK integration
utils.js            # Pure utility functions for validation and formatting
styles.css          # Responsive styling with CSS Grid/Flexbox
```

### Development Patterns

#### ES6 Module Structure
- Use `export const` for configurations and utilities
- Use `export { function }` for services 
- Import with destructuring: `import { CONFIG } from './config.js'`
- Always use `.js` extensions in imports

#### State Management
- Centralized `appState` object in `app.js`
- Immutable updates via object spread
- Clear separation between UI state and data state

#### Error Handling
- Always provide fallbacks (especially for contract calls)
- Use mock data when RPC calls fail
- Display user-friendly error messages
- Log technical details to console for debugging

#### Responsive Design
- Mobile-first CSS approach
- CSS Grid for layout, Flexbox for components
- Touch-friendly button sizes (minimum 44px)
- Readable text contrast and sizing

### Web3 Integration Patterns

#### Connection Management
```javascript
// Use connectionAdapter.js for all wallet interactions
import { initConnection, isConnectionAvailable } from './connectionAdapter.js';

// Always check availability before attempting connections
if (await isConnectionAvailable()) {
    await requestAccountAccess();
}
```

#### Contract Interactions
```javascript
// All contract calls should have fallbacks
try {
    const result = await contractCall();
    return result;
} catch (error) {
    console.warn('Contract call failed, using mock data:', error);
    return mockData;
}
```

#### Safe App Integration
- Use `safeService.js` for Safe-specific functionality
- Detect iframe context for Safe App mode
- Handle both Safe App and standalone wallet connections
- Always test in both contexts

### Testing Requirements

#### Unit Tests (`tests/unit-tests.js`)
- Validate file structure and ES6 imports
- Check configuration values and contract addresses
- Verify core functionality without browsers
- Test utility functions with various inputs

#### E2E Tests (Playwright)
- `app.spec.js` - Core application functionality
- `wallet.spec.js` - Wallet connection with mocking
- `safe-app.spec.js` - Safe App specific features
- `basic.spec.js` - Smoke tests and error checking

#### Mock Patterns for Testing
```javascript
// Mock wallet in tests using page.addInitScript()
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
                return null; // Successful chain switch
            }
            if (params.method === 'eth_call') {
                return '0x0'; // Mock contract response
            }
            return null;
        },
        on: (event, callback) => {},
        removeListener: (event, callback) => {}
    };
});
```

### Configuration Standards

#### Gnosis Chain Settings
- Chain ID: `0x64` (100 decimal)
- Native currency: xDAI (not ETH)
- **Always display rewards in GNO**, never ETH
- RPC URL: `https://rpc.gnosischain.com/`

#### Contract Addresses
- Validator Contract: `0x0b98057ea310f4d31f2a452b414647007d1645d9`
- GNO Token: `0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb`

### Common Debugging Scenarios

#### Connection Issues
1. Check if `window.ethereum` is available
2. Verify chain ID matches Gnosis Chain (100)
3. Test Safe App iframe detection with `window.parent !== window`
4. Check console for wallet connection errors
5. Test both Safe App and standalone wallet contexts

#### Contract Call Failures
1. Verify contract addresses in `config.js`
2. Check RPC endpoint availability
3. Test with mock data fallback
4. Validate function selectors and ABI encoding
5. Monitor network calls in browser dev tools

#### Testing Problems
1. Run `npm test` for quick validation (no browsers needed)
2. Use `npm run test:e2e-validate` to check test structure
3. Install browsers with `npx playwright install --with-deps`
4. Check `AGENTS.md` for comprehensive testing guide
5. Use `await page.addInitScript()` for wallet mocking
6. Test responsive design with mobile viewports

### Safe App Specific Considerations

#### Manifest Configuration
- Always update `manifest.json` for Safe App store
- Include proper iconPath and safe app URL
- Test iframe integration thoroughly

#### Safe SDK Usage
```javascript
// Use dynamic imports for Safe Apps SDK
async function importSafeAppsSDK() {
    // Check for global availability first
    if (typeof window !== 'undefined' && window.SafeAppsSDK) {
        return window.SafeAppsSDK;
    }
    
    // Fallback to CDN import
    const module = await import('https://esm.sh/@safe-global/safe-apps-sdk@8.1.0');
    return module.default || module.SafeAppsSDK || module;
}

// Always handle both Safe and non-Safe contexts
const isSafeApp = await safe.getSafeInfo().catch(() => null);
```

### Performance Guidelines

#### No Build Step Benefits
- Instant reload during development
- Easy debugging with source maps
- Simple deployment (just copy files)
- No dependency management overhead

#### Loading Performance  
- Minimize external HTTP requests
- Use efficient DOM manipulation
- Implement loading states for async operations
- Cache contract call results when appropriate

### Security Considerations

#### Input Validation
- Always validate Ethereum addresses with `isValidAddress()`
- Sanitize user inputs before display
- Use proper encoding for contract calls

#### Wallet Security
- Never store private keys or sensitive data
- Always request permissions before wallet operations
- Display clear transaction details to users
- Handle wallet rejections gracefully

### Common File Patterns

#### Adding New Features
1. Add configuration to `config.js` if needed
2. Create service functions in appropriate service file
3. Update `app.js` state and UI handling
4. Add corresponding tests to validate functionality
5. Update `AGENTS.md` if testing patterns change

#### Updating Dependencies
- Minimize external dependencies 
- Keep Safe Apps SDK updated for compatibility
- Test thoroughly after any dependency changes
- Update `package.json` engines field if Node requirements change

### Helpful Commands

```bash
# Development server
npm run dev                # Start local server on port 8000

# Testing
npm test                   # Run all tests (unit + validation)
npm run test:unit          # Quick tests without browsers
npm run test:e2e           # Full browser tests (requires browser install)
npm run test:ui            # Interactive test runner

# Browser setup for E2E tests
npx playwright install --with-deps
```

### Resources

- **Testing Guide**: See `AGENTS.md` for comprehensive testing documentation and step-by-step instructions
- **Safe Apps SDK**: https://docs.safe.global/safe-apps/developer-intro
- **Playwright Docs**: https://playwright.dev/
- **Gnosis Chain**: https://docs.gnosischain.com/

### Important Testing Notes

This repository has a sophisticated testing strategy:
- **Unit tests** validate structure without browser requirements
- **E2E validation** checks test file structure without running browsers
- **Full E2E tests** require browser installation but provide comprehensive coverage
- **Mock patterns** enable testing wallet functionality without real wallets
- All tests emphasize **displaying GNO tokens**, never ETH
- Tests cover both Safe App iframe context and standalone wallet usage

Remember: This app prioritizes simplicity, reliability, and user experience over complex tooling. Keep changes minimal and always test in both Safe App and standalone contexts.