// Main entry point for the Gnosis Validator Safe App
import { CONFIG } from './config.js';
import { isWalletAvailable } from './utils.js';
import { requestAccounts, getAccounts, switchToGnosisChain, setupWalletEventListeners } from './walletService.js';
import { getWithdrawableAmount, getTokenBalance, claimWithdrawal } from './contractService.js';
import { formatEther } from './utils.js';

// Application state
let appState = {
    account: null,
    isConnecting: false,
    withdrawableAmount: '0',
    gnoBalance: '0',
    isLoading: false,
    isClaiming: false,
    message: { type: '', text: '' }
};

// DOM elements
let rootElement;
let connectButton;
let refreshButton;
let claimButton;

// Initialize the application
async function initApp() {
    rootElement = document.getElementById('root');
    
    // Check if already connected
    try {
        const accounts = await getAccounts();
        if (accounts.length > 0) {
            appState.account = accounts[0];
            await fetchContractData();
        }
    } catch (error) {
        console.warn('Failed to check existing connection:', error);
    }
    
    render();
    setupWalletListeners();
}

// Set up wallet event listeners
function setupWalletListeners() {
    if (!isWalletAvailable()) return;
    
    setupWalletEventListeners(
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
}

// Connect wallet
async function connectWallet() {
    if (!isWalletAvailable()) {
        showMessage('error', 'MetaMask or compatible wallet not found. Please install a Web3 wallet.');
        return;
    }
    
    appState.isConnecting = true;
    render();
    
    try {
        const accounts = await requestAccounts();
        appState.account = accounts[0];
        await switchToGnosisChain();
        await fetchContractData();
        showMessage('success', 'Wallet connected successfully!');
    } catch (error) {
        showMessage('error', `Failed to connect wallet: ${error.message}`);
        appState.account = null;
    } finally {
        appState.isConnecting = false;
        render();
    }
}

// Fetch contract data
async function fetchContractData() {
    if (!appState.account) return;
    
    appState.isLoading = true;
    render();
    
    try {
        const [withdrawableResult, gnoBalanceResult] = await Promise.all([
            getWithdrawableAmount(CONFIG.VALIDATOR_CONTRACT_ADDRESS, appState.account),
            getTokenBalance(CONFIG.GNO_TOKEN_ADDRESS, appState.account)
        ]);
        
        appState.withdrawableAmount = formatEther(withdrawableResult);
        appState.gnoBalance = formatEther(gnoBalanceResult);
        
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
                    <div class="network-status">✅ Gnosis Chain</div>
                </div>

                <div class="card">
                    <div class="label">Rewards to Date</div>
                    <div class="balance ${appState.isLoading ? 'loading' : ''}">
                        ${appState.isLoading ? 'Loading...' : `${parseFloat(appState.withdrawableAmount).toFixed(6)} ETH`}
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
                    <button id="refresh-button" class="button" ${appState.isLoading ? 'disabled' : ''} style="background: #805ad5">
                        ${appState.isLoading ? 'Refreshing...' : 'Refresh Data'}
                    </button>
                </div>
            `}

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
    
    if (connectButton) {
        connectButton.addEventListener('click', connectWallet);
    }
    
    if (refreshButton) {
        refreshButton.addEventListener('click', fetchContractData);
    }
    
    if (claimButton) {
        claimButton.addEventListener('click', claimRewards);
    }
}

// Start the application when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}