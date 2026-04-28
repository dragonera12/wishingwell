import React from "react";
import { truncateAddress, formatAmount, getExplorerLink } from "../utils/stellar";

const WishCard = ({ wish }) => {
  const { wish: text, amount, txHash, timestamp, walletAddress } = wish;
  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="bg-[#1a1a3a]/40 backdrop-blur-sm p-5 rounded-2xl border border-white/5 hover:border-amber-500/20 transition-all duration-300 group">
      <div className="flex justify-between items-start mb-3">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-purple-400 font-semibold">Wishmaker</span>
          <span className="text-amber-500/80 font-mono text-xs">{truncateAddress(walletAddress)}</span>
        </div>
        <div className="text-right">
          <div className="text-amber-400 font-bold text-sm">
            {formatAmount(amount)} <span className="text-[10px]">XLM</span>
          </div>
          <div className="text-[10px] text-gray-500">{timeAgo(timestamp)}</div>
        </div>
      </div>
      
      <p className="text-white text-lg font-serif mb-4 leading-relaxed group-hover:text-amber-100 transition-colors italic">
        "{text}"
      </p>

      <a
        href={getExplorerLink(txHash)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center text-[10px] text-purple-400 hover:text-amber-400 transition-colors uppercase tracking-widest font-bold"
      >
        View on Explorer
        <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </div>
  );
};

export default WishCard;
