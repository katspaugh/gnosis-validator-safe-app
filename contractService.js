// Contract interaction service for Ethereum/Gnosis Chain
import { FUNCTION_SELECTORS } from './config.js';
import { encodeAddress } from './utils.js';

/**
 * Makes a read-only contract call using eth_call
 * @param {string} contractAddress - Contract address to call
 * @param {string} data - Encoded function call data
 * @returns {Promise<string>} Contract call result
 */
export async function callContract(contractAddress, data) {
    try {
        const result = await window.ethereum.request({
            method: 'eth_call',
            params: [{
                to: contractAddress,
                data: data
            }, 'latest']
        });
        return result;
    } catch (error) {
        console.error('Contract call error:', error);
        throw error;
    }
}

/**
 * Sends a transaction to the blockchain
 * @param {string} to - Recipient address
 * @param {string} data - Transaction data
 * @param {string} from - Sender address
 * @returns {Promise<string>} Transaction hash
 */
export async function sendTransaction(to, data, from) {
    try {
        const transactionParameters = {
            to: to,
            from: from,
            data: data,
        };

        const txHash = await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [transactionParameters],
        });

        return txHash;
    } catch (error) {
        console.error('Transaction error:', error);
        throw error;
    }
}

/**
 * Gets withdrawable amount from validator contract
 * @param {string} contractAddress - Validator contract address
 * @param {string} account - User account address
 * @returns {Promise<string>} Withdrawable amount in hex
 */
export async function getWithdrawableAmount(contractAddress, account) {
    const withdrawableData = FUNCTION_SELECTORS['withdrawableAmount(address)'] + encodeAddress(account);
    
    try {
        return await callContract(contractAddress, withdrawableData);
    } catch (error) {
        console.warn('Primary withdrawableAmount call failed, trying alternative:', error);
        // Try alternative function selector
        const altWithdrawableData = FUNCTION_SELECTORS['withdrawableAmount_alt'] + encodeAddress(account);
        return await callContract(contractAddress, altWithdrawableData);
    }
}

/**
 * Gets ERC20 token balance
 * @param {string} tokenAddress - Token contract address
 * @param {string} account - User account address
 * @returns {Promise<string>} Token balance in hex
 */
export async function getTokenBalance(tokenAddress, account) {
    const balanceData = FUNCTION_SELECTORS['balanceOf(address)'] + encodeAddress(account);
    return await callContract(tokenAddress, balanceData);
}

/**
 * Claims withdrawal from validator contract
 * @param {string} contractAddress - Validator contract address
 * @param {string} account - User account address
 * @returns {Promise<string>} Transaction hash
 */
export async function claimWithdrawal(contractAddress, account) {
    let claimData = FUNCTION_SELECTORS['claimWithdrawal(address)'] + encodeAddress(account);
    
    try {
        return await sendTransaction(contractAddress, claimData, account);
    } catch (error) {
        console.warn('Primary claimWithdrawal call failed, trying alternative:', error);
        // Try alternative function selector
        claimData = FUNCTION_SELECTORS['claimWithdrawal_alt'] + encodeAddress(account);
        return await sendTransaction(contractAddress, claimData, account);
    }
}