import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  StellarWalletsKit,
  KitEventType,
} from "@creit.tech/stellar-wallets-kit";
import { Networks as WalletNetwork } from "@creit.tech/stellar-wallets-kit/types";
import { FreighterModule } from "@creit.tech/stellar-wallets-kit/modules/freighter";
import { xBullModule } from "@creit.tech/stellar-wallets-kit/modules/xbull";
import { AlbedoModule } from "@creit.tech/stellar-wallets-kit/modules/albedo";
import { Horizon, Networks } from "@stellar/stellar-sdk";
import { CONFIG } from "../config";
import type { AppError } from "../types";

// Initialize kit once globally
StellarWalletsKit.init({
  network: WalletNetwork.TESTNET,
  modules: [
    new FreighterModule(),
    new xBullModule(),
    new AlbedoModule(),
  ],
});

export interface WalletContextValue {
  isConnected: boolean;
  publicKey: string | null;
  xlmBalance: string | null;
  walletName: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  signTransaction: (xdr: string) => Promise<string>;
  refreshBalance: () => Promise<void>;
  isLoading: boolean;
  error: AppError | null;
  clearError: () => void;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [xlmBalance, setXlmBalance] = useState<string | null>(null);
  const [walletName, setWalletName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const horizon = new Horizon.Server(CONFIG.HORIZON_URL);

  const refreshBalance = useCallback(async () => {
    if (!publicKey) return;
    try {
      const account = await horizon.loadAccount(publicKey);
      const native = account.balances.find((b) => b.asset_type === "native");
      setXlmBalance(native ? native.balance : "0");
    } catch (e) {
      console.error("Failed to fetch balance", e);
    }
  }, [publicKey]);

  const connectWallet = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { address } = await StellarWalletsKit.authModal();
      setPublicKey(address);
      setIsConnected(true);
      setWalletName(StellarWalletsKit.selectedModule.productName);
      console.log("[Wallet] Connected:", address);
    } catch (e: any) {
      setError({
        type: "WALLET_ERROR",
        message: e.message || "Failed to connect wallet",
        action: "install_wallet",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = () => {
    StellarWalletsKit.disconnect();
    setPublicKey(null);
    setIsConnected(false);
    setWalletName(null);
    setXlmBalance(null);
  };

  const signTransaction = async (xdr: string): Promise<string> => {
    try {
      const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
        networkPassphrase: Networks.TESTNET,
        address: publicKey || undefined,
      });
      return signedTxXdr;
    } catch (e: any) {
      throw new Error(e.message || "Transaction signing failed");
    }
  };

  useEffect(() => {
    const unsubscribe = StellarWalletsKit.on(KitEventType.DISCONNECT, () => {
      // Use the functional update or check current state to avoid cycles
      setIsConnected(prev => {
        if (prev) {
          setPublicKey(null);
          setWalletName(null);
          setXlmBalance(null);
          return false;
        }
        return prev;
      });
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (publicKey) {
      refreshBalance();
    }
  }, [publicKey, refreshBalance]);

  return (
    <WalletContext.Provider value={{
      isConnected,
      publicKey,
      xlmBalance,
      walletName,
      connectWallet,
      disconnectWallet,
      signTransaction,
      refreshBalance,
      isLoading,
      error,
      clearError: () => setError(null),
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextValue => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside <WalletProvider>");
  return ctx;
};
