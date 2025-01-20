import type { Address } from "viem";
import { BIGBANG_ABI } from "./abi/bigbang";
import { FRACTION_TOKEN_ABI } from "./abi/fractiontoken";
import { HATS_ABI } from "./abi/hats";
import { HATS_TIME_FRAME_MODULE_ABI } from "./abi/hatsTimeFrameModule";

export const skipPreActionCommands = ["wallet>add", "wallet>list"];

export const hatsContractBaseConfig = {
  address: "0x3bc1A0Ad72417f2d411118085256fC53CBdDd137" as Address,
  abi: HATS_ABI,
};

export const hatsTimeFrameContractBaseConfig = {
  abi: HATS_TIME_FRAME_MODULE_ABI,
};

export const bigbangContractBaseConfig = {
  address: "0x5d7a64Cc808294C516076d371685ed4E6aDd6337" as Address,
  abi: BIGBANG_ABI,
};

export const fractionTokenBaseConfig = {
  address: "0xb8f7ca7a5b1e457b8735884419e114f90d53e1d5" as Address,
  abi: FRACTION_TOKEN_ABI,
};
