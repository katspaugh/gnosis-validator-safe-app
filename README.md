# Gnosis Validator Safe App

A simple single-page application for managing Gnosis Chain validator rewards without any build step required.

## Features

- 🔗 **Wallet Connection**: Connect via MetaMask or any window.ethereum-compatible wallet
- 🔄 **Auto Network Switching**: Automatically switches to Gnosis Chain or helps add it
- 💰 **Rewards Display**: Shows your withdrawable validator rewards in real-time
- 🪙 **GNO Balance**: Displays your current GNO token balance
- ⚡ **Claim Rewards**: One-click reward claiming functionality
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Usage

1. **Open the App**: Simply open `index.html` in your web browser or serve it via HTTP
2. **Connect Wallet**: Click "Connect Wallet" and approve the connection in your wallet
3. **Switch Networks**: The app will automatically prompt you to switch to Gnosis Chain
4. **View Rewards**: Your withdrawable rewards and GNO balance will be displayed
5. **Claim Rewards**: Click "Claim Rewards" when you have rewards available

## Technical Details

- **No Build Step**: Pure HTML, CSS, and JavaScript - no compilation needed
- **No External Dependencies**: Works without internet access to CDNs
- **Contract Integration**: Interacts with the Gnosis validator contract at `0x0b98057ea310f4d31f2a452b414647007d1645d9`
- **ERC20 Support**: Reads GNO token balance from `0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb`

## Development

To run locally:

```bash
# Start a simple HTTP server
python3 -m http.server 8000

# Open in browser
open http://localhost:8000
```

## Contract Functions

The app interacts with these contract functions:

- `withdrawableAmount(address)`: Gets the amount available for withdrawal
- `claimWithdrawal(address)`: Claims rewards for the specified address
- `balanceOf(address)`: Gets GNO token balance (ERC20 standard)

## Network Information

- **Chain ID**: 100 (0x64)
- **Network Name**: Gnosis Chain
- **RPC URL**: https://rpc.gnosischain.com/
- **Explorer**: https://gnosisscan.io/
- **Native Currency**: xDAI

## Security Notes

- Always verify contract addresses before interacting
- Only connect wallets you trust
- Review transactions before signing
- This app runs entirely in your browser - no data is sent to external servers
