// Main entry point for the Gnosis Validator Safe App
import { CONFIG } from './config.js';
import { isValidAddress, formatEther } from './utils.js';
import { 
    initConnection,
    isConnectionAvailable,
    requestAccountAccess,
    getConnectedAccounts,
    ensureGnosisChain,
    setupConnectionListeners,
    getConnectionStatus 
} from './connectionAdapter.js';
import { getWithdrawableAmount, getTokenBalance, claimWithdrawal, getValidatorCount } from './contractService.js';

// Application state
let appState = {
    account: null,
    isConnecting: false,
    withdrawableAmount: '0',
    gnoBalance: '0',
    validatorCount: 0,
    isLoading: false,
    isClaiming: false,
    message: { type: '', text: '' },
    connectionStatus: '', // Cache connection status
    // Address lookup functionality
    lookupAddress: '',
    lookupWithdrawableAmount: '0',
    lookupGnoBalance: '0',
    lookupValidatorCount: 0,
    isLookupLoading: false
};

// DOM elements
let rootElement;
let connectButton;
let refreshButton;
let claimButton;

// Initialize the application
async function initApp() {
    rootElement = document.getElementById('root');
    
    try {
        // Initialize the connection (Safe App or wallet)
        await initConnection();
        
        // Cache connection status
        appState.connectionStatus = await getConnectionStatus();
        
        // Check if already connected
        const accounts = await getConnectedAccounts();
        if (accounts.length > 0) {
            appState.account = accounts[0];
            await fetchContractData();
        }
    } catch (error) {
        console.warn('Failed to initialize connection or check existing accounts:', error);
    }
    
    render();
    await setupWalletListeners();
}

// Set up wallet event listeners
async function setupWalletListeners() {
    const cleanup = await setupConnectionListeners(
        (accounts) => {
            if (accounts.length === 0) {
                appState.account = null;
            } else {
                appState.account = accounts[0];
                fetchContractData();
            }
            render();
        },
        () => {
            // Refresh page on chain change
            window.location.reload();
        }
    );
    
    // Store cleanup function if needed
    window.cleanupConnectionListeners = cleanup;
}

// Connect wallet
async function connectWallet() {
    const connectionAvailable = await isConnectionAvailable();
    if (!connectionAvailable) {
        showMessage('error', 'Connection method not available. Please install a Web3 wallet or ensure Safe App context.');
        return;
    }
    
    appState.isConnecting = true;
    render();
    
    try {
        const accounts = await requestAccountAccess();
        appState.account = accounts[0];
        await ensureGnosisChain();
        await fetchContractData();
        
        appState.connectionStatus = await getConnectionStatus();
        showMessage('success', `Connected successfully via ${appState.connectionStatus}!`);
    } catch (error) {
        showMessage('error', `Failed to connect: ${error.message}`);
        appState.account = null;
        appState.connectionStatus = '';
    } finally {
        appState.isConnecting = false;
        render();
    }
}

// Fetch contract data for any address
async function fetchAddressData(address) {
    if (!address || !isValidAddress(address)) {
        showMessage('error', 'Please enter a valid Ethereum address');
        return;
    }
    
    appState.isLookupLoading = true;
    render();
    
    try {
        const [withdrawableResult, gnoBalanceResult, validatorCountResult] = await Promise.all([
            getWithdrawableAmount(CONFIG.VALIDATOR_CONTRACT_ADDRESS, address),
            getTokenBalance(CONFIG.GNO_TOKEN_ADDRESS, address),
            getValidatorCount(address)
        ]);
        
        appState.lookupWithdrawableAmount = formatEther(withdrawableResult);
        appState.lookupGnoBalance = formatEther(gnoBalanceResult);
        appState.lookupValidatorCount = validatorCountResult;
        
    } catch (error) {
        showMessage('error', `Failed to fetch data for address: ${error.message}`);
    } finally {
        appState.isLookupLoading = false;
        render();
    }
}

