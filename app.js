// Configuration
const VALIDATOR_CONTRACT_ADDRESS = '0x0b98057ea310f4d31f2a452b414647007d1645d9';
const GNO_TOKEN_ADDRESS = '0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb';
const GNOSIS_CHAIN_ID = '0x64'; // 100 in hex
const GNOSIS_RPC_URL = 'https://rpc.gnosischain.com/';

// Known function selectors for common functions
const FUNCTION_SELECTORS = {
    'withdrawableAmount(address)': '0xf3fef3a3',
    'balanceOf(address)': '0x70a08231',
    'claimWithdrawal(address)': '0x4782f779',
    'withdrawableAmount_alt': '0x1ac51b98',
    'claimWithdrawal_alt': '0x5cc4aa9f'
};

// Utility functions
function formatEther(value) {
    return (parseInt(value, 16) / Math.pow(10, 18)).toFixed(6);
}

function encodeAddress(address) {
    return address.toLowerCase().replace('0x', '').padStart(64, '0');
}

// Contract interaction functions
async function callContract(contractAddress, data) {
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

async function sendTransaction(to, data, from) {
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

// React Components
const { useState, useEffect, useCallback } = React;

function App() {
    const [account, setAccount] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [withdrawableAmount, setWithdrawableAmount] = useState('0');
    const [gnoBalance, setGnoBalance] = useState('0');
    const [isLoading, setIsLoading] = useState(false);
    const [isClaiming, setIsClaiming] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Connect to wallet
    const connectWallet = useCallback(async () => {
        if (!window.ethereum) {
            setMessage({ type: 'error', text: 'Please install MetaMask or another Ethereum wallet' });
            return;
        }

        setIsConnecting(true);
        setMessage({ type: '', text: '' });

        try {
            // Request account access
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (accounts.length === 0) {
                throw new Error('No accounts found');
            }

            setAccount(accounts[0]);

            // Switch to Gnosis Chain
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: GNOSIS_CHAIN_ID }],
                });
            } catch (switchError) {
                // If chain doesn't exist, add it
                if (switchError.code === 4902) {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: GNOSIS_CHAIN_ID,
                            chainName: 'Gnosis Chain',
                            nativeCurrency: {
                                name: 'xDAI',
                                symbol: 'XDAI',
                                decimals: 18
                            },
                            rpcUrls: [GNOSIS_RPC_URL],
                            blockExplorerUrls: ['https://gnosisscan.io/']
                        }]
                    });
                } else {
                    throw switchError;
                }
            }

        } catch (error) {
            setMessage({ type: 'error', text: `Failed to connect wallet: ${error.message}` });
        } finally {
            setIsConnecting(false);
        }
    }, []);

    // Fetch withdrawable amount and GNO balance
    const fetchData = useCallback(async () => {
        if (!account) return;

        setIsLoading(true);
        setMessage({ type: '', text: '' });

        try {
            // Create function calls with correct function selectors
            const withdrawableData = FUNCTION_SELECTORS['withdrawableAmount(address)'] + encodeAddress(account);
            const balanceData = FUNCTION_SELECTORS['balanceOf(address)'] + encodeAddress(account);

            // Make contract calls with error handling for each
            let withdrawableResult, gnoBalanceResult;
            
            try {
                withdrawableResult = await callContract(VALIDATOR_CONTRACT_ADDRESS, withdrawableData);
            } catch (error) {
                console.warn('Primary withdrawableAmount call failed, trying alternative:', error);
                // Try alternative function selector
                const altWithdrawableData = FUNCTION_SELECTORS['withdrawableAmount_alt'] + encodeAddress(account);
                withdrawableResult = await callContract(VALIDATOR_CONTRACT_ADDRESS, altWithdrawableData);
            }

            try {
                gnoBalanceResult = await callContract(GNO_TOKEN_ADDRESS, balanceData);
            } catch (error) {
                console.error('GNO balance call failed:', error);
                throw new Error('Failed to fetch GNO balance. Please check if you\'re on Gnosis Chain.');
            }

            // Format and display results
            const withdrawableEth = formatEther(withdrawableResult);
            const gnoBalanceFormatted = formatEther(gnoBalanceResult);

            setWithdrawableAmount(withdrawableEth);
            setGnoBalance(gnoBalanceFormatted);

        } catch (error) {
            setMessage({ type: 'error', text: `Failed to fetch data: ${error.message}` });
        } finally {
            setIsLoading(false);
        }
    }, [account]);

    // Claim rewards
    const claimRewards = useCallback(async () => {
        if (!account) return;

        setIsClaiming(true);
        setMessage({ type: '', text: '' });

        try {
            let claimData = FUNCTION_SELECTORS['claimWithdrawal(address)'] + encodeAddress(account);
            let txHash;

            try {
                txHash = await sendTransaction(VALIDATOR_CONTRACT_ADDRESS, claimData, account);
            } catch (error) {
                console.warn('Primary claimWithdrawal call failed, trying alternative:', error);
                // Try alternative function selector
                claimData = FUNCTION_SELECTORS['claimWithdrawal_alt'] + encodeAddress(account);
                txHash = await sendTransaction(VALIDATOR_CONTRACT_ADDRESS, claimData, account);
            }
            
            setMessage({ type: 'success', text: `Transaction submitted! Hash: ${txHash}` });

            // Refresh data after a delay
            setTimeout(async () => {
                await fetchData();
                setMessage({ type: 'success', text: 'Please wait for transaction confirmation. Data will refresh automatically.' });
            }, 3000);

        } catch (error) {
            setMessage({ type: 'error', text: `Failed to claim rewards: ${error.message}` });
        } finally {
            setIsClaiming(false);
        }
    }, [account, fetchData]);

    // Effect to fetch data when account changes
    useEffect(() => {
        if (account) {
            fetchData();
        }
    }, [account, fetchData]);

    // Listen for account changes
    useEffect(() => {
        if (!window.ethereum) return;

        const handleAccountsChanged = (accounts) => {
            if (accounts.length === 0) {
                setAccount(null);
                setWithdrawableAmount('0');
                setGnoBalance('0');
                setMessage({ type: '', text: '' });
            } else {
                setAccount(accounts[0]);
            }
        };

        const handleChainChanged = () => {
            window.location.reload();
        };

        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);

        return () => {
            window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
            window.ethereum.removeListener('chainChanged', handleChainChanged);
        };
    }, []);

    // Check if already connected on page load
    useEffect(() => {
        const checkConnection = async () => {
            if (window.ethereum) {
                try {
                    const accounts = await window.ethereum.request({
                        method: 'eth_accounts'
                    });
                    
                    if (accounts.length > 0) {
                        setAccount(accounts[0]);
                    }
                } catch (error) {
                    console.error('Failed to check connection:', error);
                }
            }
        };

        checkConnection();
    }, []);

    return (
        <div className="container">
            <div className="header">
                <h1>Gnosis Validator Safe App</h1>
                <p>Manage your validator rewards on Gnosis Chain</p>
            </div>

            {!account ? (
                <div className="card">
                    <h2>Connect Your Wallet</h2>
                    <p>Connect your wallet to view and claim your validator rewards.</p>
                    <button 
                        className="button connect-button" 
                        onClick={connectWallet}
                        disabled={isConnecting}
                    >
                        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                    </button>
                </div>
            ) : (
                <>
                    <div className="card">
                        <div className="label">Connected Account</div>
                        <div className="address">{account}</div>
                        <div className="network-status">✅ Gnosis Chain</div>
                    </div>

                    <div className="card">
                        <div className="label">Rewards to Date</div>
                        <div className={`balance ${isLoading ? 'loading' : ''}`}>
                            {isLoading ? 'Loading...' : `${parseFloat(withdrawableAmount).toFixed(6)} ETH`}
                        </div>
                        <button 
                            className="button"
                            onClick={claimRewards}
                            disabled={isClaiming || isLoading || parseFloat(withdrawableAmount) === 0}
                        >
                            {isClaiming ? 'Claiming...' : 'Claim Rewards'}
                        </button>
                    </div>

                    <div className="card">
                        <div className="label">GNO Token Balance</div>
                        <div className={`balance ${isLoading ? 'loading' : ''}`}>
                            {isLoading ? 'Loading...' : `${parseFloat(gnoBalance).toFixed(6)} GNO`}
                        </div>
                    </div>

                    <div className="card">
                        <button 
                            className="button" 
                            onClick={fetchData}
                            disabled={isLoading}
                            style={{background: '#805ad5'}}
                        >
                            {isLoading ? 'Refreshing...' : 'Refresh Data'}
                        </button>
                    </div>
                </>
            )}

            {message.text && (
                <div className={message.type}>
                    {message.text}
                </div>
            )}
        </div>
    );
}

// Render the app
ReactDOM.render(<App />, document.getElementById('root'));