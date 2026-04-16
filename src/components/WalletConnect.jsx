import React, { useState } from "react";
import { truncateAddress } from "../utils/stellar";
import { STELLAR_EXPERT_URL } from "../config";

const WalletConnect = ({
  isConnected,
  publicKey,
  balance,
  connectWallet,
  disconnectWallet,
  isLoading,
  setManualAddress,
}) => {
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualAddress, setRawManualAddress] = useState("");

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualAddress.length > 20) {
      setManualAddress(manualAddress);
      setIsManualMode(false);
    }
  };

  if (isConnected) {
    return (
      <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4 animate-in fade-in zoom-in duration-500">
        <div className="hidden md:block">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Account</p>
          <a 
            href={`https://stellar.expert/explorer/testnet/account/${publicKey}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-amber-400 transition-colors"
          >
            {truncateAddress(publicKey)}
          </a>
        </div>
        
        <div className="h-8 w-px bg-white/10 hidden md:block" />
        
        <div className="text-right">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Balance</p>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">
              {balance} XLM
            </span>
          </div>
        </div>

        <button
          onClick={disconnectWallet}
          className="ml-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-bold py-2 px-4 rounded-xl border border-red-500/30 transition-all uppercase tracking-widest"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {isManualMode ? (
        <form onSubmit={handleManualSubmit} className="flex flex-col gap-2 w-full max-w-sm animate-in slide-in-from-right duration-300">
          <input
            type="text"
            value={manualAddress}
            onChange={(e) => setRawManualAddress(e.target.value)}
            placeholder="Paste your Public Key (G...)"
            className="bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-all"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-bold py-2 rounded-xl transition-all"
            >
              Verify Address
            </button>
            <button
              type="button"
              onClick={() => setIsManualMode(false)}
              className="bg-white/10 hover:bg-white/20 text-white font-bold py-2 px-4 rounded-xl transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={connectWallet}
            disabled={isLoading}
            className="group relative bg-gradient-to-br from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-black font-black py-4 px-8 rounded-2xl shadow-xl shadow-amber-500/20 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100"
          >
            <span className="flex items-center gap-3">
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Connecting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                    <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                  </svg>
                  Connect Freighter Wallet
                </>
              )}
            </span>
          </button>
          <button
            onClick={() => setIsManualMode(true)}
            className="text-zinc-500 hover:text-white text-xs underline transition-colors"
          >
            Can't connect? Enter address manually
          </button>
        </div>
      )}
    </div>
  );
};

export default WalletConnect;
