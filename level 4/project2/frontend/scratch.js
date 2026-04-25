import fetch from "node-fetch";

const poolId = "CCDXNJWBR3TXC7NLKEONEU5OC6GS45PIRL5RCTNYV5ODDU47LHNE3MZL";
const rpcUrl = "https://soroban-testnet.stellar.org";

const body = JSON.stringify({
  jsonrpc: "2.0",
  id: 1,
  method: "simulateTransaction",
  params: {
    transaction: "AAAAAgAAAADn0vJ3o1o2zGv6+x083L42O2n5o+Q8r1yO0+4i9J7h/QAAAGQAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAQAAAAAAAAAEAAAAAQAAAADn0vJ3o1o2zGv6+x083L42O2n5o+Q8r1yO0+4i9J7h/QAAABEAAAAwAAAADQAAAAxnZXRfcmVzZXJ2ZXMAAAAAAAAA",
  }
});

fetch(rpcUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body })
  .then(res => res.json())
  .then(console.log)
  .catch(console.error);
