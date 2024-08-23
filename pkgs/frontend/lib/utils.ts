export function truncateAddress(address: `0x${string}`): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export const getUint48 = () => {
  // get deadline
  const currentTime = Math.floor(Date.now() / 1000);
  const futureTime = currentTime + 60;
  const uint48Time = BigInt(futureTime) % BigInt(2 ** 48);

  return uint48Time;
};