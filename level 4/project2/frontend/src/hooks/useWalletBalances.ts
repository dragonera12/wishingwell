import { useState, useEffect, useCallback } from "react";
import { Horizon } from "@stellar/stellar-sdk";
import { CONFIG, RNDM_ISSUER } from "../config";
import { useWallet } from "./useWallet";

const horizon = new Horizon.Server(CONFIG.HORIZON_URL);

export interface WalletBalances {
  nativeXlm: string;      // Real XLM from Freighter
  tXlm: string;           // Pool tXLM token (Soroban)
  tRndm: string;          // Pool tRNDM token (Soroban)
  classicRndm: string;    // Classic RNDM asset (Freighter visible)
}

export function useWalletBalances() {
  const { publicKey, isConnected } = useWallet();
  const [balances, setBalances] = useState<WalletBalances>({
    nativeXlm: "0.00",
    tXlm: "0.00",
    tRndm: "0.00",
    classicRndm: "0.00",
  });
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!publicKey || !isConnected) {
      setBalances({ nativeXlm: "0.00", tXlm: "0.00", tRndm: "0.00", classicRndm: "0.00" });
      return;
    }

    setIsLoading(true);
    try {
      const account = await horizon.loadAccount(publicKey);

      const xlmEntry = account.balances.find((b: any) => b.asset_type === "native");
      const rndmEntry = account.balances.find(
        (b: any) => b.asset_code === "RNDM" && b.asset_issuer === RNDM_ISSUER
      );

      setBalances(prev => ({
        ...prev,
        nativeXlm: xlmEntry ? parseFloat(xlmEntry.balance).toFixed(2) : "0.00",
        classicRndm: rndmEntry ? parseFloat(rndmEntry.balance).toFixed(2) : "0.00",
      }));
    } catch (e) {
      console.warn("Horizon balance fetch failed", e);
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, isConnected]);

  // Update pool token balances (called by useSwap after fetching)
  const setPoolBalances = useCallback((tXlm: string, tRndm: string) => {
    setBalances(prev => ({ ...prev, tXlm, tRndm }));
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 10000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { balances, refresh, setPoolBalances, isLoading };
}
