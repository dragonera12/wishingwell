import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TOKENS } from "../config";

const data = [
  { name: "00:00", price: 1.05 },
  { name: "04:00", price: 1.08 },
  { name: "08:00", price: 1.02 },
  { name: "12:00", price: 1.12 },
  { name: "16:00", price: 1.09 },
  { name: "20:00", price: 1.15 },
  { name: "23:59", price: 1.18 },
];

export const PriceChart: React.FC = () => {
  return (
    <div className="w-full h-[300px] card-glow glass rounded-3xl p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">
            {TOKENS.TOKEN_A.symbol} / {TOKENS.TOKEN_B.symbol}
          </p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-bold font-mono">1.1824</h2>
            <span className="text-success text-sm font-bold font-mono">+2.45%</span>
          </div>
        </div>
        <div className="flex bg-background p-1 rounded-lg text-[10px] font-bold">
          <button className="px-2 py-1 rounded bg-zinc-800 text-white">1H</button>
          <button className="px-2 py-1 text-zinc-500 hover:text-white">24H</button>
          <button className="px-2 py-1 text-zinc-500 hover:text-white">7D</button>
        </div>
      </div>

      <div className="w-full h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={TOKENS.TOKEN_A.color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={TOKENS.TOKEN_A.color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e2433" />
            <XAxis 
              dataKey="name" 
              hide 
            />
            <YAxis 
              hide 
              domain={['dataMin - 0.05', 'dataMax + 0.05']}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: "#0e1117", border: "1px solid #1e2433", borderRadius: "12px" }}
              itemStyle={{ color: TOKENS.TOKEN_A.color }}
            />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke={TOKENS.TOKEN_A.color} 
              fillOpacity={1} 
              fill="url(#colorPrice)" 
              strokeWidth={3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
