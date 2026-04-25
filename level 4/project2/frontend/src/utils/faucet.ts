import {
  Keypair,
  TransactionBuilder,
  Networks,
  Operation,
  Horizon,
  rpc as SorobanRpc,
  Contract,
  xdr,
  Address,
} from "@stellar/stellar-sdk";
import { RNDM_ASSET, RNDM_ISSUER_SECRET, CONFIG, ORIGINAL_TOKEN_A_ID, ORIGINAL_TOKEN_B_ID } from "../config";

const HORIZON_SERVER = new Horizon.Server(CONFIG.HORIZON_URL);
const SOROBAN_SERVER = new SorobanRpc.Server(CONFIG.SOROBAN_RPC_URL);

// ─── Helpers ───────────────────────────────────────────────────────────────
function addrToScVal(addr: string): xdr.ScVal {
  return new Address(addr).toScVal();
}

function i128ToScVal(val: bigint): xdr.ScVal {
  return xdr.ScVal.scvI128(new xdr.Int128Parts({
    hi: xdr.Int64.fromString((val >> 64n).toString()),
    lo: xdr.Uint64.fromString((val & 0xFFFFFFFFFFFFFFFFn).toString()),
  }));
}

// ─── Soroban mint (for pool tokens — these show in the dApp balance) ──────
const ADMIN_SECRET = "SDP74OMXFAX7VCFRFTK6L3K7PHDDJMG2ZU54F55AO7VRNPNPEVUKENYP";
const SOROBAN_MINT_AMOUNT = 50_000_000_000n; // 5000 tokens (7 decimals)

async function sorobanMint(tokenId: string, recipientAddress: string): Promise<void> {
  const adminKeypair = Keypair.fromSecret(ADMIN_SECRET);
  const contract = new Contract(tokenId);
  const account = await SOROBAN_SERVER.getAccount(adminKeypair.publicKey());

  const tx = new TransactionBuilder(account, {
    fee: "10000",
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(contract.call(
      "mint",
      addrToScVal(adminKeypair.publicKey()),
      addrToScVal(recipientAddress),
      i128ToScVal(SOROBAN_MINT_AMOUNT)
    ))
    .setTimeout(30)
    .build();

  const sim = await SOROBAN_SERVER.simulateTransaction(tx);
  if (!SorobanRpc.Api.isSimulationSuccess(sim)) {
    throw new Error("Mint simulation failed: " + (sim as any).error);
  }

  const prepared = SorobanRpc.assembleTransaction(tx, sim).build();
  prepared.sign(adminKeypair);
  const response = await SOROBAN_SERVER.sendTransaction(prepared);

  if (response.status === "PENDING") {
    for (let i = 0; i < 25; i++) {
      await new Promise(r => setTimeout(r, 2000));
      try {
        const res = await fetch(CONFIG.SOROBAN_RPC_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getTransaction", params: { hash: response.hash } }),
        });
        const json = await res.json();
        if (json.result?.status === "SUCCESS") return;
        if (json.result?.status === "FAILED") throw new Error("Mint failed on chain");
      } catch (e: any) {
        if (e.message?.includes("Mint failed")) throw e;
      }
    }
    throw new Error("Mint timed out");
  }
  if (response.status === "ERROR") throw new Error("Mint submission failed");
}

// ─── Classic Stellar trustline helpers ────────────────────────────────────
export async function hasTrustline(publicKey: string): Promise<boolean> {
  try {
    const account = await HORIZON_SERVER.loadAccount(publicKey);
    return account.balances.some(
      (b: any) => b.asset_code === "RNDM" && b.asset_issuer === RNDM_ASSET.getIssuer()
    );
  } catch {
    return false;
  }
}

export async function establishTrustline(
  publicKey: string,
  signTransaction: (xdr: string) => Promise<string>
): Promise<void> {
  const account = await HORIZON_SERVER.loadAccount(publicKey);
  const tx = new TransactionBuilder(account, {
    fee: "1000",
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(Operation.changeTrust({ asset: RNDM_ASSET, limit: "1000000" }))
    .setTimeout(30)
    .build();

  const signedXdr = await signTransaction(tx.toXDR());
  const signedTx = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);
  const response = await HORIZON_SERVER.submitTransaction(signedTx);
  if (!response.successful) throw new Error("Trustline transaction failed");
}

// ─── Mint both pool tokens (Soroban) + Classic RNDM if trustline exists ───
export async function mintTestTokens(
  recipientAddress: string,
  // @ts-ignore
  signTransaction: (xdr: string) => Promise<string>
): Promise<{ needsTrustline: boolean }> {
  const trusted = await hasTrustline(recipientAddress);
  if (!trusted) return { needsTrustline: true };

  // 1. Mint Soroban pool tokens (shows in dApp balance)
  await sorobanMint(ORIGINAL_TOKEN_A_ID, recipientAddress);
  await sorobanMint(ORIGINAL_TOKEN_B_ID, recipientAddress);

  // 2. Send Classic RNDM (shows in Freighter wallet)
  try {
    const issuerKeypair = Keypair.fromSecret(RNDM_ISSUER_SECRET);
    const issuerAccount = await HORIZON_SERVER.loadAccount(issuerKeypair.publicKey());
    const tx = new TransactionBuilder(issuerAccount, {
      fee: "1000",
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(Operation.payment({
        destination: recipientAddress,
        asset: RNDM_ASSET,
        amount: "5000",
      }))
      .setTimeout(30)
      .build();
    tx.sign(issuerKeypair);
    await HORIZON_SERVER.submitTransaction(tx);
  } catch (e) {
    console.warn("Classic RNDM payment failed (non-critical):", e);
  }

  return { needsTrustline: false };
}

// ─── Balance helpers ───────────────────────────────────────────────────────
export async function getRndmBalance(publicKey: string): Promise<string> {
  try {
    const account = await HORIZON_SERVER.loadAccount(publicKey);
    const b = account.balances.find(
      (b: any) => b.asset_code === "RNDM" && b.asset_issuer === RNDM_ASSET.getIssuer()
    );
    return b ? parseFloat(b.balance).toFixed(2) : "0.00";
  } catch { return "0.00"; }
}

export async function getXlmBalance(publicKey: string): Promise<string> {
  try {
    const account = await HORIZON_SERVER.loadAccount(publicKey);
    const b = account.balances.find((b: any) => b.asset_type === "native");
    return b ? parseFloat(b.balance).toFixed(2) : "0.00";
  } catch { return "0.00"; }
}
