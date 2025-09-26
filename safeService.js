// Safe Apps SDK service for handling Safe App functionality

let safeAppsSDK = null;
let safeInfo = null;

/**
 * Dynamically imports the Safe Apps SDK
 * @returns {Promise<any>} Safe Apps SDK class
 */
async function importSafeAppsSDK() {
    try {
        // First, check if it's already available globally (common in Safe environment)
        if (typeof window !== 'undefined' && window.SafeAppsSDK) {
            console.log('Using globally available Safe Apps SDK');
            return window.SafeAppsSDK;
        }
        
        // Try to import from esm.sh which handles dependency resolution
        console.log('Attempting to import Safe Apps SDK from esm.sh...');
        try {
            const module = await import('https://esm.sh/@safe-global/safe-apps-sdk@8.1.0');
            console.log('Successfully imported Safe Apps SDK from esm.sh');
            return module.default || module.SafeAppsSDK || module;
        } catch (esmShError) {
            console.warn('esm.sh CDN failed:', esmShError);
        }
        
    } catch (error) {
        console.warn('Failed to import Safe Apps SDK from CDN:', error);
    }
    
    // Final fallback: check if globally available (might be loaded by Safe)
    if (typeof window !== 'undefined' && window.SafeAppsSDK) {
        console.log('Using globally available Safe Apps SDK as fallback');
        return window.SafeAppsSDK;
    }
    
    throw new Error('Safe Apps SDK not available. This app should be loaded within a Safe App context where the SDK is provided globally.');
}

/**
 * Checks if Safe Apps SDK is available (either globally or can be imported)
 * @returns {Promise<boolean>} True if SDK is available
 */
async function isSafeAppsSDKAvailable() {
    try {
        await importSafeAppsSDK();
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Waits for Safe Apps SDK to be available with timeout and retries
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<boolean>} True if SDK became available
 */
function waitForSafeAppsSDK(timeout = 10000) {
    return new Promise(async (resolve) => {
        // First quick check
        if (await isSafeAppsSDKAvailable()) {
            resolve(true);
            return;
        }

        const startTime = Date.now();
        let attempts = 0;
        const maxAttempts = Math.floor(timeout / 500); // Check every 500ms
        
        const checkInterval = setInterval(async () => {
            attempts++;
            
            if (await isSafeAppsSDKAvailable()) {
                clearInterval(checkInterval);
                console.log(`Safe Apps SDK became available after ${attempts} attempts`);
                resolve(true);
            } else if (Date.now() - startTime > timeout) {
                clearInterval(checkInterval);
                console.warn(`Safe Apps SDK not available after ${timeout}ms timeout`);
                resolve(false);
            }
        }, 500);
    });
}

/**
 * Initializes the Safe Apps SDK
 * @returns {Promise<void>}
 */
export async function initSafeApp() {
    if (safeAppsSDK) return;
    
    // Wait for SDK to be available with timeout
    const sdkAvailable = await waitForSafeAppsSDK();
    if (!sdkAvailable) {
        throw new Error('Safe Apps SDK failed to load. This may be due to network restrictions or the app not being loaded in a Safe context.');
    }
    
    try {
        const SafeAppsSDK = await importSafeAppsSDK();
        safeAppsSDK = new SafeAppsSDK();
        safeInfo = await safeAppsSDK.safe.getInfo();
        console.log('Safe App initialized:', safeInfo);
    } catch (error) {
        console.error('Failed to initialize Safe App:', error);
        // Reset state on failure
        safeAppsSDK = null;
        safeInfo = null;
        throw new Error('Failed to connect to Safe. Make sure this app is loaded within a Safe App context.');
    }
}

/**
 * Gets the Safe account address
 * @returns {Promise<string>} Safe address
 */
export async function getSafeAddress() {
    if (!safeInfo) {
        await initSafeApp();
    }
    return safeInfo.safeAddress;
}

/**
 * Gets the Safe chain ID
 * @returns {Promise<string>} Chain ID
 */
export async function getSafeChainId() {
    if (!safeInfo) {
        await initSafeApp();
    }
    return safeInfo.chainId.toString();
}

/**
 * Sends a transaction through the Safe
 * @param {Object} transaction - Transaction object
 * @returns {Promise<string>} Transaction hash
 */
export async function sendSafeTransaction(transaction) {
    if (!safeAppsSDK) {
        throw new Error('Safe App not initialized');
    }
    
    try {
        const result = await safeAppsSDK.txs.send({
            txs: [transaction]
        });
        return result.safeTxHash;
    } catch (error) {
        console.error('Failed to send Safe transaction:', error);
        throw error;
    }
}

/**
 * Makes a read-only call using window.ethereum or fallback to RPC
 * For Safe Apps, we can use the SDK's provider functionality or fallback
 * @param {Object} callData - Call data object
 * @returns {Promise<string>} Call result
 */
export async function callContractViaSafe(callData) {
    // For read calls, we can still use regular JSON-RPC even in Safe context
    // The Safe Apps SDK is primarily for transactions
    return null; // Let the caller handle with regular RPC
}

/**
 * Checks if Safe App is properly initialized
 * @returns {boolean} True if initialized
 */
export function isSafeAppInitialized() {
    return safeAppsSDK !== null && safeInfo !== null;
}