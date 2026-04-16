import { useState } from "react";
import {
  isAllowed,
  setAllowed,
  getAddress,
  signTransaction,
  isConnected as checkFreighterConnected,
} from "@stellar/freighter-api";
import {
  Account,
  Horizon,
  TransactionBuilder,
  Asset,
  Operation,
  Memo,
  Networks,
  BASE_FEE,
} from "@stellar/stellar-sdk";
import { WELL_ADDRESS, HORIZON_URL, NETWORK_PASSPHRASE } from "../config";

const server = new Horizon.Server(HORIZON_URL);

/**
 * STANDALONE FORCE-FETCHER
 */
async function forceFetchBalance(address, setBalance, setError, retries = 3) {
  if (!address || address.length < 20) {
    console.warn("IRONCLAD [WARN]: Invalid address for fetch:", address);
    return;
  }
  
  console.log(`IRONCLAD [1]: Force-fetching (Attempt ${4 - retries}) for:`, address);
  try {
    const url = `${HORIZON_URL}/accounts/${address}`;
    const response = await window.fetch(url);
    
    if (response.status === 404) {
      setBalance("0");
      setError("Account not found. Fund it with Friendbot below.");
      return;
    }
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    const native = data.balances?.find(b => b.asset_type === "native");
    setBalance(native ? native.balance : "0");
    setError(null);
  } catch (err) {
    console.error("IRONCLAD ERR:", err);
    if (retries > 0) {
      console.log("IRONCLAD: Retrying fetch in 2 seconds...");
      await new Promise(r => setTimeout(r, 2000));
      return forceFetchBalance(address, setBalance, setError, retries - 1);
    }
    setError(`Network Error: ${err.message}. Please check your connection.`);
  }
}

export const useStellar = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [publicKey, setPublicKey] = useState("");
  const [balance, setBalance] = useState("0");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const connectWallet = async () => {
    console.log("IRON-CONN [1]: Started");
    setIsLoading(true);
    setError(null);
    try {
      const connected = await checkFreighterConnected();
      if (!connected) throw new Error("Freighter wallet not found.");

      // FORCE AUTHORIZATION: Always request access to ensure popup appears
      console.log("FORCE-AUTH: Re-requesting access...");
      await setAllowed();

      console.log("IRON-CONN [3]: Retrieving address...");
      const result = await getAddress();
      const address = result.address;
      
      if (!address) {
        throw new Error("Wallet returned empty. Ensure you are logged in and shared the address in the popup.");
      }
      
      console.log("IRON-CONN [4]: Success:", address);
      setPublicKey(address);
      setIsConnected(true);
      
      window.setTimeout(() => forceFetchBalance(address, setBalance, setError), 600);
    } catch (err) {
      console.error("IRON-CONN ERR:", err);
      setError(err.message || "Failed to connect.");
    } finally {
      setIsLoading(false);
    }
  };

  const setManualAddress = (address) => {
    if (!address || address.length < 20) return;
    setPublicKey(address);
    setIsConnected(true);
    forceFetchBalance(address, setBalance, setError);
  };

  const fundAccount = async () => {
    if (!publicKey) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await window.fetch(`https://friendbot.stellar.org/?addr=${publicKey}`);
      if (!response.ok) throw new Error("Friendbot failed to fund account.");
      window.setTimeout(() => forceFetchBalance(publicKey, setBalance, setError), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = () => {
    setPublicKey("");
    setIsConnected(false);
    setBalance("0");
    setError(null);
  };

  const sendWish = async (wishText, amount) => {
    if (!isConnected || !publicKey) throw new Error("Wallet not connected");
    setIsLoading(true);
    setError(null);
    try {
      console.log("SEND-WISH [1]: Fetching sequence for", publicKey);
      const resp = await window.fetch(`${HORIZON_URL}/accounts/${publicKey}`);
      const accData = await resp.json();
      
      // Use the simple Account class (more stable in browser environments)
      const sourceAccount = new Account(publicKey, accData.sequence);
      
      console.log("SEND-WISH [2]: Building transaction...");
      const transaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          Operation.payment({
            destination: WELL_ADDRESS,
            asset: Asset.native(),
            amount: amount.toString(),
          })
        )
        .addMemo(Memo.text(wishText))
        .setTimeout(30)
        .build();

      const xdr = transaction.toXDR();
      console.log("SEND-WISH [3]: Transaction XDR built:", xdr);
      
      const resultObj = await signTransaction(xdr, { 
        networkPassphrase: NETWORK_PASSPHRASE 
      });
      console.log("SEND-WISH [4]: Response received:", resultObj);
      
      // Extract the raw XDR string (Freighter returns an object { signedTxXdr, ... })
      const signedXdr = typeof resultObj === 'string' ? resultObj : resultObj.signedTxXdr;
      
      if (!signedXdr) throw new Error("No signature received from wallet.");
      
      // Explicitly decode the signed envelope
      const signedTransaction = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
      const result = await server.submitTransaction(signedTransaction);
      
      console.log("SEND-WISH [5]: Success! Hash:", result.hash);
      window.setTimeout(() => forceFetchBalance(publicKey, setBalance, setError), 2000);
      return { txHash: result.hash };
    } catch (err) {
      setError(`Transaction failed: ${err.message}`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isConnected,
    publicKey,
    balance,
    connectWallet,
    disconnectWallet,
    sendWish,
    fundAccount,
    isLoading,
    error,
    refreshBalance: () => forceFetchBalance(publicKey, setBalance, setError),
    setManualAddress,
  };
};
