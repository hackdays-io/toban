/**
 * Hardhat 3 task options always have a default value, so options that were
 * required (`addParam`) in Hardhat 2 default to "" and are checked here.
 */
export const requireOption = (value: string, name: string): string => {
  if (value === "") {
    throw new Error(`Missing required option --${name}`);
  }
  return value;
};
