// Main React component for the Gnosis Validator Safe App
import { useWallet } from '../hooks/useWallet.js';
import { useContract } from '../hooks/useContract.js';

const { useState } = React;

/**
 * Main App component
 * @returns {JSX.Element} The main application component
 */
export function App() {
    const { account, isConnecting, connectWallet, isConnected, error: walletError } = useWallet();
    const { 
        withdrawableAmount, 
        gnoBalance, 
        isLoading, 
        isClaiming, 
        error: contractError,
        fetchData, 
        claimRewards,
        hasRewards 
    } = useContract(account);
    
    const [message, setMessage] = useState({ type: '', text: '' });

    // Handle claim rewards with user feedback
    const handleClaimRewards = async () => {
        const result = await claimRewards();
        if (result.success) {
            setMessage({ 
                type: 'success', 
                text: `Transaction submitted! Hash: ${result.txHash}` 
            });
            
            // Update message after delay
            setTimeout(() => {
                setMessage({ 
                    type: 'success', 
                    text: 'Please wait for transaction confirmation. Data will refresh automatically.' 
                });
            }, 3000);
        } else {
            setMessage({ type: 'error', text: result.error });
        }
    };

    // Clear message when wallet connects successfully
    React.useEffect(() => {
        if (isConnected && !walletError) {
            setMessage({ type: '', text: '' });
        }
    }, [isConnected, walletError]);

    // Display error messages
    const displayError = walletError || contractError;
    if (displayError && !message.text) {
        setMessage({ type: 'error', text: displayError });
    }

    return (
        <div className="container">
            <div className="header">
                <h1>Gnosis Validator Safe App</h1>
                <p>Manage your validator rewards on Gnosis Chain</p>
            </div>

            {!isConnected ? (
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
                            onClick={handleClaimRewards}
                            disabled={isClaiming || isLoading || !hasRewards}
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