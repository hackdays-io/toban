export const abbreviateAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};
export const isValidEthAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};
