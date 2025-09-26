// Wallet connection and management service
import { CONFIG } from './config.js';
import { isWalletAvailable } from './utils.js';

/**
 * Checks if wallet is available
 * @returns {boolean} True if wallet is available
 */
export function checkWalletAvailability() {
    return isWalletAvailable();
}

/**
 * Requests account access from the wallet
 * @returns {Promise<string[]>} Array of account addresses
 */
export async function requestAccounts() {
    if (!checkWalletAvailability()) {
        throw new Error('Please install MetaMask or another Ethereum wallet');
    }

    const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
    });

    if (accounts.length === 0) {
        throw new Error('No accounts found');
    }

    return accounts;
}

/**
 * Gets currently connected accounts without requesting permission
 * @returns {Promise<string[]>} Array of account addresses
 */
export async function getAccounts() {
    if (!checkWalletAvailability()) {
        return [];
    }

    try {
        return await window.ethereum.request({
            method: 'eth_accounts'
        });
    } catch (error) {
        console.error('Failed to get accounts:', error);
        return [];
    }
}

/**
 * Switches to Gnosis Chain or adds it if not present
 * @returns {Promise<void>}
 */
export async function switchToGnosisChain() {
    if (!checkWalletAvailability()) {
        throw new Error('Wallet not available');
    }

    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: CONFIG.GNOSIS_CHAIN_ID }],
        });
    } catch (switchError) {
        // If chain doesn't exist, add it
        if (switchError.code === 4902) {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [CONFIG.GNOSIS_CHAIN_CONFIG]
            });
        } else {
            throw switchError;
        }
    }
}

/**
 * Sets up wallet event listeners
 * @param {Function} onAccountsChanged - Callback for account changes
 * @param {Function} onChainChanged - Callback for chain changes
 * @returns {Function} Cleanup function to remove listeners
 */
export function setupWalletEventListeners(onAccountsChanged, onChainChanged) {
    if (!checkWalletAvailability()) {
        return () => {}; // Return empty cleanup function
    }

    const handleAccountsChanged = (accounts) => {
        onAccountsChanged(accounts);
    };

    const handleChainChanged = (chainId) => {
        onChainChanged(chainId);
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    // Return cleanup function
    return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
}