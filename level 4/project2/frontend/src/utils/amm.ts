// Mirror the contract's AMM formulas for instant UI previews

export function getAmountOut(
  amountIn: bigint,
  reserveIn: bigint,
  reserveOut: bigint,
  feeBps: bigint = 30n
): bigint {
  if (amountIn === 0n || reserveIn === 0n || reserveOut === 0n) return 0n;
  const amountInWithFee = amountIn * (10000n - feeBps);
  const numerator = amountInWithFee * reserveOut;
  const denominator = reserveIn * 10000n + amountInWithFee;
  return numerator / denominator;
}

export function getPriceImpactBps(
  amountIn: bigint,
  amountOut: bigint,
  reserveIn: bigint,
  reserveOut: bigint,
): number {
  if (amountIn === 0n || reserveIn === 0n) return 0;
  const midPrice = (reserveOut * 100000000n) / reserveIn;
  const execPrice = (amountOut * 100000000n) / amountIn;
  if (midPrice <= execPrice) return 0;
  return Number(((midPrice - execPrice) * 10000n) / midPrice);
}

export function getLpTokensToMint(
  amountA: bigint,
  amountB: bigint,
  reserveA: bigint,
  reserveB: bigint,
  totalLp: bigint,
): bigint {
  if (totalLp === 0n) {
    return sqrt(amountA * amountB);
  }
  const lpA = (amountA * totalLp) / reserveA;
  const lpB = (amountB * totalLp) / reserveB;
  return lpA < lpB ? lpA : lpB;
}

export function getTokensFromLp(
  lpAmount: bigint,
  reserveA: bigint,
  reserveB: bigint,
  totalLp: bigint,
): [bigint, bigint] {
  if (totalLp === 0n) return [0n, 0n];
  const amountA = (lpAmount * reserveA) / totalLp;
  const amountB = (lpAmount * reserveB) / totalLp;
  return [amountA, amountB];
}

function sqrt(n: bigint): bigint {
  if (n < 0n) throw new Error("Square root of negative");
  if (n < 2n) return n;
  let x = n;
  let y = (x + 1n) / 2n;
  while (y < x) {
    x = y;
    y = (x + n / x) / 2n;
  }
  return x;
}

export function formatUnits(amount: bigint | string, decimals: number = 7): string {
  const s = amount.toString().padStart(decimals + 1, "0");
  const pivot = s.length - decimals;
  const res = s.slice(0, pivot) + "." + s.slice(pivot);
  return res.replace(/\.?0+$/, "");
}

export function parseUnits(amount: string, decimals: number = 7): bigint {
  if (!amount || amount === ".") return 0n;
  const [int, dec = ""] = amount.split(".");
  const paddedDec = dec.padEnd(decimals, "0").slice(0, decimals);
  return BigInt(int + paddedDec);
}
