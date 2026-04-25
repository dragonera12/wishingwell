import {
  rpc,
  xdr,
  Address,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { CONFIG } from "../config";

export const server = new rpc.Server(CONFIG.SOROBAN_RPC_URL);

/**
 * Executes the full VoltPay transaction lifecycle:
 * Build -> Prepare -> Sign -> Raw Fetch Send -> Raw Fetch Poll
 * This bypasses SDK bugs related to XDR parsing ("Bad union switch: 4").
 */
export async function signAndSubmit(
  publicKey: string,
  operation: xdr.Operation,
  signTransaction: (xdr: string) => Promise<string>
) {
  // 1. Load account
  const account = await server.getAccount(publicKey);

  // 2. Build Transaction
  let tx = new TransactionBuilder(account, {
    fee: "100000",
    networkPassphrase: CONFIG.NETWORK_PASSPHRASE,
  })
    .addOperation(operation)
    .setTimeout(180)
    .build();

  // 3. Simulate and Prepare
  tx = await server.prepareTransaction(tx);

  // 4. Sign with Freighter
  const signedXDR = await signTransaction(tx.toXDR());
  if (!signedXDR) throw new Error("Signing failed or rejected by user");

  // 5. Submit via raw fetch to bypass TransactionBuilder.fromXDR bugs
  const rpcRes = await fetch(CONFIG.SOROBAN_RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method: "sendTransaction",
      params: {
        transaction: signedXDR,
      },
    }),
  });

  const json = await rpcRes.json();
  if (json.error) {
    throw new Error(`RPC Error: ${json.error.message || JSON.stringify(json.error)}`);
  }

  const response = json.result;
  if (response.status === "ERROR") {
    throw new Error(`Transaction failed: ${JSON.stringify(response.errorResultXdr)}`);
  }

  // 6. Safe Polling
  let status = "PENDING";
  let retries = 0;
  while ((status === "PENDING" || status === "NOT_FOUND") && retries < 60) {
    await new Promise((r) => setTimeout(r, 1000));
    retries++;
    const pollRes = await fetch(CONFIG.SOROBAN_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method: "getTransaction",
        params: { hash: response.hash },
      }),
    });
    const pollJson = await pollRes.json();
    if (pollJson.result) {
      status = pollJson.result.status;
      if (status === "FAILED") {
        throw new Error("Transaction failed on-chain");
      }
    }
  }

  if (status === "PENDING" || status === "NOT_FOUND") {
    throw new Error("Transaction polling timed out");
  }

  return response.hash;
}

// Works for both G-addresses (accounts) and C-addresses (contracts)
export const addrToScVal = (addr: string): xdr.ScVal => {
  return new Address(addr).toScVal();
};

export const i128ToScVal = (n: bigint): xdr.ScVal => {
  const parts = {
    lo: xdr.Uint64.fromString((n & 0xFFFFFFFFFFFFFFFFn).toString()),
    hi: xdr.Int64.fromString((n >> 64n).toString()),
  };
  return xdr.ScVal.scvI128(new xdr.Int128Parts(parts));
};
