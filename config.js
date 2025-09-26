// Configuration constants for the Gnosis Validator Safe App
export const CONFIG = {
    VALIDATOR_CONTRACT_ADDRESS: '0x0b98057ea310f4d31f2a452b414647007d1645d9',
    GNO_TOKEN_ADDRESS: '0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb',
    GNOSIS_CHAIN_ID: '0x64', // 100 in hex
    GNOSIS_RPC_URL: 'https://rpc.gnosischain.com/',
    GNOSIS_CHAIN_CONFIG: {
        chainId: '0x64',
        chainName: 'Gnosis Chain',
        nativeCurrency: {
            name: 'xDAI',
            symbol: 'XDAI',
            decimals: 18
        },
        rpcUrls: ['https://rpc.gnosischain.com/'],
        blockExplorerUrls: ['https://gnosisscan.io/']
    }
};

// Known function selectors for common functions
export const FUNCTION_SELECTORS = {
    'withdrawableAmount(address)': '0xf3fef3a3',
    'balanceOf(address)': '0x70a08231',
    'claimWithdrawal(address)': '0x4782f779',
    'withdrawableAmount_alt': '0x1ac51b98',
    'claimWithdrawal_alt': '0x5cc4aa9f'
};