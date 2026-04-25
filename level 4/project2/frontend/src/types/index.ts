export interface Token {
  id: string;
  symbol: string;
  name: string;
  decimals: number;
  color: string;
}

export interface PoolReserves {
  reserveA: string;
  reserveB: string;
  totalLpSupply: string;
}

export interface SwapQuote {
  amountIn: string;
  amountOut: string;
  feePaid: string;
  priceImpactBps: number;
  priceImpactPercent: string;
  executionPrice: string;
  minimumReceived: string;
  route: string;
  isHighImpact: boolean;
}

export interface LiquidityPosition {
  lpBalance: string;
  poolShare: string;
  tokenAOwned: string;
  tokenBOwned: string;
}

export interface PoolStats {
  reserveA: string;
  reserveB: string;
  totalLpSupply: string;
  swapCount: number;
  volumeA: string;
  volumeB: string;
  priceAtoB: string;
  priceBtoA: string;
  tvlEstimate: string;
}

export interface TxStatus {
  status: "idle" | "pending" | "success" | "fail";
  step: string;
  hash: string | null;
  explorerUrl: string | null;
  error: AppError | null;
}

export interface ContractEvent {
  type: "swap" | "liquidity_added" | "liquidity_removed" | "pool_registered" | "price_updated";
  data: Record<string, any>;
  timestamp: Date;
  txHash: string;
  ledger: number;
}

export interface AppError {
  type: string;
  message: string;
  action?: "retry" | "dismiss" | "install_wallet" | "friendbot";
  hash?: string;
}

export interface PricePoint {
  time: number;
  price: number;
  volume: number;
}

export interface ChartData {
  priceHistory: PricePoint[];
  volumeHistory: PricePoint[];
  period: "1H" | "24H" | "7D" | "30D";
}
