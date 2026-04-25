import {
  Keypair, Contract, TransactionBuilder,
  xdr, Networks, rpc as SorobanRpc, scValToNative, StrKey
} from "@stellar/stellar-sdk";

const server = new SorobanRpc.Server("https://soroban-testnet.stellar.org");
const ADMIN_SECRET = "SDP74OMXFAX7VCFRFTK6L3K7PHDDJMG2ZU54F55AO7VRNPNPEVUKENYP";
const adminKeypair = Keypair.fromSecret(ADMIN_SECRET);

const USER_ADDR = "GDIR6SHIGWGZAUFEYVTYHJHRO2BOVET3W45AYTZLYXMMIIVZONJ05VU7";
const TOKEN_A = "CAPDIMEQSEQ46QVAU5UGG226IC45MXEDAKYWHUMUQ4763Q5DQ5EX5A4D";
const TOKEN_B = "CAYMQMO6UGAG556IJPAWLWWTGFCTN5LKIIQCCUZ6DYETH63VLULD323R";
const AMOUNT = 50000000000n; // 5000 tokens × 1e7

function addrToScVal(addr) {
  if (addr.startsWith("G")) {
    const raw = StrKey.decodeEd25519PublicKey(addr);
    const accountId = xdr.AccountId.publicKeyTypeEd25519(raw);
    return xdr.ScVal.scvAddress(xdr.ScAddress.scAddressTypeAccount(accountId));
  }
  // C address (contract)
  const raw = StrKey.decodeContract(addr);
  return xdr.ScVal.scvAddress(xdr.ScAddress.scAddressTypeContract(raw));
}

function i128ToScVal(val) {
  return xdr.ScVal.scvI128(new xdr.Int128Parts({
    hi: xdr.Int64.fromString((val >> 64n).toString()),
    lo: xdr.Uint64.fromString((val & 0xFFFFFFFFFFFFFFFFn).toString()),
  }));
}

async function mintTo(tokenId, recipient, amount) {
  const contract = new Contract(tokenId);
  const account = await server.getAccount(adminKeypair.publicKey());
  const tx = new TransactionBuilder(account, { fee: "10000", networkPassphrase: Networks.TESTNET })
    .addOperation(contract.call(
      "mint",
      addrToScVal(adminKeypair.publicKey()),
      addrToScVal(recipient),
      i128ToScVal(amount)
    ))
    .setTimeout(30).build();

  const sim = await server.simulateTransaction(tx);
  if (!SorobanRpc.Api.isSimulationSuccess(sim)) throw new Error("Sim failed: " + JSON.stringify(sim.error));

  const prepared = SorobanRpc.assembleTransaction(tx, sim).build();
  prepared.sign(adminKeypair);
  const response = await server.sendTransaction(prepared);
  console.log("  Submit:", response.status, response.hash?.slice(0, 16) + "...");

  if (response.status === "PENDING") {
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 1500));
      const result = await server.getTransaction(response.hash);
      if (result.status === "SUCCESS") return result;
      if (result.status === "FAILED") throw new Error("Tx FAILED on-chain");
    }
    throw new Error("Timeout");
  }
  throw new Error("Submit: " + response.status);
}

async function checkBalance(tokenId, address) {
  const contract = new Contract(tokenId);
  const account = await server.getAccount(adminKeypair.publicKey());
  const tx = new TransactionBuilder(account, { fee: "100", networkPassphrase: Networks.TESTNET })
    .addOperation(contract.call("balance", addrToScVal(address)))
    .setTimeout(30).build();
  const sim = await server.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationSuccess(sim) && sim.result)
    return (Number(scValToNative(sim.result.retval)) / 1e7).toFixed(2);
  return "ERROR";
}

async function main() {
  console.log("Admin:", adminKeypair.publicKey());
  console.log("User:", USER_ADDR);

  console.log("\nMinting 5000 XLM (Token A)...");
  await mintTo(TOKEN_A, USER_ADDR, AMOUNT);
  console.log("✅ Token A done!");

  console.log("\nMinting 5000 RNDM (Token B)...");
  await mintTo(TOKEN_B, USER_ADDR, AMOUNT);
  console.log("✅ Token B done!");

  console.log("\n--- User balances ---");
  console.log("XLM :", await checkBalance(TOKEN_A, USER_ADDR));
  console.log("RNDM:", await checkBalance(TOKEN_B, USER_ADDR));
}

main().catch(e => { console.error("FAILED:", e.message); process.exit(1); });
