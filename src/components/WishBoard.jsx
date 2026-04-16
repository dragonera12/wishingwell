import React from "react";
import WishCard from "./WishCard";

const WishBoard = ({ wishes }) => {
  return (
    <div className="w-full max-w-6xl mx-auto py-12 px-6">
      <div className="flex items-center justify-between mb-10">
        <div className="space-y-1">
          <h2 className="text-3xl font-serif text-amber-500">The Wish Board</h2>
          <p className="text-gray-400 text-sm italic">Witness the collective dreams of the cosmos</p>
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/20 to-transparent mx-8 hidden md:block"></div>
        <div className="text-right">
          <span className="text-xs uppercase tracking-widest text-purple-400 font-bold">{wishes.length} Wishes Cast</span>
        </div>
      </div>

      {wishes.length === 0 ? (
        <div className="text-center py-20 bg-[#1a1a3a]/20 rounded-3xl border border-dashed border-white/5">
          <p className="text-gray-500 font-serif text-xl Italics">The board is currently empty. Be the first to make a wish!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishes.map((wish, index) => (
            <WishCard key={wish.txHash || index} wish={wish} />
          ))}
        </div>
      )}
    </div>
  );
};

export default WishBoard;
