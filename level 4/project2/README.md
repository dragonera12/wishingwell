# Stellar DEX Mini 🚀

A production-ready Automated Market Maker (AMM) dApp built on Stellar (Soroban).

## 🎯 Features
- **Constant Product AMM**: Logic-hardened `x * y = k` formula with slippage protection.
- **Factory Pattern**: Registry for deploying and tracking multiple token pair pools.
- **Real-time Streaming**: Live price updates and transaction activity via Soroban events.
- **Wallet Support**: Integrated with Freighter, xBull, and Albedo via `StellarWalletsKit`.
- **Mobile-First Design**: Premium "terminal black" trading interface, optimized for all screens.

## 🔗 Contract Addresses (Testnet)
| Contract | Address |
| :--- | :--- |
| **Factory** | `CC6XX5QZTRPAHY2NU23LE6RKJUAQIQVHJURLU2VRKMV43XZWPOA7CGTT` |
| **Pool (USDX-EURX)** | `CCDXNJWBR3TXC7NLKEONEU5OC6GS45PIRL5RCTNYV5ODDU47LHNE3MZL` |
| **Token A (USDX)** | `CDHOBZJT7WJ72O6U2WOIZ23547MVJALMXHBDDUTDRN3JHED5JKWSTKYL` |
| **Token B (EURX)** | `CAVZI4FKIST27RPBGKG5K2XH2XTH2BJ24PRNIMWZVV5WJYSST5OV272A` |
| **LP Token** | `CBB7IXC5TIWVDR57IO3WYLGQKFIXPQG7FI2QI6KF2NRMH72ZWZGMBPZZ` |

## 🛠️ Tech Stack
- **Smart Contracts**: Rust, Soroban SDK
- **Frontend**: React, Vite, Tailwind CSS, Recharts
- **Wallet**: @creit.tech/stellar-wallets-kit
- **Client**: @stellar/stellar-sdk

## 🚀 Getting Started

### 1. Smart Contracts
```bash
# Build contracts
stellar contract build

# Deploy (example)
stellar contract deploy --wasm target/wasm32v1-none/release/factory.wasm --network testnet --source <your-identity>
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🛡️ Security
- **Slippage Protection**: `min_amount_out` enforced at the contract level.
- **Simulation**: Every transaction is simulated before submission to estimate fees and prevent failures.
- **Safety**: High price impact (>2%) warnings in the UI.

## 📜 License
MIT
