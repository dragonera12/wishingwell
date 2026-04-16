# ✧ Stellar Wishing Well ✧

A mystical dApp built on the **Stellar Testnet** where users can cast their wishes into a cosmic well by sending a small XLM tip.

## 🌟 Features
- **Wallet Connection**: Connect seamlessly via the Freighter Browser Extension.
- **Balance Display**: Real-time XLM balance tracking.
- **Mystical UI**: Animated ripples, coin-toss animations, and a star-studded dark theme.
- **Wish Board**: A public ledger (localStorage) of the last 10 wishes cast.
- **Feedback**: Instant transaction feedback with links to the Stellar Expert explorer.

## 🛠️ Tech Stack
- **Frontend**: React + Vite + Tailwind CSS
- **Blockchain**: `@stellar/stellar-sdk` & `@stellar/freighter-api`
- **Network**: Stellar Testnet

## 🚀 Local Setup

### Prerequisites
1.  **Node.js**: Ensure you have Node.js installed.
2.  **Freighter Wallet**: Install the [Freighter Extension](https://www.freighter.app/) in your browser.
3.  **Testnet Mode**: Set Freighter and the dApp to use the **Stellar Testnet**.
4.  **Fund Wallet**: Get free test XLM via the [Stellar Laboratory Friendbot](https://laboratory.stellar.org/#account-creator?network=testnet).

### Installation
```bash
# Clone the repository
git clone <your-repo-url>
cd stellar-wishing-well

# Install dependencies
npm install

# Start the development server
npm run dev
```

## 🌌 How to Use
1.  Connect your Freighter wallet using the "Connect" button.
2.  Type your wish in the input field (max 28 characters).
3.  Enter the amount of XLM you wish to toss (min 1.0 XLM).
4.  Click **"Toss Coin Into Well"**.
5.  Approve the transaction in your Freighter wallet.
6.  Watch your wish appear on the board!

## 📸 Screenshots
*(Placeholders - Add your own after deployment)*
- **Wallet Connected**: ![Wallet connected](https://placehold.co/600x400/0a0a1a/f59e0b?text=Wallet+Connected)
- **Wish Success**: ![Success Modal](https://placehold.co/600x400/0a0a1a/7c3aed?text=Wish+Success)
- **Wish Board**: ![Board View](https://placehold.co/600x400/0a0a1a/fbbf24?text=The+Wish+Board)

## 📜 License
MIT
