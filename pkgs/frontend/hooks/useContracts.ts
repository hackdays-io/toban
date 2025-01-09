import { FRACTION_TOKEN_ABI } from "abi/fractiontoken";
import { HATS_ABI } from "abi/hats";
import { HATS_TIME_FRAME_MODULE_ABI } from "abi/hatsTimeFrameModule";
import type { Address } from "viem";

export const BIGBANG_ADDRESS = import.meta.env.VITE_BIGBANG_ADDRESS;
export const HATS_ADDRESS = import.meta.env.VITE_HATS_ADDRESS;
export const FRACTION_TOKEN_ADDRESS = import.meta.env
  .VITE_FRACTION_TOKEN_ADDRESS;
export const SPLITS_CREATOR_ADDRESS = import.meta.env
  .VITE_SPLITS_CREATOR_ADDRESS;

export const hatsContractBaseConfig = {
  address: HATS_ADDRESS as Address,
  abi: HATS_ABI,
};

export const hatsTimeFrameContractBaseConfig = (
  hatsTimeFrameModuleAddress: Address,
) => ({
  address: hatsTimeFrameModuleAddress,
  abi: HATS_TIME_FRAME_MODULE_ABI,
});

export const fractionTokenBaseConfig = {
  address: FRACTION_TOKEN_ADDRESS as Address,
  abi: FRACTION_TOKEN_ABI,
};
