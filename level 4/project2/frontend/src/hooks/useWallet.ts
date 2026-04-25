// Re-export from context so all existing imports of useWallet continue to work,
// but now share a single global wallet state via React Context.
export { useWallet } from "../context/WalletContext";
export type { WalletContextValue as UseWalletReturn } from "../context/WalletContext";
