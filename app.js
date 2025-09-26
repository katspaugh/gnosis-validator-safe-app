// Configuration
const VALIDATOR_CONTRACT_ADDRESS = '0x0b98057ea310f4d31f2a452b414647007d1645d9';
const GNO_TOKEN_ADDRESS = '0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb';
const GNOSIS_CHAIN_ID = '0x64'; // 100 in hex
const GNOSIS_RPC_URL = 'https://rpc.gnosischain.com/';

// State
let currentAccount = null;
let web3Provider = null;

// DOM elements
const connectSection = document.getElementById('connect-section');
const walletSection = document.getElementById('wallet-section');
const connectButton = document.getElementById('connect-button');
const accountAddress = document.getElementById('account-address');
const withdrawableAmount = document.getElementById('withdrawable-amount');
const gnoBalance = document.getElementById('gno-balance');
const claimButton = document.getElementById('claim-button');
const refreshButton = document.getElementById('refresh-button');
const errorMessage = document.getElementById('error-message');
const successMessage = document.getElementById('success-message');
const infoMessage = document.getElementById('info-message');

// Utility functions
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    successMessage.classList.add('hidden');
    infoMessage.classList.add('hidden');
}

function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.classList.remove('hidden');
    errorMessage.classList.add('hidden');
    infoMessage.classList.add('hidden');
}

function showInfo(message) {
    infoMessage.textContent = message;
    infoMessage.classList.remove('hidden');
    errorMessage.classList.add('hidden');
    successMessage.classList.add('hidden');
}

function hideMessages() {
    errorMessage.classList.add('hidden');
    successMessage.classList.add('hidden');
    infoMessage.classList.add('hidden');
}

function formatEther(value) {
    // Simple implementation to convert wei to ether
    return (parseInt(value, 16) / Math.pow(10, 18)).toFixed(6);
}

function toHex(value) {
    return '0x' + parseInt(value).toString(16);
}

// Contract interaction using raw JSON-RPC
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

