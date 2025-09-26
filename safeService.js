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
 * Initializes the Safe Apps SDK
 * @returns {Promise<void>}
 */
export async function initSafeApp() {
    if (safeAppsSDK) return;
    
    if (!isSafeAppsSDKAvailable()) {
        throw new Error('Safe Apps SDK not available. Make sure it is loaded.');
    }
    
    try {
        safeAppsSDK = new window.SafeAppsSDK();
        safeInfo = await safeAppsSDK.safe.getInfo();
        console.log('Safe App initialized:', safeInfo);
    } catch (error) {
        console.error('Failed to initialize Safe App:', error);
        throw error;
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