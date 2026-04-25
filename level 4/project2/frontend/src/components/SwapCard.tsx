import React, { useState, useEffect } from "react";
import {
  ArrowDown, Settings2, Info, AlertTriangle, CheckCircle2,
  Loader2, Droplets, PlusCircle, Wallet, ExternalLink, RefreshCw
} from "lucide-react";
import { useSwap } from "../hooks/useSwap";
import { useWallet } from "../hooks/useWallet";
import { useWalletBalances } from "../hooks/useWalletBalances";
import { mintTestTokens, establishTrustline, hasTrustline } from "../utils/faucet";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const SwapCard: React.FC = () => {
  const { isConnected, publicKey, connectWallet, signTransaction } = useWallet();
  const { balances, refresh: refreshBalances } = useWalletBalances();
  const {
    tokenIn, tokenOut, amountIn, amountOut,
    balanceIn, balanceOut, quote, txStatus,
    setAmountIn, switchTokens, executeSwap, isQuoteLoading,
  } = useSwap();

  const [showSettings, setShowSettings] = useState(false);
  const [faucetLoading, setFaucetLoading] = useState(false);
  const [faucetMsg, setFaucetMsg] = useState<string | null>(null);
  const [trustlineStatus, setTrustlineStatus] = useState<"unknown" | "missing" | "ok">("unknown");
  const [trustlineLoading, setTrustlineLoading] = useState(false);

  // Check trustline on connect
  useEffect(() => {
    if (!publicKey) { setTrustlineStatus("unknown"); return; }
    hasTrustline(publicKey).then(has => setTrustlineStatus(has ? "ok" : "missing"));
  }, [publicKey]);

  // Refresh balances after swap success
  useEffect(() => {
    if (txStatus.status === "success") refreshBalances();
  }, [txStatus.status, refreshBalances]);

  const handleAddTrustline = async () => {
    if (!publicKey || !signTransaction) return;
    setTrustlineLoading(true);
    setFaucetMsg(null);
    try {
      await establishTrustline(publicKey, signTransaction);
      setTrustlineStatus("ok");
      setFaucetMsg("✅ RNDM added to your wallet! Now click Faucet to get tokens.");
      setTimeout(() => setFaucetMsg(null), 6000);
    } catch (e: any) {
      setFaucetMsg("❌ " + e.message);
    } finally {
      setTrustlineLoading(false);
    }
  };

  const handleFaucet = async () => {
    if (!publicKey || !signTransaction) return;
    setFaucetLoading(true);
    setFaucetMsg(null);
    try {
      const result = await mintTestTokens(publicKey, signTransaction);
      if (result.needsTrustline) {
        setTrustlineStatus("missing");
        setFaucetMsg("⚠️ Please add RNDM to your wallet first using the button above.");
      } else {
        setFaucetMsg("✅ 5000 tXLM + 5000 tRNDM minted! Balances updating...");
        setTimeout(() => setFaucetMsg(null), 6000);
        refreshBalances();
      }
    } catch (e: any) {
      setFaucetMsg("❌ Faucet failed: " + e.message);
    } finally {
      setFaucetLoading(false);
    }
  };

  const handleSwap = () => {
    if (quote?.isHighImpact) {
      if (confirm("Price impact is very high (>2%). Continue?")) executeSwap();
    } else {
      executeSwap();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto card-glow glass rounded-3xl p-5 relative overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-bold">Swap</h2>
        <div className="flex items-center gap-2">
          {isConnected && (
            <button onClick={refreshBalances} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors" title="Refresh balances">
              <RefreshCw className="w-4 h-4 text-zinc-400" />
            </button>
          )}
          <button onClick={() => setShowSettings(!showSettings)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <Settings2 className="w-5 h-5 text-zinc-400" />
          </button>
        </div>
      </div>

      {/* ── Native Wallet Balance Panel ── */}
      {isConnected && (
        <div className="mb-4 p-3 rounded-2xl bg-zinc-900/60 border border-zinc-700/50">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono mb-2 flex items-center gap-1">
            <Wallet className="w-3 h-3" /> Freighter Wallet
          </p>
          <div className="flex justify-between items-center">
            <div className="text-center">
              <p className="text-lg font-bold text-[#7DF9FF]">{balances.nativeXlm}</p>
              <p className="text-[10px] text-zinc-500 font-mono">XLM (Native)</p>
            </div>
            <div className="w-px h-8 bg-zinc-700" />
            <div className="text-center">
              <p className="text-lg font-bold text-[#7DF9FF]">{balanceIn}</p>
              <p className="text-[10px] text-zinc-500 font-mono">tXLM (Pool)</p>
            </div>
            <div className="w-px h-8 bg-zinc-700" />
            <div className="text-center">
              <p className="text-lg font-bold text-[#f59e0b]">{balanceOut}</p>
              <p className="text-[10px] text-zinc-500 font-mono">tRNDM (Pool)</p>
            </div>
          </div>
          <p className="text-[10px] text-zinc-600 mt-2 leading-tight">
            ⚡ Only gas fees deduct from XLM (Native). Pool tokens live in the smart contract.
          </p>
        </div>
      )}

      {/* ── Trustline Banner ── */}
      {isConnected && trustlineStatus === "missing" && (
        <div className="mb-4 p-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 flex items-center justify-between gap-3">
          <div>
            <p className="text-amber-400 text-sm font-semibold">RNDM not in wallet</p>
            <p className="text-zinc-400 text-xs mt-0.5">Add a trustline so RNDM appears in Freighter.</p>
          </div>
          <button
            onClick={handleAddTrustline}
            disabled={trustlineLoading}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold px-3 py-2 rounded-xl transition-colors whitespace-nowrap disabled:opacity-50"
          >
            {trustlineLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <PlusCircle className="w-3 h-3" />}
            {trustlineLoading ? "Adding..." : "Add RNDM"}
          </button>
        </div>
      )}

      {/* Faucet message */}
      {faucetMsg && (
        <div className="mb-3 p-2.5 rounded-xl bg-zinc-800/60 border border-border text-xs text-zinc-300">
          {faucetMsg}
        </div>
      )}

      {/* ── Swap Inputs ── */}
      <div className="space-y-2">
        {/* From */}
        <div className="bg-background/50 rounded-2xl p-4 border border-border focus-within:border-primary/50 transition-colors">
          <div className="flex justify-between text-xs text-zinc-500 mb-2 font-mono">
            <span>From</span>
            <div className="flex items-center gap-2">
              <span>Pool Balance: <span className="text-zinc-300">{balanceIn}</span></span>
              {isConnected && (
                <button
                  onClick={handleFaucet}
                  disabled={faucetLoading}
                  title="Get free pool tokens"
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
                >
                  {faucetLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Droplets className="w-3 h-3" />}
                  {faucetLoading ? "Minting..." : "Faucet"}
                </button>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <input
              type="number"
              placeholder="0.00"
              value={amountIn}
              onChange={(e) => setAmountIn(e.target.value)}
              className="bg-transparent text-2xl font-bold focus:outline-none w-full"
            />
            <div className="flex items-center gap-2 bg-zinc-800/50 px-3 py-1.5 rounded-full border border-border">
              <div className="w-5 h-5 rounded-full" style={{ backgroundColor: tokenIn.color }} />
              <span className="font-bold text-sm">{tokenIn.symbol}</span>
            </div>
          </div>
        </div>

        {/* Switch */}
        <div className="flex justify-center -my-4 relative z-10">
          <button
            onClick={switchTokens}
            className="p-2 bg-background border border-border rounded-xl hover:border-primary transition-colors shadow-xl"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
        </div>

        {/* To */}
        <div className="bg-background/50 rounded-2xl p-4 border border-border">
          <div className="flex justify-between text-xs text-zinc-500 mb-2 font-mono">
            <span>To (Estimate)</span>
            <span>Pool Balance: <span className="text-zinc-300">{balanceOut}</span></span>
          </div>
          <div className="flex justify-between items-center">
            <input
              type="number"
              placeholder="0.00"
              value={amountOut}
              readOnly
              className="bg-transparent text-2xl font-bold focus:outline-none w-full cursor-default"
            />
            <div className="flex items-center gap-2 bg-zinc-800/50 px-3 py-1.5 rounded-full border border-border">
              <div className="w-5 h-5 rounded-full" style={{ backgroundColor: tokenOut.color }} />
              <span className="font-bold text-sm">{tokenOut.symbol}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quote Details */}
      {quote && (
        <div className="mt-5 space-y-2 px-1 py-3 rounded-2xl bg-zinc-900/40 border border-zinc-800">
          {[
            ["Rate", `1 ${tokenIn.symbol} = ${quote.executionPrice} ${tokenOut.symbol}`],
            ["Price Impact", quote.priceImpactPercent, quote.isHighImpact],
            ["Min. Received", `${quote.minimumReceived} ${tokenOut.symbol}`],
            ["Fee", `${quote.feePaid} ${tokenIn.symbol}`],
          ].map(([label, value, isWarning]) => (
            <div key={String(label)} className="flex justify-between text-sm px-2">
              <span className="text-zinc-500 flex items-center gap-1">
                {label} {label === "Price Impact" && <Info className="w-3 h-3" />}
              </span>
              <span className={cn("font-mono", isWarning ? "text-danger" : "text-zinc-200")}>
                {String(value)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* CTA Button */}
      <button
        onClick={isConnected ? handleSwap : connectWallet}
        disabled={isConnected && (!amountIn || isQuoteLoading || txStatus.status === "pending" || !quote)}
        className={cn(
          "w-full mt-5 py-4 rounded-2xl font-bold text-lg transition-all active:scale-95 flex items-center justify-center gap-2",
          !isConnected
            ? "bg-primary text-white shadow-lg shadow-primary/20"
            : txStatus.status === "pending"
              ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
              : "bg-primary text-white shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none"
        )}
      >
        {txStatus.status === "pending" && <Loader2 className="w-5 h-5 animate-spin" />}
        {!isConnected ? "Connect Wallet" : txStatus.status === "pending" ? txStatus.step : "Swap"}
      </button>

      {/* ── Transaction Status Overlay ── */}
      {txStatus.status !== "idle" && (
        <div className="absolute inset-0 bg-background/92 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 text-center rounded-3xl">
          {txStatus.status === "pending" && (
            <>
              <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />
              <h3 className="text-xl font-bold mb-2">{txStatus.step}</h3>
              {txStatus.hash && (
                <p className="text-xs text-zinc-500 font-mono break-all max-w-[200px]">
                  {txStatus.hash.slice(0, 10)}...{txStatus.hash.slice(-10)}
                </p>
              )}
            </>
          )}

          {txStatus.status === "success" && (
            <>
              <CheckCircle2 className="w-16 h-16 text-success mb-4" />
              <h3 className="text-xl font-bold mb-1">Swap Successful!</h3>
              <p className="text-zinc-400 text-sm mb-1">
                Pool balances updated. Only gas fee left Freighter.
              </p>
              <p className="text-zinc-600 text-xs mb-5">
                Native XLM (9381.xx) only decreases by ~0.003 XLM gas.
              </p>
              <div className="flex gap-3">
                {txStatus.explorerUrl && (
                  <a
                    href={txStatus.explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 bg-white/5 border border-border rounded-xl text-sm hover:bg-white/10 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" /> Explorer
                  </a>
                )}
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-primary rounded-xl text-sm font-bold"
                >
                  Close
                </button>
              </div>
            </>
          )}

          {txStatus.status === "fail" && (
            <>
              <AlertTriangle className="w-16 h-16 text-danger mb-4" />
              <h3 className="text-xl font-bold mb-2">Transaction Failed</h3>
              <p className="text-zinc-400 mb-5 text-sm max-w-[250px]">{txStatus.error?.message}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-zinc-800 rounded-xl text-sm font-bold"
              >
                Back to Swap
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
