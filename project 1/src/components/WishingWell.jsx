import React, { useState } from "react";
import { isValidWish } from "../utils/stellar";

const WishingWell = ({ onSendWish, isLoading, isConnected }) => {
  const [wish, setWish] = useState("");
  const [amount, setAmount] = useState(1);
  const [isTossing, setIsTossing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isConnected) return;
    if (amount < 1) return;
    if (!isValidWish(wish)) return;

    setIsTossing(true);
    
    // Simulate coin toss animation duration before calling the logic
    setTimeout(async () => {
      try {
        await onSendWish(wish, amount);
        setWish("");
        setAmount(1);
      } catch (err) {
        console.error("Wish failed:", err);
      } finally {
        setIsTossing(false);
      }
    }, 1200);
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6">
      {/* The Wishing Well Visual */}
      <div className="relative mb-16 h-64 w-64 md:h-80 md:w-80">
        {/* Ripple Animations */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute border border-purple-500/30 rounded-full animate-ripple ring-1 w-full h-full"></div>
          <div className="absolute border border-purple-500/30 rounded-full animate-ripple ring-2 w-[120%] h-[120%] [animation-delay:1s] opacity-60"></div>
          <div className="absolute border border-purple-500/30 rounded-full animate-ripple ring-3 w-[140%] h-[140%] [animation-delay:2s] opacity-30"></div>
        </div>

        {/* The Well Cylinder */}
        <div className="absolute inset-4 rounded-full border-4 border-amber-600/50 bg-[#0a0a20] shadow-[inset_0_0_50px_rgba(124,58,237,0.3)] overflow-hidden flex items-center justify-center">
            {/* Water Surface */}
            <div className="absolute inset-0 bg-gradient-to-b from-blue-900/40 to-purple-900/60 transition-opacity">
                {/* Simulated waves */}
                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_0%,transparent_60%)] animate-pulse"></div>
            </div>
            <span className="text-amber-500/20 font-serif text-8xl select-none">✧</span>
        </div>

        {/* The Coin Animation */}
        {isTossing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="w-5 h-5 bg-[radial-gradient(circle,#f59e0b_0%,#b45309_100%)] rounded-full shadow-[0_0_10px_#f59e0b,inset_0_0_5px_rgba(255,255,255,0.5)] animate-toss"></div>
          </div>
        )}
      </div>

      {/* The Input Form */}
      <form 
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-[#161633]/80 backdrop-blur-lg p-8 rounded-3xl border border-white/5 shadow-2xl space-y-6"
      >
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-serif text-amber-500">Make a Wish</h2>
          <p className="text-gray-400 text-sm">Cast your wish into the cosmic well</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-purple-300 font-semibold px-1">Your Wish (Max 28 chars)</label>
            <input
              type="text"
              value={wish}
              onChange={(e) => setWish(e.target.value)}
              placeholder="Health and happiness..."
              maxLength={28}
              className="w-full bg-[#0a0a20] border border-purple-500/20 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-amber-500/50 transition-colors"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-purple-300 font-semibold px-1">XLM to Toss (Min 1.0)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value))}
              step="0.1"
              min="1"
              className="w-full bg-[#0a0a20] border border-purple-500/20 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-amber-500/50 transition-colors"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!isConnected || isLoading || isTossing}
          className="w-full bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-500 hover:to-amber-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-900/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:transform-none"
        >
          {isLoading ? "Processing Wish..." : isTossing ? "Tossing Coin..." : (!isConnected ? "Connect Wallet First" : "Toss Coin Into Well")}
        </button>
      </form>
    </div>
  );
};

export default WishingWell;
