// Utility functions for the Gnosis Validator Safe App

/**
 * Converts wei value to ether with proper formatting
 * @param {string} value - Hex string representing wei value
 * @returns {string} Formatted ether value with 6 decimal places
 */
export function formatEther(value) {
    return (parseInt(value, 16) / Math.pow(10, 18)).toFixed(6);
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