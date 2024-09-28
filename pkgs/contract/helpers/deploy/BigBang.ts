import { viem } from "hardhat";
import { Address } from "viem";

export type BigBang = Awaited<ReturnType<typeof deployBigBang>>["BigBang"];

export const deployBigBang = async (params: {
	trustedForwarder: Address;
	hatsContractAddress: Address;
	hatsModuleFacotryAddress: Address;
	hatsTimeFrameModule_impl: Address;
	splitsCreatorFactoryAddress: Address;
}) => {
	const BigBang = await viem.deployContract("BigBang", [
		params.trustedForwarder,
		params.hatsContractAddress,
		params.hatsModuleFacotryAddress,
		params.hatsTimeFrameModule_impl,
		params.splitsCreatorFactoryAddress,
	]);

	return { BigBang };
};
