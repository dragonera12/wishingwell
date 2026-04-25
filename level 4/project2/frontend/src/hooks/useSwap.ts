import { useState, useEffect, useCallback } from "react";
import {
  TransactionBuilder,
  Account,
  Contract,
  scValToNative,
  nativeToScVal,
  Address,
  rpc,
} from "@stellar/stellar-sdk";
import { CONFIG, TOKENS } from "../config";
import type { Token, SwapQuote, TxStatus } from "../types";
import { useWallet } from "./useWallet";
import { server, signAndSubmit } from "../utils/contract";
import { formatUnits, getPriceImpactBps } from "../utils/amm";

export const useSwap = () => {
  const { publicKey, signTransaction, isConnected } = useWallet();
  const [tokenIn, setTokenIn] = useState<Token>(TOKENS.TOKEN_A);
  const [tokenOut, setTokenOut] = useState<Token>(TOKENS.TOKEN_B);
  const [amountIn, setAmountIn] = useState("");
  const [amountOut, setAmountOut] = useState("");
  const [balanceIn, setBalanceIn] = useState("0.00");
  const [balanceOut, setBalanceOut] = useState("0.00");
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [slippageBps, setSlippageBps] = useState(CONFIG.DEFAULT_SLIPPAGE_BPS);
  const [txStatus, setTxStatus] = useState<TxStatus>({
    status: "idle",
    step: "",
    hash: null,
    explorerUrl: null,
    error: null,
  });
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);

  // ── Fetch pool token balances via Soroban simulation ────────────────────────────
  const fetchBalances = useCallback(async () => {
    if (!publicKey) {
      setBalanceIn("0.00");
      setBalanceOut("0.00");
      return;
    }
    const getBal = async (tokenId: string, decimals: number): Promise<string> => {
      try {
        const contract = new Contract(tokenId);
        const res = await server.simulateTransaction(
          new TransactionBuilder(new Account(publicKey, "0"), {
            fee: "100",
            networkPassphrase: CONFIG.NETWORK_PASSPHRASE,
          })
            .addOperation(contract.call("balance", new Address(publicKey).toScVal()))
            .setTimeout(30)
            .build()
        );
        if (rpc.Api.isSimulationSuccess(res) && res.result) {
          const bal = scValToNative(res.result.retval);
          return formatUnits(bal, decimals);
        }
      } catch (e) {
        console.warn("[Balance] Failed for", tokenId, e);
      }
      return "0.00";
    };

    try {
      const [bIn, bOut] = await Promise.all([
        getBal(tokenIn.id, tokenIn.decimals),
        getBal(tokenOut.id, tokenOut.decimals),
      ]);
      setBalanceIn(bIn);
      setBalanceOut(bOut);
    } catch (e) {
      console.error("[Balance] Fetch error", e);
    }
  }, [publicKey, tokenIn, tokenOut]);

  useEffect(() => {
    fetchBalances();
    const interval = setInterval(fetchBalances, 10000);
    return () => clearInterval(interval);
  }, [fetchBalances]);

  // VoltPay style stroop conversion
  const toStroops = (amount: string) => BigInt(Math.floor(parseFloat(amount) * 1e7));

  // ── Quote fetching ────────────────────────────────────────────────────────
  const fetchQuote = useCallback(async () => {
    if (!amountIn || parseFloat(amountIn) <= 0) {
      setAmountOut("");
      setQuote(null);
      return;
    }
    setIsQuoteLoading(true);
    try {
      const contract = new Contract(CONFIG.POOL_CONTRACT_ID);
      const amountInStroops = toStroops(amountIn);

      const res = await server.simulateTransaction(
        new TransactionBuilder(
          new Account(publicKey || "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF", "0"),
          { fee: "100", networkPassphrase: CONFIG.NETWORK_PASSPHRASE }
        )
          .addOperation(
            contract.call(
              "get_swap_quote",
              new Address(tokenIn.id).toScVal(),
              nativeToScVal(amountInStroops, { type: "i128" })
            )
          )
          .setTimeout(30)
          .build()
      );

      if (rpc.Api.isSimulationSuccess(res) && res.result) {
        const result = scValToNative(res.result.retval);
        const outBig = BigInt(result.amount_out);
        const impactBps = getPriceImpactBps(
          amountInStroops, outBig,
          BigInt(result.new_reserve_a - (tokenIn.id === TOKENS.TOKEN_A.id ? amountInStroops : 0n)),
          BigInt(result.new_reserve_b)
        );
        setAmountOut(formatUnits(outBig, tokenOut.decimals));
        setQuote({
          amountIn,
          amountOut: formatUnits(outBig, tokenOut.decimals),
          feePaid: formatUnits(BigInt(result.fee_paid), tokenIn.decimals),
          priceImpactBps: impactBps,
          priceImpactPercent: (impactBps / 100).toFixed(2) + "%",
          executionPrice: (parseFloat(formatUnits(outBig, tokenOut.decimals)) / parseFloat(amountIn)).toFixed(6),
          minimumReceived: formatUnits(outBig * BigInt(10000 - slippageBps) / 10000n, tokenOut.decimals),
          route: `${tokenIn.symbol} → ${tokenOut.symbol}`,
          isHighImpact: impactBps > 200,
        });
      } else {
        setQuote(null);
        setAmountOut("");
      }
    } catch (e) {
      console.error("[Quote] Error", e);
    } finally {
      setIsQuoteLoading(false);
    }
  }, [amountIn, tokenIn, tokenOut, publicKey, slippageBps]);

  useEffect(() => {
    const timer = setTimeout(fetchQuote, 500);
    return () => clearTimeout(timer);
  }, [fetchQuote]);

  const switchTokens = () => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    setAmountIn(amountOut);
  };

  // ── Execute Swap — VoltPay Pattern ─────────────────────────────────────────
  const executeSwap = async () => {
    if (!isConnected || !publicKey || !quote) return;

    // Input validation
    const amountInFloat = parseFloat(amountIn);
    if (!amountIn || amountInFloat <= 0) {
      setTxStatus({ status: "fail", step: "Failed", hash: null, explorerUrl: null,
        error: { type: "SWAP_ERROR", message: "Please enter an amount greater than 0" } });
      return;
    }
    if (amountInFloat > parseFloat(balanceIn)) {
      setTxStatus({ status: "fail", step: "Failed", hash: null, explorerUrl: null,
        error: { type: "SWAP_ERROR", message: `Insufficient ${tokenIn.symbol} pool balance (have ${balanceIn})` } });
      return;
    }

    setTxStatus({ status: "pending", step: "Preparing...", hash: null, explorerUrl: null, error: null });

    try {
      const poolContract = new Contract(CONFIG.POOL_CONTRACT_ID);
      const tokenInContract = new Contract(tokenIn.id);

      // Amount conversion (VoltPay style)
      const amountInStroops = toStroops(amountIn);
      const minAmountOutStroops = toStroops(quote.minimumReceived);

      const latestLedger = await server.getLatestLedger();
      const expirationLedger = latestLedger.sequence + 500;

      // ─── STEP 1: APPROVE ─────────────────────────────────────────────────
      setTxStatus(s => ({ ...s, step: "Step 1/2 — Approve tokens in Freighter..." }));

      const approveOp = tokenInContract.call(
        "approve",
        new Address(publicKey).toScVal(),
        new Address(CONFIG.POOL_CONTRACT_ID).toScVal(),
        nativeToScVal(amountInStroops, { type: "i128" }),
        nativeToScVal(expirationLedger, { type: "u32" })
      );

      const approveHash = await signAndSubmit(publicKey, approveOp, signTransaction);
      console.log("[Swap] ✅ Approve confirmed!", approveHash);

      // ─── STEP 2: SWAP ────────────────────────────────────────────────────
      setTxStatus(s => ({ ...s, step: "Step 2/2 — Confirm swap in Freighter..." }));

      const swapOp = poolContract.call(
        "swap",
        new Address(publicKey).toScVal(),
        new Address(tokenIn.id).toScVal(),
        nativeToScVal(amountInStroops, { type: "i128" }),
        nativeToScVal(minAmountOutStroops, { type: "i128" })
      );

      const swapHash = await signAndSubmit(publicKey, swapOp, signTransaction);
      console.log("[Swap] ✅ Swap confirmed!", swapHash);

      // Success
      setTxStatus({
        status: "success",
        step: "Swap successful!",
        hash: swapHash,
        explorerUrl: `${CONFIG.STELLAR_EXPERT_BASE}/tx/${swapHash}`,
        error: null,
      });

      // Refresh balances
      setTimeout(fetchBalances, 1500);

    } catch (e: any) {
      console.error("[Swap] ❌ Error:", e);
      setTxStatus({
        status: "fail",
        step: "Failed",
        hash: null,
        explorerUrl: null,
        error: { type: "SWAP_ERROR", message: e.message || "Unknown error during swap" },
      });
    }
  };

  return {
    tokenIn,
    tokenOut,
    amountIn,
    amountOut,
    balanceIn,
    balanceOut,
    quote,
    slippageBps,
    txStatus,
    setTokenIn,
    setTokenOut,
    setAmountIn,
    switchTokens,
    setSlippage: setSlippageBps,
    executeSwap,
    refreshQuote: fetchQuote,
    isQuoteLoading,
    fetchBalances,
  };
};