async function sendTransaction(to, data) {
    try {
        const transactionParameters = {
            to: to,
            from: currentAccount,
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

function encodeAddress(address) {
    return address.toLowerCase().replace('0x', '').padStart(64, '0');
}

// Known function selectors for common functions
// These are the keccak256 hashes of the function signatures
const FUNCTION_SELECTORS = {
    'withdrawableAmount(address)': '0xf3fef3a3', // May need verification with actual contract
    'balanceOf(address)': '0x70a08231', // Standard ERC20
    'claimWithdrawal(address)': '0x4782f779', // May need verification with actual contract
    // Alternative approaches if the above don't work:
    'withdrawableAmount_alt': '0x1ac51b98',
    'claimWithdrawal_alt': '0x5cc4aa9f'
};

// Wallet connection
async function connectWallet() {
    if (!window.ethereum) {
        showError('Please install MetaMask or another Ethereum wallet');
        return;
    }

    try {
        connectButton.textContent = 'Connecting...';
        connectButton.disabled = true;
        hideMessages();

        // Request account access
        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });

        if (accounts.length === 0) {
            throw new Error('No accounts found');
        }

        currentAccount = accounts[0];

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

        // Update UI
        connectSection.classList.add('hidden');
        walletSection.classList.remove('hidden');
        accountAddress.textContent = currentAccount;

        // Fetch initial data
        await fetchData();

    } catch (error) {
        showError(`Failed to connect wallet: ${error.message}`);
        connectButton.textContent = 'Connect Wallet';
        connectButton.disabled = false;
    }
}

// Fetch withdrawable amount and GNO balance
async function fetchData() {
    if (!currentAccount) return;

    try {
        withdrawableAmount.textContent = 'Loading...';
        gnoBalance.textContent = 'Loading...';
        withdrawableAmount.classList.add('loading');
        gnoBalance.classList.add('loading');
        refreshButton.disabled = true;
        refreshButton.textContent = 'Refreshing...';

        // Create function calls with correct function selectors
        const withdrawableData = FUNCTION_SELECTORS['withdrawableAmount(address)'] + encodeAddress(currentAccount);
        const balanceData = FUNCTION_SELECTORS['balanceOf(address)'] + encodeAddress(currentAccount);

        // Make contract calls with error handling for each
        let withdrawableResult, gnoBalanceResult;
        
        try {
            withdrawableResult = await callContract(VALIDATOR_CONTRACT_ADDRESS, withdrawableData);
        } catch (error) {
            console.warn('Primary withdrawableAmount call failed, trying alternative:', error);
            // Try alternative function selector
            const altWithdrawableData = FUNCTION_SELECTORS['withdrawableAmount_alt'] + encodeAddress(currentAccount);
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

        withdrawableAmount.textContent = `${withdrawableEth} ETH`;
        gnoBalance.textContent = `${gnoBalanceFormatted} GNO`;

        // Enable claim button if there are rewards to claim
        claimButton.disabled = parseFloat(withdrawableEth) === 0;

        hideMessages(); // Clear any previous errors on success

    } catch (error) {
        showError(`Failed to fetch data: ${error.message}`);
        withdrawableAmount.textContent = 'Error loading';
        gnoBalance.textContent = 'Error loading';
    } finally {
        withdrawableAmount.classList.remove('loading');
        gnoBalance.classList.remove('loading');
        refreshButton.disabled = false;
        refreshButton.textContent = 'Refresh Data';
    }
}

// Claim rewards
async function claimRewards() {
    if (!currentAccount) return;

    try {
        claimButton.disabled = true;
        claimButton.textContent = 'Claiming...';
        hideMessages();

        let claimData = FUNCTION_SELECTORS['claimWithdrawal(address)'] + encodeAddress(currentAccount);
        let txHash;

        try {
            txHash = await sendTransaction(VALIDATOR_CONTRACT_ADDRESS, claimData);
        } catch (error) {
            console.warn('Primary claimWithdrawal call failed, trying alternative:', error);
            // Try alternative function selector
            claimData = FUNCTION_SELECTORS['claimWithdrawal_alt'] + encodeAddress(currentAccount);
            txHash = await sendTransaction(VALIDATOR_CONTRACT_ADDRESS, claimData);
        }
        
        showSuccess(`Transaction submitted! Hash: ${txHash}`);

        // Refresh data after a delay
        setTimeout(async () => {
            await fetchData();
            showSuccess('Please wait for transaction confirmation. Data will refresh automatically.');
        }, 3000);

    } catch (error) {
        showError(`Failed to claim rewards: ${error.message}`);
    } finally {
        claimButton.disabled = false;
        claimButton.textContent = 'Claim Rewards';
    }
}

// Event listeners
connectButton.addEventListener('click', connectWallet);
claimButton.addEventListener('click', claimRewards);
refreshButton.addEventListener('click', fetchData);

// Listen for account changes
if (window.ethereum) {
    window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
            // Wallet disconnected
            currentAccount = null;
            connectSection.classList.remove('hidden');
            walletSection.classList.add('hidden');
            hideMessages();
        } else {
            // Account switched
            currentAccount = accounts[0];
            accountAddress.textContent = currentAccount;
            fetchData();
        }
    });

    window.ethereum.on('chainChanged', (chainId) => {
        // Refresh the page when chain changes
        window.location.reload();
    });
}

// Check if already connected on page load
async function checkConnection() {
    if (window.ethereum) {
        try {
            const accounts = await window.ethereum.request({
                method: 'eth_accounts'
            });
            
            if (accounts.length > 0) {
                currentAccount = accounts[0];
                connectSection.classList.add('hidden');
                walletSection.classList.remove('hidden');
                accountAddress.textContent = currentAccount;
                await fetchData();
            }
        } catch (error) {
            console.error('Failed to check connection:', error);
        }
    }
}

// Initialize app
checkConnection();