import { useState, useEffect } from "react";
import { scValToNative } from "@stellar/stellar-sdk";
import { CONFIG } from "../config";
import type { ContractEvent } from "../types";
import { server } from "../utils/contract";

export const useEvents = () => {
  const [events, setEvents] = useState<ContractEvent[]>([]);

  useEffect(() => {
    let isSubscribed = true;
    let lastLedger: number | undefined;

    const fetchEvents = async () => {
      try {
        const latestLedgerRes = await server.getLatestLedger();
        const startLedger = lastLedger || (latestLedgerRes.sequence - 100);

        const response = await server.getEvents({
          startLedger,
          filters: [
            {
              type: "contract",
              contractIds: [CONFIG.POOL_CONTRACT_ID],
            },
          ],
        });

        if (!isSubscribed) return;

        const newEvents: ContractEvent[] = response.events.map((e) => {
          const type = (e.topic[1] as any).symbol || "unknown";
          return {
            type: type === "swap" ? "swap" : (type === "add_liq" ? "liquidity_added" : "price_updated"),
            data: scValToNative(e.value),
            timestamp: new Date(), 
            txHash: e.txHash,
            ledger: e.ledger,
          };
        });

        if (newEvents.length > 0) {
          setEvents((prev) => {
            const combined = [...newEvents, ...prev];
            return combined.filter((v, i, a) => a.findIndex(t => t.txHash === v.txHash) === i).slice(0, 50);
          });
        }

        lastLedger = latestLedgerRes.sequence;
      } catch (e) {
        console.error("Event fetch error", e);
      }
    };

    const interval = setInterval(fetchEvents, 5000);
    fetchEvents();

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, []);

  return { events };
};
