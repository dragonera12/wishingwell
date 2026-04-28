import React, { useState, useEffect } from "react";
import { useStellar } from "./hooks/useStellar";
import WalletConnect from "./components/WalletConnect";
import WishingWell from "./components/WishingWell";
import WishBoard from "./components/WishBoard";
import TransactionFeedback from "./components/TransactionFeedback";

function App() {
  const {
    isConnected,
    publicKey,
    balance,
    connectWallet,
    disconnectWallet,
    sendWish,
    fundAccount,
    refreshBalance,
    setManualAddress, // Added
    isLoading,
    error,
  } = useStellar();

  const [wishes, setWishes] = useState([]);
  const [feedback, setFeedback] = useState(null); // { status: 'success' | 'error', data: { txHash, error } }

  // Load wishes from localStorage on mount
  useEffect(() => {
    const savedWishes = localStorage.getItem("stellar_wishes");
    if (savedWishes) {
      setWishes(JSON.parse(savedWishes));
    }
  }, []);

  const handleSendWish = async (wishText, amount) => {
    try {
      const result = await sendWish(wishText, amount);
      
      const newWish = {
        wish: wishText,
        amount,
        txHash: result.txHash,
        timestamp: new Date().toISOString(),
        walletAddress: publicKey,
      };

      const updatedWishes = [newWish, ...wishes].slice(0, 10);
      setWishes(updatedWishes);
      localStorage.setItem("stellar_wishes", JSON.stringify(updatedWishes));
      
      setFeedback({ status: "success", data: { txHash: result.txHash } });
    } catch (err) {
      setFeedback({ status: "error", data: { error: err.message } });
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white font-sans selection:bg-amber-500/30">
      {/* Mystical Background Stars */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white rounded-full animate-pulse"></div>
        <div className="absolute top-3/4 left-1/2 w-1 h-1 bg-purple-400 rounded-full animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-3/4 w-1.5 h-1.5 bg-amber-200 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute top-1/3 left-10 w-0.5 h-0.5 bg-white rounded-full animate-pulse delay-300"></div>
      </div>

      {error && !feedback && (
        <div className="relative z-50 bg-red-500/20 border-b border-red-500/50 py-3 px-6 text-center animate-in slide-in-from-top duration-300">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <p className="text-red-400 text-sm font-medium flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              {error}
            </p>
            <div className="flex items-center gap-2">
              {error.includes("Fund it to activate") && (
                <button
                  onClick={fundAccount}
                  disabled={isLoading}
                  className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold py-1.5 px-4 rounded-lg transition-all transform active:scale-95 disabled:opacity-50"
                >
                  {isLoading ? "Funding..." : "Fund via Friendbot"}
                </button>
              )}
              <button
                onClick={refreshBalance}
                disabled={isLoading}
                className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-1.5 px-4 rounded-lg transition-all transform active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                <svg className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-8 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-amber-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/20">
            <span className="text-black font-serif text-xl font-bold">W</span>
          </div>
          <h1 className="text-2xl font-serif font-bold tracking-tight text-white hidden sm:block">
            Stellar <span className="text-amber-500">Wishing Well</span>
          </h1>
        </div>
        
        <WalletConnect
          isConnected={isConnected}
          publicKey={publicKey}
          balance={balance}
          connectWallet={connectWallet}
          disconnectWallet={disconnectWallet}
          isLoading={isLoading}
          setManualAddress={setManualAddress}
        />
      </header>

      <main className="relative z-10">
        <section className="container mx-auto">
          <WishingWell 
            onSendWish={handleSendWish} 
            isLoading={isLoading} 
            isConnected={isConnected} 
          />
        </section>

        <section className="bg-[#0f0f25]/50 border-y border-white/5 backdrop-blur-sm">
          <WishBoard wishes={wishes} />
        </section>
      </main>

      <footer className="relative z-10 py-12 px-6 text-center text-gray-500 text-sm border-t border-white/5">
        <p>&copy; {new Date().getFullYear()} Stellar Wishing Well. Decentralized Magic on the Stellar Testnet.</p>
        <div className="mt-4 flex justify-center gap-6">
            <a href="https://stellar.org" target="_blank" rel="noreferrer" className="hover:text-amber-500 transition-colors">Stellar.org</a>
            <a href="https://freighter.app" target="_blank" rel="noreferrer" className="hover:text-purple-400 transition-colors">Freighter Wallet</a>
        </div>
      </footer>

      <TransactionFeedback 
        status={feedback?.status} 
        data={feedback?.data} 
        onClose={() => setFeedback(null)} 
      />
    </div>
  );
}

export default App;
