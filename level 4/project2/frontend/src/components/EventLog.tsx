import React, { useState } from "react";
import { useEvents } from "../hooks/useEvents";
import {
  History, ExternalLink, ArrowRightLeft, Droplets,
  Loader2, X, Hash, Layers, Clock, TrendingUp, Zap
} from "lucide-react";
import { CONFIG } from "../config";
import type { ContractEvent } from "../types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TxDetailModal: React.FC<{ event: ContractEvent; onClose: () => void }> = ({ event, onClose }) => {
  const explorerUrl = `${CONFIG.STELLAR_EXPERT_BASE}/tx/${event.txHash}`;
  const formattedTime = event.timestamp instanceof Date
    ? event.timestamp.toLocaleTimeString()
    : "Unknown";

  const dataRows = [
    { icon: Hash, label: "Tx Hash", value: `${event.txHash.slice(0, 12)}...${event.txHash.slice(-10)}`, full: event.txHash },
    { icon: Layers, label: "Ledger", value: String(event.ledger) },
    { icon: Clock, label: "Time", value: formattedTime },
    { icon: TrendingUp, label: "Type", value: event.type.replace("_", " ").toUpperCase() },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm glass rounded-3xl p-6 border border-border shadow-2xl z-10"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className={cn(
              "p-2 rounded-xl",
              event.type === "swap" ? "bg-primary/15 text-primary" : "bg-success/15 text-success"
            )}>
              {event.type === "swap" ? <ArrowRightLeft className="w-5 h-5" /> : <Droplets className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-base capitalize">{event.type.replace("_", " ")}</h3>
              <p className="text-[10px] text-success font-mono uppercase">● Success</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-zinc-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Data rows */}
        <div className="space-y-3">
          {dataRows.map(({ icon: Icon, label, value, full }) => (
            <div key={label} className="flex justify-between items-start py-2 border-b border-zinc-800/60 last:border-0">
              <div className="flex items-center gap-2 text-zinc-500">
                <Icon className="w-3.5 h-3.5" />
                <span className="text-xs">{label}</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono text-zinc-200">{value}</span>
                {full && (
                  <button
                    onClick={() => navigator.clipboard.writeText(full)}
                    className="block text-[10px] text-primary/60 hover:text-primary transition-colors mt-0.5"
                  >
                    copy full hash
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Event data if available */}
          {event.data && typeof event.data === "object" && (
            <div className="py-2 border-b border-zinc-800/60">
              <div className="flex items-center gap-2 text-zinc-500 mb-2">
                <Zap className="w-3.5 h-3.5" />
                <span className="text-xs">Contract Data</span>
              </div>
              <pre className="text-[10px] text-zinc-400 font-mono bg-zinc-900/50 rounded-xl p-2 overflow-auto max-h-24">
                {JSON.stringify(event.data, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Explorer Link */}
        <a
          href={explorerUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-5 flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-sm transition-colors border border-primary/20"
        >
          <ExternalLink className="w-4 h-4" />
          View on Stellar Expert
        </a>
      </div>
    </div>
  );
};

export const EventLog: React.FC = () => {
  const { events } = useEvents();
  const [selectedEvent, setSelectedEvent] = useState<ContractEvent | null>(null);

  return (
    <>
      <div className="w-full card-glow glass rounded-3xl p-6 h-[400px] flex flex-col">
        <div className="flex items-center gap-2 mb-6">
          <History className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Live Activity</h2>
          {events.length > 0 && (
            <span className="ml-auto text-[10px] text-zinc-600 font-mono">{events.length} events</span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-2">
              <Loader2 className="w-8 h-8 animate-spin opacity-20" />
              <p className="text-xs font-mono uppercase tracking-widest">Awaiting Events...</p>
            </div>
          ) : (
            events.map((event, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedEvent(event)}
                className="w-full flex items-center justify-between group hover:bg-white/5 rounded-xl px-2 py-1.5 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    event.type === "swap" ? "bg-primary/10 text-primary" : "bg-success/10 text-success"
                  )}>
                    {event.type === "swap"
                      ? <ArrowRightLeft className="w-4 h-4" />
                      : <Droplets className="w-4 h-4" />
                    }
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold capitalize">{event.type.replace("_", " ")}</p>
                    <p className="text-[10px] text-zinc-500 font-mono">Ledger: {event.ledger}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <span className="text-[10px] text-zinc-600 font-mono">details</span>
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {selectedEvent && (
        <TxDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </>
  );
};
