import { useState, useEffect, useCallback } from "react";
import {
  TransactionBuilder,
  Account,
  xdr,
  Contract,
  scValToNative,
  rpc
} from "@stellar/stellar-sdk";
import { CONFIG, TOKENS } from "../config";
import type { PoolStats, LiquidityPosition, TxStatus } from "../types";
import { useWallet } from "./useWallet";
import { server, i128ToScVal, signAndSubmit, addrToScVal } from "../utils/contract";
import { parseUnits, formatUnits } from "../utils/amm";

export const usePool = () => {
  const { publicKey, signTransaction, isConnected } = useWallet();
  const [poolStats, setPoolStats] = useState<PoolStats | null>(null);
  const [myPosition, setMyPosition] = useState<LiquidityPosition | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [txStatus, setTxStatus] = useState<TxStatus>({
    status: "idle",
    step: "",
    hash: null,
    explorerUrl: null,
    error: null,
  });

  const refreshPool = useCallback(async () => {
    setIsLoading(true);
    try {
      const contract = new Contract(CONFIG.POOL_CONTRACT_ID);
      
      const resReserves = await server.simulateTransaction(
        new TransactionBuilder(
          new Account("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF", "0"),
          { fee: "100", networkPassphrase: CONFIG.NETWORK_PASSPHRASE }
        )
        .addOperation(contract.call("get_reserves"))
        .setTimeout(30)
        .build()
      );

      const resStats = await server.simulateTransaction(
        new TransactionBuilder(
          new Account("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF", "0"),
          { fee: "100", networkPassphrase: CONFIG.NETWORK_PASSPHRASE }
        )
        .addOperation(contract.call("get_stats"))
        .setTimeout(30)
        .build()
      );

      if (rpc.Api.isSimulationSuccess(resReserves) && resReserves.result && 
          rpc.Api.isSimulationSuccess(resStats) && resStats.result) {
        
        const reserves = scValToNative(resReserves.result.retval);
        const stats = scValToNative(resStats.result.retval);

        const reserveA = formatUnits(reserves.reserve_a, TOKENS.TOKEN_A.decimals);
        const reserveB = formatUnits(reserves.reserve_b, TOKENS.TOKEN_B.decimals);

        setPoolStats({
          reserveA,
          reserveB,
          totalLpSupply: formatUnits(reserves.total_lp_supply, TOKENS.LP.decimals),
          swapCount: Number(stats[0]),
          volumeA: formatUnits(stats[1], TOKENS.TOKEN_A.decimals),
          volumeB: formatUnits(stats[2], TOKENS.TOKEN_B.decimals),
          priceAtoB: reserveA !== "0" ? (parseFloat(reserveB) / parseFloat(reserveA)).toFixed(6) : "0",
          priceBtoA: reserveB !== "0" ? (parseFloat(reserveA) / parseFloat(reserveB)).toFixed(6) : "0",
          tvlEstimate: `$${(parseFloat(reserveA) * 1 + parseFloat(reserveB) * 1).toFixed(2)}`, 
        });

        if (publicKey) {
          const lpContract = new Contract(CONFIG.LP_TOKEN_ID);
          const balanceRes = await server.simulateTransaction(
            new TransactionBuilder(new Account(publicKey, "0"), { fee: "100", networkPassphrase: CONFIG.NETWORK_PASSPHRASE })
            .addOperation(lpContract.call("balance", addrToScVal(publicKey)))
            .setTimeout(30)
            .build()
          );
          if (rpc.Api.isSimulationSuccess(balanceRes) && balanceRes.result) {
            const lpBalance = scValToNative(balanceRes.result.retval);
            const totalLp = BigInt(reserves.total_lp_supply);
            const share = totalLp > 0n ? (Number(lpBalance) * 100 / Number(totalLp)).toFixed(2) : "0";

            setMyPosition({
              lpBalance: formatUnits(lpBalance, TOKENS.LP.decimals),
              poolShare: share + "%",
              tokenAOwned: totalLp > 0n ? formatUnits(BigInt(lpBalance) * BigInt(reserves.reserve_a) / totalLp, TOKENS.TOKEN_A.decimals) : "0",
              tokenBOwned: totalLp > 0n ? formatUnits(BigInt(lpBalance) * BigInt(reserves.reserve_b) / totalLp, TOKENS.TOKEN_B.decimals) : "0",
            });
          }
        }
      }
    } catch (e) {
      console.error("Pool refresh error", e);
    } finally {
      setIsLoading(false);
    }
  }, [publicKey]);

  useEffect(() => {
    refreshPool();
    const interval = setInterval(refreshPool, 10000);
    return () => clearInterval(interval);
  }, [refreshPool]);

  const addLiquidity = async (amountA: string, amountB: string) => {
    if (!isConnected || !publicKey) return;
    setTxStatus({ status: "pending", step: "Preparing transaction...", hash: null, explorerUrl: null, error: null });

    try {
      const poolContract = new Contract(CONFIG.POOL_CONTRACT_ID);
      const tokenA = new Contract(TOKENS.TOKEN_A.id);
      const tokenB = new Contract(TOKENS.TOKEN_B.id);

      const amountABig = parseUnits(amountA, TOKENS.TOKEN_A.decimals);
      const amountBBig = parseUnits(amountB, TOKENS.TOKEN_B.decimals);

      const latestLedger = await server.getLatestLedger();
      const expirationLedger = latestLedger.sequence + 500;

      // 1. Approve A
      setTxStatus(s => ({ ...s, step: "Approving Token A (1/3)..." }));
      const approveAOp = tokenA.call("approve", addrToScVal(publicKey), addrToScVal(CONFIG.POOL_CONTRACT_ID), i128ToScVal(amountABig), xdr.ScVal.scvU32(expirationLedger));
      await signAndSubmit(publicKey, approveAOp, signTransaction);

      // 2. Approve B
      setTxStatus(s => ({ ...s, step: "Approving Token B (2/3)..." }));
      const approveBOp = tokenB.call("approve", addrToScVal(publicKey), addrToScVal(CONFIG.POOL_CONTRACT_ID), i128ToScVal(amountBBig), xdr.ScVal.scvU32(expirationLedger));
      await signAndSubmit(publicKey, approveBOp, signTransaction);

      // 3. Add Liquidity
      setTxStatus(s => ({ ...s, step: "Adding Liquidity (3/3)..." }));
      const addLiqOp = poolContract.call("add_liquidity", addrToScVal(publicKey), i128ToScVal(amountABig), i128ToScVal(amountBBig), i128ToScVal(0n));
      const resPoolHash = await signAndSubmit(publicKey, addLiqOp, signTransaction);

      setTxStatus({ status: "success", step: "Liquidity added!", hash: resPoolHash, explorerUrl: `${CONFIG.STELLAR_EXPERT_BASE}/tx/${resPoolHash}`, error: null });
      refreshPool();
    } catch (e: any) {
      setTxStatus({ status: "fail", step: "Failed", hash: null, explorerUrl: null, error: { type: "POOL_ERROR", message: e.message || "Failed" } });
    }
  };

  const removeLiquidity = async (lpAmount: string) => {
    if (!isConnected || !publicKey) return;
    setTxStatus({ status: "pending", step: "Preparing...", hash: null, explorerUrl: null, error: null });

    try {
      const poolContract = new Contract(CONFIG.POOL_CONTRACT_ID);
      const lpToken = new Contract(TOKENS.LP.id);
      const lpAmountBig = parseUnits(lpAmount, TOKENS.LP.decimals);

      const latestLedger = await server.getLatestLedger();
      const expirationLedger = latestLedger.sequence + 500;

      // 1. Approve LP
      setTxStatus(s => ({ ...s, step: "Approving LP (1/2)..." }));
      const approveLPOp = lpToken.call("approve", addrToScVal(publicKey), addrToScVal(CONFIG.POOL_CONTRACT_ID), i128ToScVal(lpAmountBig), xdr.ScVal.scvU32(expirationLedger));
      await signAndSubmit(publicKey, approveLPOp, signTransaction);

      // 2. Remove Liquidity
      setTxStatus(s => ({ ...s, step: "Removing Liquidity (2/2)..." }));
      const removeLiqOp = poolContract.call("remove_liquidity", addrToScVal(publicKey), i128ToScVal(lpAmountBig), i128ToScVal(0n), i128ToScVal(0n));
      const resRemHash = await signAndSubmit(publicKey, removeLiqOp, signTransaction);

      setTxStatus({ status: "success", step: "Liquidity removed!", hash: resRemHash, explorerUrl: `${CONFIG.STELLAR_EXPERT_BASE}/tx/${resRemHash}`, error: null });
      refreshPool();
    } catch (e: any) {
      setTxStatus({ status: "fail", step: "Failed", hash: null, explorerUrl: null, error: { type: "POOL_ERROR", message: e.message || "Failed" } });
    }
  };

  return {
    poolStats,
    myPosition,
    txStatus,
    addLiquidity,
    removeLiquidity,
    refreshPool,
    isLoading,
  };
};
