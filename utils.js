// Utility functions for the Gnosis Validator Safe App

/**
 * Converts wei value to ether with proper formatting
 * @param {string} value - Hex string representing wei value
 * @returns {string} Formatted ether value with 6 decimal places
 */
export function formatEther(value) {
    // Handle null, undefined, or empty values
    if (!value || value === '0x' || value === '0x0') {
        return '0.000000';
    }
    
    try {
        // Convert hex to decimal, handling both '0x' prefixed and plain hex strings
        const hexValue = value.startsWith('0x') ? value : '0x' + value;
        const decimalValue = parseInt(hexValue, 16);
        
        // Check if conversion was successful
        if (isNaN(decimalValue)) {
            console.warn('formatEther: Invalid hex value received:', value);
            return '0.000000';
        }
        
        // Convert from wei to ether (divide by 10^18)
        const etherValue = decimalValue / Math.pow(10, 18);
        
        // Check if result is valid
        if (isNaN(etherValue) || !isFinite(etherValue)) {
            console.warn('formatEther: Invalid ether value calculated from:', value);
            return '0.000000';
        }
        
        return etherValue.toFixed(6);
    } catch (error) {
        console.error('formatEther: Error processing value:', value, error);
        return '0.000000';
    }
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