// Fetch contract data
async function fetchContractData() {
    if (!appState.account) return;
    
    appState.isLoading = true;
    render();
    
    try {
        const [withdrawableResult, gnoBalanceResult, validatorCountResult] = await Promise.all([
            getWithdrawableAmount(CONFIG.VALIDATOR_CONTRACT_ADDRESS, appState.account),
            getTokenBalance(CONFIG.GNO_TOKEN_ADDRESS, appState.account),
            getValidatorCount(appState.account)
        ]);
        
        appState.withdrawableAmount = formatEther(withdrawableResult);
        appState.gnoBalance = formatEther(gnoBalanceResult);
        appState.validatorCount = validatorCountResult;
        
    } catch (error) {
        showMessage('error', `Failed to fetch data: ${error.message}`);
    } finally {
        appState.isLoading = false;
        render();
    }
}

// Claim rewards
async function claimRewards() {
    if (!appState.account) return;
    
    appState.isClaiming = true;
    render();
    
    try {
        const txHash = await claimWithdrawal(CONFIG.VALIDATOR_CONTRACT_ADDRESS, appState.account);
        showMessage('success', `Transaction submitted! Hash: ${txHash}`);
        
        // Refresh data after claiming
        setTimeout(() => {
            fetchContractData();
        }, 5000);
        
    } catch (error) {
        showMessage('error', `Failed to claim rewards: ${error.message}`);
    } finally {
        appState.isClaiming = false;
        render();
    }
}

// Show message
function showMessage(type, text) {
    appState.message = { type, text };
    render();
    
    // Clear message after 10 seconds
    setTimeout(() => {
        if (appState.message.text === text) {
            appState.message = { type: '', text: '' };
            render();
        }
    }, 10000);
}

