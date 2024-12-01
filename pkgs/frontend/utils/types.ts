import { Address } from "viem";

export type SplitsInfo = {
  hatId: bigint;
  multiplierBottom: bigint;
  multiplierTop: bigint;
  wearers: Address[];
};
