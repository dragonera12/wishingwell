/**
 * Shortens a Stellar public key for display
 * @param {string} address 
 * @returns {string} truncated address (e.g. GABC...XYZ)
 */
export const truncateAddress = (address) => {
  if (!address) return "";
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

/**
 * Formats a raw XLM amount for display
 * @param {string|number} amount 
 * @returns {string}
 */
export const formatAmount = (amount) => {
  if (amount === undefined || amount === null) return "0.00";
  return parseFloat(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 7,
  });
};

/**
 * Validates if the wish text is within Stellar memo limits (28 bytes)
 * @param {string} wish 
 * @returns {boolean}
 */
export const isValidWish = (wish) => {
  return wish && wish.length > 0 && wish.length <= 28;
};

/**
 * Returns the URL for a transaction on Stellar Expert
 * @param {string} txHash 
 * @returns {string}
 */
export const getExplorerLink = (txHash) => {
  return `https://stellar.expert/explorer/testnet/tx/${txHash}`;
};
