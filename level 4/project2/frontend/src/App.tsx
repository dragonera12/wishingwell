import React, { useState } from "react";
import { Navbar } from "./components/Navbar";
import { SwapCard } from "./components/SwapCard";
import { LiquidityCard } from "./components/LiquidityCard";
import { PriceChart } from "./components/PriceChart";
import { EventLog } from "./components/EventLog";
import { TOKENS } from "./config";
import { LayoutGrid, ArrowRightLeft, Droplets, PieChart as ChartIcon, Zap } from "lucide-react";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"swap" | "pool">("swap");

  return (
    <div className="min-h-screen bg-background text-white selection:bg-primary/30">
      <Navbar />

      <main className="pt-20 sm:pt-24 pb-12 px-3 sm:px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

          {/* ─── Left Column: Swap / Pool ─────────────────────────── */}
          <div className="lg:col-span-4 space-y-4 sm:space-y-6 order-2 lg:order-1">
            {/* Tab Switcher */}
            <div className="flex bg-surface/50 p-1 rounded-2xl border border-border">
              <button
                onClick={() => setActiveTab("swap")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-xl font-bold transition-all text-sm sm:text-base ${
                  activeTab === "swap" ? "bg-primary text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <ArrowRightLeft className="w-4 h-4" /> Swap
              </button>
              <button
                onClick={() => setActiveTab("pool")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-xl font-bold transition-all text-sm sm:text-base ${
                  activeTab === "pool" ? "bg-primary text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Droplets className="w-4 h-4" /> Pool
              </button>
            </div>

            {/* Active Panel */}
            {activeTab === "swap" ? <SwapCard /> : <LiquidityCard />}

            {/* Quick Stats (hidden on mobile for cleanliness) */}
            <div className="card-glow glass rounded-3xl p-5 sm:p-6 hidden lg:block">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-warning" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Quick Stats</h3>
              </div>
              <div className="space-y-3">
                {[
                  ["24h Volume", "$124,502.20", "text-white"],
                  ["Liquidity (TVL)", "$2,410,950.00", "text-success"],
                  ["Fees (24h)", "$373.50", "text-primary"],
                ].map(([label, value, color]) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-sm text-zinc-500">{label}</span>
                    <span className={`font-mono font-bold ${color}`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ─── Right Column: Analytics + Activity ───────────────── */}
          <div className="lg:col-span-8 space-y-6 sm:space-y-8 order-1 lg:order-2">
            {/* Analytics Header */}
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ChartIcon className="w-5 h-5 text-secondary" />
                  <h2 className="text-lg font-bold">Analytics</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-tokenA/10 text-tokenA text-[10px] font-bold rounded-full border border-tokenA/20">
                    USDX: {TOKENS.TOKEN_A.id.slice(0, 4)}...{TOKENS.TOKEN_A.id.slice(-4)}
                  </span>
                  <span className="px-3 py-1 bg-tokenB/10 text-tokenB text-[10px] font-bold rounded-full border border-tokenB/20">
                    EURX: {TOKENS.TOKEN_B.id.slice(0, 4)}...{TOKENS.TOKEN_B.id.slice(-4)}
                  </span>
                </div>
              </div>
              <PriceChart />
            </div>

            {/* Pool Depth + Live Activity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="w-5 h-5 text-zinc-400" />
                  <h2 className="text-lg font-bold">Pool Depth</h2>
                </div>
                <div className="card-glow glass rounded-3xl p-6 h-[300px] sm:h-[400px] flex items-center justify-center text-zinc-500 font-mono text-xs uppercase tracking-widest text-center">
                  Liquidity Depth Visualization<br />Coming Soon
                </div>
              </div>
              <EventLog />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-10 border-t border-border mt-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <div>
            <p className="text-zinc-500 text-sm">Powered by Soroban Smart Contracts on Stellar Testnet</p>
            <p className="text-zinc-600 text-[10px] font-mono mt-1 uppercase tracking-widest">
              AMM Testnet v1.0 — Orange Belt Submission 2026
            </p>
          </div>
          <div className="flex gap-5 text-zinc-500 text-sm">
            <a href="#" className="hover:text-primary transition-colors">Documentation</a>
            <a href="#" className="hover:text-primary transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
