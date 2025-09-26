// Custom hook for wallet state management
import { requestAccounts, getAccounts, switchToGnosisChain, setupWalletEventListeners } from '../walletService.js';

const { useState, useEffect, useCallback } = React;

/**
 * Custom hook for managing wallet connection state
 * @returns {Object} Wallet state and connection functions
 */
export function useWallet() {
    const [account, setAccount] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState(null);

    // Connect to wallet
    const connectWallet = useCallback(async () => {
        setIsConnecting(true);
        setError(null);

        try {
            const accounts = await requestAccounts();
            setAccount(accounts[0]);
            await switchToGnosisChain();
        } catch (err) {
            setError(`Failed to connect wallet: ${err.message}`);
        } finally {
            setIsConnecting(false);
        }
    }, []);

    // Disconnect wallet
    const disconnectWallet = useCallback(() => {
        setAccount(null);
        setError(null);
    }, []);

    // Check if already connected on mount
    useEffect(() => {
        const checkConnection = async () => {
            const accounts = await getAccounts();
            if (accounts.length > 0) {
                setAccount(accounts[0]);
            }
        };

        checkConnection();
    }, []);

    // Set up wallet event listeners
    useEffect(() => {
        const cleanup = setupWalletEventListeners(
            (accounts) => {
                if (accounts.length === 0) {
                    disconnectWallet();
                } else {
                    setAccount(accounts[0]);
                    setError(null);
                }
            },
            () => {
                // Refresh page on chain change
                window.location.reload();
            }
        );

        return cleanup;
    }, [disconnectWallet]);

    return {
        account,
        isConnecting,
        error,
        connectWallet,
        disconnectWallet,
        isConnected: !!account
    };
}