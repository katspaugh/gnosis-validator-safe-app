// Custom hook for contract interactions
import { CONFIG } from '../config.js';
import { getWithdrawableAmount, getTokenBalance, claimWithdrawal } from '../contractService.js';
import { formatEther } from '../utils.js';

const { useState, useEffect, useCallback } = React;

/**
 * Custom hook for managing contract interactions
 * @param {string} account - Connected wallet account
 * @returns {Object} Contract state and interaction functions
 */
export function useContract(account) {
    const [withdrawableAmount, setWithdrawableAmount] = useState('0');
    const [gnoBalance, setGnoBalance] = useState('0');
    const [isLoading, setIsLoading] = useState(false);
    const [isClaiming, setIsClaiming] = useState(false);
    const [error, setError] = useState(null);

    // Fetch contract data
    const fetchData = useCallback(async () => {
        if (!account) return;

        setIsLoading(true);
        setError(null);

        try {
            // Fetch withdrawable amount and GNO balance in parallel
            const [withdrawableResult, gnoBalanceResult] = await Promise.all([
                getWithdrawableAmount(CONFIG.VALIDATOR_CONTRACT_ADDRESS, account).catch(err => {
                    console.error('Failed to fetch withdrawable amount:', err);
                    throw new Error('Failed to fetch withdrawable amount. Please check if you\'re on Gnosis Chain.');
                }),
                getTokenBalance(CONFIG.GNO_TOKEN_ADDRESS, account).catch(err => {
                    console.error('GNO balance call failed:', err);
                    throw new Error('Failed to fetch GNO balance. Please check if you\'re on Gnosis Chain.');
                })
            ]);

            // Format and set results
            setWithdrawableAmount(formatEther(withdrawableResult));
            setGnoBalance(formatEther(gnoBalanceResult));

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [account]);

    // Claim rewards
    const claimRewards = useCallback(async () => {
        if (!account) return { success: false, error: 'No account connected' };

        setIsClaiming(true);
        setError(null);

        try {
            const txHash = await claimWithdrawal(CONFIG.VALIDATOR_CONTRACT_ADDRESS, account);
            
            // Refresh data after a delay
            setTimeout(async () => {
                await fetchData();
            }, 3000);

            return { success: true, txHash };

        } catch (err) {
            const errorMessage = `Failed to claim rewards: ${err.message}`;
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setIsClaiming(false);
        }
    }, [account, fetchData]);

    // Auto-fetch data when account changes
    useEffect(() => {
        if (account) {
            fetchData();
        } else {
            // Reset state when account is disconnected
            setWithdrawableAmount('0');
            setGnoBalance('0');
            setError(null);
        }
    }, [account, fetchData]);

    return {
        withdrawableAmount,
        gnoBalance,
        isLoading,
        isClaiming,
        error,
        fetchData,
        claimRewards,
        hasRewards: parseFloat(withdrawableAmount) > 0
    };
}