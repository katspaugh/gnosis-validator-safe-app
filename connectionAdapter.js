// Connection adapter that handles both wallet and Safe App contexts
import { isInIframe } from './utils.js';
import { 
    requestAccounts, 
    getAccounts, 
    switchToGnosisChain, 
    setupWalletEventListeners,
    checkWalletAvailability 
} from './walletService.js';
import { 
    initSafeApp, 
    getSafeAddress, 
    getSafeChainId, 
    sendSafeTransaction,
    callContractViaSafe,
    isSafeAppInitialized 
} from './safeService.js';

let connectionType = null; // 'wallet' or 'safe'
let safeAppInitialized = false;

/**
 * Determines the connection type based on context and SDK availability
 * @returns {Promise<string>} 'safe' if in iframe and SDK available, 'wallet' otherwise
 */
export async function getConnectionType() {
    if (connectionType === null) {
        const inIframe = isInIframe();
        console.log('Connection type detection:', { inIframe });
        
        if (inIframe) {
            console.log('Detected iframe context, attempting Safe App initialization...');
            // If in iframe, try to initialize Safe App
            try {
                await initSafeApp();
                connectionType = 'safe';
                safeAppInitialized = true;
                console.log('✅ Safe App initialization successful - using Safe mode');
            } catch (error) {
                console.warn('❌ Safe App initialization failed, falling back to wallet mode:', error);
                connectionType = 'wallet';
                safeAppInitialized = false;
            }
        } else {
            console.log('Not in iframe context - using wallet mode');
            connectionType = 'wallet';
        }
    }
    
    console.log('Final connection type:', connectionType);
    return connectionType;
}

/**
 * Initializes the appropriate connection method
 * @returns {Promise<void>}
 */
export async function initConnection() {
    // This will determine and cache the connection type
    await getConnectionType();
}

/**
 * Checks if connection is available
 * @returns {Promise<boolean>} True if connection method is available
 */
export async function isConnectionAvailable() {
    const type = await getConnectionType();
    
    if (type === 'safe') {
        return safeAppInitialized;
    } else {
        return checkWalletAvailability();
    }
}

/**
 * Requests account access
 * @returns {Promise<string[]>} Array of account addresses
 */
export async function requestAccountAccess() {
    const type = await getConnectionType();
    
    if (type === 'safe') {
        if (!safeAppInitialized) {
            throw new Error('Safe App not properly initialized');
        }
        const safeAddress = await getSafeAddress();
        return [safeAddress];
    } else {
        return await requestAccounts();
    }
}

/**
 * Gets currently connected accounts without requesting permission
 * @returns {Promise<string[]>} Array of account addresses
 */
export async function getConnectedAccounts() {
    const type = await getConnectionType();
    
    if (type === 'safe') {
        if (safeAppInitialized && isSafeAppInitialized()) {
            const safeAddress = await getSafeAddress();
            return [safeAddress];
        }
        return [];
    } else {
        return await getAccounts();
    }
}

/**
 * Switches to Gnosis Chain (only relevant for wallet connections)
 * @returns {Promise<void>}
 */
export async function ensureGnosisChain() {
    const type = await getConnectionType();
    
    if (type === 'safe') {
        // For Safe Apps, verify we're on Gnosis Chain
        const chainId = await getSafeChainId();
        if (chainId !== '100') {
            throw new Error(`Safe is on chain ${chainId}, but this app requires Gnosis Chain (100)`);
        }
    } else {
        await switchToGnosisChain();
    }
}

/**
 * Sets up connection event listeners
 * @param {Function} onAccountsChanged - Callback for account changes
 * @param {Function} onChainChanged - Callback for chain changes
 * @returns {Function} Cleanup function
 */
export async function setupConnectionListeners(onAccountsChanged, onChainChanged) {
    const type = await getConnectionType();
    
    if (type === 'safe') {
        // Safe Apps don't have account/chain change events in the same way
        // The Safe address and chain are fixed for the session
        return () => {}; // Return empty cleanup function
    } else {
        return setupWalletEventListeners(onAccountsChanged, onChainChanged);
    }
}

/**
 * Makes a read-only contract call
 * @param {string} contractAddress - Contract address
 * @param {string} data - Encoded call data
 * @returns {Promise<string>} Call result
 */
export async function makeContractCall(contractAddress, data) {
    const type = await getConnectionType();
    
    const callData = {
        to: contractAddress,
        data: data
    };
    
    if (type === 'safe') {
        return await callContractViaSafe(callData);
    } else {
        // For wallet connections, we'll delegate to the existing contract service
        // which handles both wallet and direct RPC calls
        return null; // Signal to use existing fallback logic
    }
}

/**
 * Sends a transaction
 * @param {string} to - Recipient address
 * @param {string} data - Transaction data
 * @param {string} from - Sender address (used for wallet connections)
 * @returns {Promise<string>} Transaction hash
 */
export async function sendTransaction(to, data, from) {
    const type = await getConnectionType();
    
    if (type === 'safe') {
        const transaction = {
            to: to,
            value: '0',
            data: data
        };
        return await sendSafeTransaction(transaction);
    } else {
        // For wallet connections, we'll delegate to the existing contract service
        return null; // Signal to use existing wallet transaction logic
    }
}

/**
 * Gets a human-readable connection status
 * @returns {Promise<string>} Connection status description
 */
export async function getConnectionStatus() {
    const type = await getConnectionType();
    
    if (type === 'safe') {
        return 'Safe App';
    } else {
        return 'External Wallet';
    }
}