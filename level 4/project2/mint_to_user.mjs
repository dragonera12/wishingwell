import {
  Keypair, Contract, TransactionBuilder, Account,
  Address, xdr, Networks, rpc as SorobanRpc, scValToNative
} from "@stellar/stellar-sdk";

const server = new SorobanRpc.Server("https://soroban-testnet.stellar.org");

const ADMIN_SECRET = "SDP74OMXFAX7VCFRFTK6L3K7PHDDJMG2ZU54F55AO7VRNPNPEVUKENYP";
const adminKeypair = Keypair.fromSecret(ADMIN_SECRET);

const USER_ADDR = "GDIR6SHIGWGZAUFEYVTYHJHRO2BOVET3W45AYTZLYXMMIIVZONJ05VU7";
const TOKEN_A = "CAPDIMEQSEQ46QVAU5UGG226IC45MXEDAKYWHUMUQ4763Q5DQ5EX5A4D";
const TOKEN_B = "CAYMQMO6UGAG556IJPAWLWWTGFCTN5LKIIQCCUZ6DYETH63VLULD323R";
const AMOUNT = 50000000000n; // 5000 tokens with 7 decimals

function i128ToScVal(val) {
  return xdr.ScVal.scvI128(
    new xdr.Int128Parts({
      hi: xdr.Int64.fromString((val >> 64n).toString()),
      lo: xdr.Uint64.fromString((val & 0xFFFFFFFFFFFFFFFFn).toString()),
    })
  );
}

async function mintTo(tokenId, recipient, amount) {
  const contract = new Contract(tokenId);
  const account = await server.getAccount(adminKeypair.publicKey());
  
  const tx = new TransactionBuilder(account, {
    fee: "10000",
    networkPassphrase: Networks.TESTNET,
  })
  .addOperation(contract.call(
    "mint",
    Address.fromString(adminKeypair.publicKey()).toScVal(),
    Address.fromString(recipient).toScVal(),
    i128ToScVal(amount)
  ))
  .setTimeout(30)
  .build();

  const sim = await server.simulateTransaction(tx);
  if (!SorobanRpc.Api.isSimulationSuccess(sim)) {
    throw new Error("Simulation failed: " + JSON.stringify(sim.error));
  }

  const prepared = SorobanRpc.assembleTransaction(tx, sim).build();
  prepared.sign(adminKeypair);

  const response = await server.sendTransaction(prepared);
  console.log("Submit status:", response.status, response.hash);
  
  if (response.status === "PENDING") {
    let result;
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 1500));
      result = await server.getTransaction(response.hash);
      if (result.status !== "NOT_FOUND") break;
    }
    if (result?.status !== "SUCCESS") throw new Error("Tx failed: " + result?.status);
    return result;
  }
  throw new Error("Submit failed: " + response.status);
}

async function checkBalance(tokenId, address) {
  const contract = new Contract(tokenId);
  const account = await server.getAccount(adminKeypair.publicKey());
  const tx = new TransactionBuilder(account, { fee: "100", networkPassphrase: Networks.TESTNET })
    .addOperation(contract.call("balance", Address.fromString(address).toScVal()))
    .setTimeout(30)
    .build();
  const sim = await server.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationSuccess(sim) && sim.result) {
    return scValToNative(sim.result.retval).toString();
  }
  return "ERROR";
}

async function main() {
  console.log("Admin:", adminKeypair.publicKey());
  console.log("User:", USER_ADDR);
  
  console.log("\nMinting 5000 Token A (XLM)...");
  await mintTo(TOKEN_A, USER_ADDR, AMOUNT);
  console.log("✅ Token A minted!");

  console.log("\nMinting 5000 Token B (RNDM)...");
  await mintTo(TOKEN_B, USER_ADDR, AMOUNT);
  console.log("✅ Token B minted!");

  console.log("\nFinal balances for user:");
  console.log("Token A:", await checkBalance(TOKEN_A, USER_ADDR), "(raw units)");
  console.log("Token B:", await checkBalance(TOKEN_B, USER_ADDR), "(raw units)");
  console.log("\n(Divide by 10,000,000 to get display amount)");
}

main().catch(e => { console.error("FAILED:", e.message); process.exit(1); });
