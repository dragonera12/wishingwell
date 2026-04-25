import { Asset } from "@stellar/stellar-sdk";

// ─── Original token contract IDs (used by the deployed pool) ──────────────
// These MUST match what the pool contract was initialized with.
// Do not change without redeploying the pool.
export const ORIGINAL_TOKEN_A_ID = "CAPDIMEQSEQ46QVAU5UGG226IC45MXEDAKYWHUMUQ4763Q5DQ5EX5A4D";
export const ORIGINAL_TOKEN_B_ID = "CAYMQMO6UGAG556IJPAWLWWTGFCTN5LKIIQCCUZ6DYETH63VLULD323R";

// ─── RNDM Issuer for Classic Asset (wallet visibility only) ───────────────
// This is separate from the pool tokens. Used by the Faucet to send
// a Classic RNDM asset that shows up in Freighter.
export const RNDM_ISSUER_SECRET = "SCK6O7B6ZBGBKIFNWA5BTRRF7SO23MIZSEFQRBQV5OV5LOVCO5HO4JUD";
export const RNDM_ISSUER_PUBLIC = "GBZOLFASCCGMZHWKMF5GVEDEXTV2HD2W3BKW6SP5D5CPKQ3T75T36I5G";
// Alias for use in balance hooks
export const RNDM_ISSUER = RNDM_ISSUER_PUBLIC;

// ─── Classic Stellar Assets (for Freighter wallet visibility) ─────────────
export const XLM_ASSET = Asset.native();
export const RNDM_ASSET = new Asset("RNDM", RNDM_ISSUER_PUBLIC);

export const CONFIG = {
  FACTORY_CONTRACT_ID: "CC6XX5QZTRPAHY2NU23LE6RKJUAQIQVHJURLU2VRKMV43XZWPOA7CGTT",
  POOL_CONTRACT_ID: "CBBUB3VBWGXF5R6TQEE5C4ZFMFCKCLXSQHJW7SPGMRG6RIYTTC77T6FP",
  // Pool tokens — must match what pool was initialized with
  TOKEN_A_ID: ORIGINAL_TOKEN_A_ID,
  TOKEN_B_ID: ORIGINAL_TOKEN_B_ID,
  LP_TOKEN_ID: "CDC2OC3E4EN627VVQHGX65FBAG5V6TZJUXJVY4EDWVPIW6CLOGXH7AZM",
  SOROBAN_RPC_URL: "https://soroban-testnet.stellar.org",
  HORIZON_URL: "https://horizon-testnet.stellar.org",
  NETWORK_PASSPHRASE: "Test SDF Network ; September 2015",
  NETWORK: "testnet" as const,
  STELLAR_EXPERT_BASE: "https://stellar.expert/explorer/testnet",
  STROOPS_PER_XLM: 10_000_000,
  DEFAULT_SLIPPAGE_BPS: 50,
  MAX_SLIPPAGE_BPS: 500,
  POOL_FEE_BPS: 30,
} as const;

export const TOKENS = {
  TOKEN_A: {
    id: ORIGINAL_TOKEN_A_ID,
    symbol: "tXLM",
    name: "Test XLM (Pool Token)",
    decimals: 7,
    color: "#7DF9FF",
    asset: XLM_ASSET,
    isNative: false,
  },
  TOKEN_B: {
    id: ORIGINAL_TOKEN_B_ID,
    symbol: "tRNDM",
    name: "Test RNDM (Pool Token)",
    decimals: 7,
    color: "#f59e0b",
    asset: RNDM_ASSET,
    isNative: false,
  },
  LP: {
    id: "CDC2OC3E4EN627VVQHGX65FBAG5V6TZJUXJVY4EDWVPIW6CLOGXH7AZM",
    symbol: "XLM-RNDM-LP",
    name: "XLM-RNDM LP Token",
    decimals: 7,
    color: "#a855f7",
    asset: null,
    isNative: false,
  },
} as const;
