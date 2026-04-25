import { rpc } from "@stellar/stellar-sdk";
console.log(typeof rpc.Server.prototype.prepareTransaction);
console.log(typeof rpc.Server.prototype.simulateTransaction);
console.log(typeof rpc.assembleTransaction);
