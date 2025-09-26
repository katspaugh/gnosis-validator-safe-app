// Utility functions for the Gnosis Validator Safe App

/**
 * Converts wei value to ether with proper formatting
 * @param {string} value - Hex string representing wei value
 * @returns {string} Formatted ether value with 6 decimal places
 */
export function formatEther(value) {
    // Handle invalid, empty, or null values
    if (!value || value === '0x' || value === null || value === undefined) {
        return '0.000000';
    }
    
    const parsed = parseInt(value, 16);
    
    // Handle cases where parseInt returns NaN
    if (isNaN(parsed)) {
        return '0.000000';
    }
    
    return (parsed / Math.pow(10, 18)).toFixed(6);
}

/**
 * Encodes an Ethereum address for contract function calls
 * @param {string} address - Ethereum address
 * @returns {string} Encoded address padded to 64 characters
 */
export function encodeAddress(address) {
    return address.toLowerCase().replace('0x', '').padStart(64, '0');
}

/**
 * Checks if window.ethereum is available
 * @returns {boolean} True if wallet is available
 */
export function isWalletAvailable() {
    return typeof window.ethereum !== 'undefined';
}

/**
 * Validates an Ethereum address format
 * @param {string} address - Address to validate
 * @returns {boolean} True if address format is valid
 */
export function isValidAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Detects if the app is running inside an iframe (Safe App context)
 * @returns {boolean} True if running in iframe
 */
export function isInIframe() {
    try {
        // Updated iframe detection logic as suggested
        return typeof top !== 'undefined' && window !== top;
    } catch (e) {
        // If we can't access window.top due to cross-origin restrictions,
        // we're likely in an iframe
        return true;
    }
}