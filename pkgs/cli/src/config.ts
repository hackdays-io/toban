import { Address } from "viem";
import { HATS_ABI } from "./abi/hats";
import { HATS_TIME_FRAME_MODULE_ABI } from "./abi/hatsTimeFrameModule";

export const hatsContractBaseConfig = {
	address: "0x0000000000000000000000000000000000004a75" as Address,
	abi: HATS_ABI,
};

export const hatsTimeFrameContractBaseConfig = {
	address: "0xd4a66507ea8c8382fa8474ed6cae4163676a434a" as Address,
	abi: HATS_TIME_FRAME_MODULE_ABI,
};
