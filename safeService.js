// Safe Apps SDK service for handling Safe App functionality

let safeAppsSDK = null;
let safeInfo = null;

/**
 * Dynamically imports the Safe Apps SDK
 * @returns {Promise<any>} Safe Apps SDK class
 */
async function importSafeAppsSDK() {
    try {
        // Try to import from CDN using ESM
        const module = await import('https://unpkg.com/@safe-global/safe-apps-sdk@9.1.0/dist/esm/index.js');
        return module.default || module.SafeAppsSDK || module;
    } catch (error) {
        console.warn('Failed to import Safe Apps SDK from CDN:', error);
        
        // Fallback: check if globally available (for environments that load it differently)
        if (typeof window !== 'undefined' && window.SafeAppsSDK) {
            return window.SafeAppsSDK;
        }
        
        throw new Error('Safe Apps SDK not available');
    }
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
 * Waits for Safe Apps SDK to be available with timeout
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<boolean>} True if SDK became available
 */
function waitForSafeAppsSDK(timeout = 5000) {
    return new Promise(async (resolve) => {
        if (await isSafeAppsSDKAvailable()) {
            resolve(true);
            return;
        }

        const startTime = Date.now();
        const checkInterval = setInterval(async () => {
            if (await isSafeAppsSDKAvailable()) {
                clearInterval(checkInterval);
                resolve(true);
            } else if (Date.now() - startTime > timeout) {
                clearInterval(checkInterval);
                resolve(false);
            }
        }, 100);
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