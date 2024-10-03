import { Address } from "viem";
import { HATS_ABI } from "./abi/hats";
import { HATS_TIME_FRAME_MODULE_ABI } from "./abi/hatsTimeFrameModule";
import { BIGBANG_ABI } from "./abi/bigbang";

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
