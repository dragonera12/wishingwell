import React, { useState } from "react";
import { Plus, Info, Loader2, CheckCircle2 } from "lucide-react";
import { usePool } from "../hooks/usePool";
import { useWallet } from "../hooks/useWallet";
import { TOKENS } from "../config";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const LiquidityCard: React.FC = () => {
  const { isConnected, connectWallet } = useWallet();
  const { poolStats, myPosition, txStatus, addLiquidity, removeLiquidity } = usePool();
  
  const [tab, setTab] = useState<"add" | "remove">("add");
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [lpToRemove, setLpToRemove] = useState("");

  const handleAdd = () => addLiquidity(amountA, amountB);
  const handleRemove = () => removeLiquidity(lpToRemove);

  return (
    <div className="w-full max-w-md mx-auto card-glow glass rounded-3xl p-5 relative overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <div className="flex bg-background p-1 rounded-xl">
          <button 
            onClick={() => setTab("add")}
            className={cn("px-4 py-1.5 rounded-lg text-sm font-bold transition-all", tab === "add" ? "bg-primary text-white" : "text-zinc-500 hover:text-zinc-300")}
          >
            Add
          </button>
          <button 
            onClick={() => setTab("remove")}
            className={cn("px-4 py-1.5 rounded-lg text-sm font-bold transition-all", tab === "remove" ? "bg-primary text-white" : "text-zinc-500 hover:text-zinc-300")}
          >
            Remove
          </button>
        </div>
      </div>

      {tab === "add" ? (
        <div className="space-y-4">
          <div className="bg-background/50 rounded-2xl p-4 border border-border">
            <div className="flex justify-between text-xs text-zinc-500 mb-2 font-mono">
              <span>Input {TOKENS.TOKEN_A.symbol}</span>
            </div>
            <div className="flex justify-between items-center">
              <input
                type="number"
                placeholder="0.00"
                value={amountA}
                onChange={(e) => setAmountA(e.target.value)}
                className="bg-transparent text-xl font-bold focus:outline-none w-full"
              />
              <div className="flex items-center gap-2 bg-zinc-800/50 px-3 py-1.5 rounded-full border border-border">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: TOKENS.TOKEN_A.color }} />
                <span className="font-bold text-sm">{TOKENS.TOKEN_A.symbol}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-center -my-2 relative z-10">
            <div className="p-1 bg-background border border-border rounded-lg">
              <Plus className="w-4 h-4 text-zinc-500" />
            </div>
          </div>

          <div className="bg-background/50 rounded-2xl p-4 border border-border">
            <div className="flex justify-between text-xs text-zinc-500 mb-2 font-mono">
              <span>Input {TOKENS.TOKEN_B.symbol}</span>
            </div>
            <div className="flex justify-between items-center">
              <input
                type="number"
                placeholder="0.00"
                value={amountB}
                onChange={(e) => setAmountB(e.target.value)}
                className="bg-transparent text-xl font-bold focus:outline-none w-full"
              />
              <div className="flex items-center gap-2 bg-zinc-800/50 px-3 py-1.5 rounded-full border border-border">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: TOKENS.TOKEN_B.color }} />
                <span className="font-bold text-sm">{TOKENS.TOKEN_B.symbol}</span>
              </div>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">Share of Pool</span>
              <span className="text-primary font-bold font-mono">
                {poolStats ? "0.01%" : "0%"}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">{TOKENS.TOKEN_A.symbol} Price</span>
              <span className="font-mono">{poolStats?.priceAtoB} {TOKENS.TOKEN_B.symbol}</span>
            </div>
          </div>

          <button
            onClick={isConnected ? handleAdd : connectWallet}
            disabled={isConnected && (!amountA || !amountB || txStatus.status === "pending")}
            className="w-full py-4 rounded-2xl bg-primary text-white font-bold shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {txStatus.status === "pending" && <Loader2 className="w-5 h-5 animate-spin" />}
            {!isConnected ? "Connect Wallet" : "Add Liquidity"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-background/50 rounded-2xl p-4 border border-border">
            <div className="flex justify-between text-xs text-zinc-500 mb-2 font-mono">
              <span>Amount of LP Tokens to Burn</span>
              <span>Balance: {myPosition?.lpBalance || "0.00"}</span>
            </div>
            <div className="flex justify-between items-center">
              <input
                type="number"
                placeholder="0.00"
                value={lpToRemove}
                onChange={(e) => setLpToRemove(e.target.value)}
                className="bg-transparent text-xl font-bold focus:outline-none w-full"
              />
              <div className="flex items-center gap-2 bg-zinc-800/50 px-3 py-1.5 rounded-full border border-border">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: TOKENS.LP.color }} />
                <span className="font-bold text-sm">LP</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 p-3 rounded-xl border border-border">
              <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Receiving {TOKENS.TOKEN_A.symbol}</p>
              <p className="font-mono font-bold">0.00</p>
            </div>
            <div className="bg-white/5 p-3 rounded-xl border border-border">
              <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Receiving {TOKENS.TOKEN_B.symbol}</p>
              <p className="font-mono font-bold">0.00</p>
            </div>
          </div>

          <button
            onClick={isConnected ? handleRemove : connectWallet}
            disabled={isConnected && (!lpToRemove || txStatus.status === "pending")}
            className="w-full py-4 rounded-2xl bg-danger/10 text-danger border border-danger/20 font-bold transition-all active:scale-95 flex items-center justify-center gap-2 hover:bg-danger/20"
          >
            {txStatus.status === "pending" && <Loader2 className="w-5 h-5 animate-spin" />}
            {!isConnected ? "Connect Wallet" : "Remove Liquidity"}
          </button>
        </div>
      )}

      {/* Stats Section */}
      <div className="mt-8 border-t border-border pt-6">
        <h3 className="text-sm font-bold text-zinc-400 mb-4 flex items-center gap-2">
          <Info className="w-4 h-4" /> Pool Statistics
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Total Reserves</p>
            <div className="flex flex-col font-mono text-sm">
              <span>{poolStats?.reserveA || "0.00"} {TOKENS.TOKEN_A.symbol}</span>
              <span>{poolStats?.reserveB || "0.00"} {TOKENS.TOKEN_B.symbol}</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Your Position</p>
            <div className="flex flex-col font-mono text-sm">
              <span className="text-primary">{myPosition?.poolShare || "0.00%"} Share</span>
              <span>{myPosition?.lpBalance || "0.00"} LP</span>
            </div>
          </div>
        </div>
      </div>

      {txStatus.status === "success" && (
        <div className="absolute inset-0 bg-background/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 text-center">
           <CheckCircle2 className="w-12 h-12 text-success mb-2" />
           <p className="font-bold">Liquidity Updated!</p>
           <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 bg-primary rounded-xl text-sm">Close</button>
        </div>
      )}
    </div>
  );
};
