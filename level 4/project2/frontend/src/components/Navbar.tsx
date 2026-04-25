import React from "react";
import { useWallet } from "../hooks/useWallet";
import { Wallet, LogOut, Activity } from "lucide-react";

export const Navbar: React.FC = () => {
  const { isConnected, publicKey, xlmBalance, connectWallet, disconnectWallet, isLoading } = useWallet();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border px-4 py-3">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
            <Activity className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight">Stellar DEX <span className="text-primary">Mini</span></h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">AMM Testnet v1.0</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isConnected ? (
            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-xs text-zinc-500 font-mono">
                  {xlmBalance ? `${parseFloat(xlmBalance).toFixed(2)} XLM` : "Loading..."}
                </span>
                <span className="text-xs font-mono text-primary">
                  {publicKey?.slice(0, 4)}...{publicKey?.slice(-4)}
                </span>
              </div>
              <button
                onClick={disconnectWallet}
                className="p-2 hover:bg-danger/10 hover:text-danger rounded-lg transition-colors"
                title="Disconnect"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              disabled={isLoading}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-medium transition-all active:scale-95 shadow-lg shadow-primary/25 disabled:opacity-50"
            >
              <Wallet className="w-4 h-4" />
              {isLoading ? "Connecting..." : "Connect Wallet"}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};
