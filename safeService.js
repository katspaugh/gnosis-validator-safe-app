// Safe Apps SDK service for handling Safe App functionality

let safeAppsSDK = null;
let safeInfo = null;

/**
 * Checks if Safe Apps SDK is available
 * @returns {boolean} True if SDK is available
 */
function isSafeAppsSDKAvailable() {
    return typeof window !== 'undefined' && window.SafeAppsSDK;
}

/**
 * Waits for Safe Apps SDK to load with timeout
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<boolean>} True if SDK loaded successfully
 */
function waitForSafeAppsSDK(timeout = 5000) {
    return new Promise((resolve) => {
        if (isSafeAppsSDKAvailable()) {
            resolve(true);
            return;
        }

        const startTime = Date.now();
        const checkInterval = setInterval(() => {
            if (isSafeAppsSDKAvailable()) {
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
    
    // Wait for SDK to load with timeout
    const sdkLoaded = await waitForSafeAppsSDK();
    if (!sdkLoaded) {
        throw new Error('Safe Apps SDK failed to load. This may be due to network restrictions or the app not being loaded in a Safe context.');
    }
    
    try {
        safeAppsSDK = new window.SafeAppsSDK();
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