// Render the application
function render() {
    const isConnected = !!appState.account;
    const hasRewards = parseFloat(appState.withdrawableAmount) > 0;
    
    rootElement.innerHTML = `
        <div class="container">
            <div class="header">
                <h1>Gnosis Validator Safe App</h1>
                <p>Manage your validator rewards on Gnosis Chain</p>
            </div>

            ${!isConnected ? `
                <div class="card">
                    <h2>Connect Your Wallet</h2>
                    <p>Connect your wallet to view and claim your validator rewards.</p>
                    <button id="connect-button" class="button connect-button" ${appState.isConnecting ? 'disabled' : ''}>
                        ${appState.isConnecting ? 'Connecting...' : 'Connect Wallet'}
                    </button>
                </div>
            ` : `
                <div class="card">
                    <div class="label">Connected Account</div>
                    <div class="address">${appState.account}</div>
                    <div class="network-status">✅ Gnosis Chain${appState.connectionStatus ? ` (${appState.connectionStatus})` : ''}</div>
                </div>

                <div class="card">
                    <div class="label">Rewards to Date</div>
                    <div class="balance ${appState.isLoading ? 'loading' : ''}">
                        ${appState.isLoading ? 'Loading...' : `${parseFloat(appState.withdrawableAmount).toFixed(6)} GNO`}
                    </div>
                    <button id="claim-button" class="button" ${appState.isClaiming || appState.isLoading || !hasRewards ? 'disabled' : ''}>
                        ${appState.isClaiming ? 'Claiming...' : 'Claim Rewards'}
                    </button>
                </div>

                <div class="card">
                    <div class="label">GNO Token Balance</div>
                    <div class="balance ${appState.isLoading ? 'loading' : ''}">
                        ${appState.isLoading ? 'Loading...' : `${parseFloat(appState.gnoBalance).toFixed(6)} GNO`}
                    </div>
                </div>

                <div class="card">
                    <div class="label">Validators Staked</div>
                    <div class="balance ${appState.isLoading ? 'loading' : ''}">
                        ${appState.isLoading ? 'Loading...' : `${appState.validatorCount} GNO`}
                    </div>
                </div>

                <div class="card">
                    <button id="refresh-button" class="button" ${appState.isLoading ? 'disabled' : ''} style="background: #805ad5">
                        ${appState.isLoading ? 'Refreshing...' : 'Refresh Data'}
                    </button>
                </div>
            `}

            <!-- Address Lookup Section -->
            <div class="card">
                <h2>Check Any Address</h2>
                <p>Enter any Ethereum address to check its validator rewards and GNO balance.</p>
                <div style="margin-bottom: 16px;">
                    <input 
                        type="text" 
                        id="address-input" 
                        placeholder="0x..." 
                        value="${appState.lookupAddress}"
                        style="width: 100%; padding: 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-family: 'Monaco', 'Menlo', monospace; font-size: 14px;"
                        ${appState.isLookupLoading ? 'disabled' : ''}
                    />
                </div>
                <button 
                    id="lookup-button" 
                    class="button" 
                    ${appState.isLookupLoading || !appState.lookupAddress ? 'disabled' : ''}
                    style="background: #48bb78; margin-bottom: 16px;"
                >
                    ${appState.isLookupLoading ? 'Checking...' : 'Check Address'}
                </button>
                
                ${appState.lookupAddress && (appState.lookupWithdrawableAmount !== '0' || appState.lookupGnoBalance !== '0' || appState.lookupValidatorCount > 0) ? `
                    <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 16px;">
                        <div class="label">Address: ${appState.lookupAddress}</div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-top: 12px;">
                            <div>
                                <div class="label" style="font-size: 12px;">Validator Rewards</div>
                                <div class="balance ${appState.isLookupLoading ? 'loading' : ''}" style="font-size: 18px;">
                                    ${appState.isLookupLoading ? 'Loading...' : `${parseFloat(appState.lookupWithdrawableAmount).toFixed(6)} GNO`}
                                </div>
                            </div>
                            <div>
                                <div class="label" style="font-size: 12px;">GNO Balance</div>
                                <div class="balance ${appState.isLookupLoading ? 'loading' : ''}" style="font-size: 18px;">
                                    ${appState.isLookupLoading ? 'Loading...' : `${parseFloat(appState.lookupGnoBalance).toFixed(6)} GNO`}
                                </div>
                            </div>
                            <div>
                                <div class="label" style="font-size: 12px;">Validators Staked</div>
                                <div class="balance ${appState.isLookupLoading ? 'loading' : ''}" style="font-size: 18px;">
                                    ${appState.isLookupLoading ? 'Loading...' : `${appState.lookupValidatorCount} GNO`}
                                </div>
                            </div>
                        </div>
                    </div>
                ` : ''}
            </div>

            ${appState.message.text ? `
                <div class="${appState.message.type}">
                    ${appState.message.text}
                </div>
            ` : ''}
        </div>
    `;
    
    // Add event listeners
    setupEventListeners();
}

// Set up event listeners for buttons
function setupEventListeners() {
    connectButton = document.getElementById('connect-button');
    refreshButton = document.getElementById('refresh-button');
    claimButton = document.getElementById('claim-button');
    const addressInput = document.getElementById('address-input');
    const lookupButton = document.getElementById('lookup-button');
    
    if (connectButton) {
        connectButton.addEventListener('click', connectWallet);
    }
    
    if (refreshButton) {
        refreshButton.addEventListener('click', fetchContractData);
    }
    
    if (claimButton) {
        claimButton.addEventListener('click', claimRewards);
    }
    
    if (addressInput) {
        addressInput.addEventListener('input', (e) => {
            appState.lookupAddress = e.target.value.trim();
            render();
        });
        
        // Allow Enter key to trigger lookup
        addressInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && appState.lookupAddress && !appState.isLookupLoading) {
                fetchAddressData(appState.lookupAddress);
            }
        });
    }
    
    if (lookupButton) {
        lookupButton.addEventListener('click', () => {
            if (appState.lookupAddress && !appState.isLookupLoading) {
                fetchAddressData(appState.lookupAddress);
            }
        });
    }
}

// Start the application when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}