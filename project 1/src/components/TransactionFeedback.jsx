import React from "react";
import { getExplorerLink } from "../utils/stellar";

const TransactionFeedback = ({ status, data, onClose }) => {
  if (!status) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#0a0a1a]/80 backdrop-blur-sm">
      <div className="relative w-full max-w-sm bg-[#1a1a3a] border border-white/10 rounded-3xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] transform animate-in fade-in zoom-in duration-300">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {status === "success" ? (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-serif text-white">Wish Received!</h3>
              <p className="text-gray-400 text-sm">Your tribute has been accepted by the well.</p>
            </div>
            
            <div className="bg-[#0a0a20] rounded-2xl p-4 text-left border border-white/5">
                <div className="text-[10px] uppercase text-purple-400 font-bold mb-1">Transaction Hash</div>
                <div className="text-amber-500 font-mono text-[10px] break-all mb-4">{data.txHash}</div>
                <a
                  href={getExplorerLink(data.txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-colors text-sm"
                >
                  View on Explorer
                </a>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto border border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-serif text-white">Wish Lost...</h3>
              <p className="text-red-400/80 text-sm">{data.error || "The cosmos rejected your tribute."}</p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors border border-white/10"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionFeedback;
