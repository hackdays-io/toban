import { viem } from "hardhat";
import { Address } from "viem";

export type FractionToken = Awaited<
	ReturnType<typeof deployFractionToken>
>["FractionToken"];

export const deployFractionToken = async (
	uri: string,
	tokenSupply: bigint = 10000n,
	hatsContractAddress: Address,
	forwarderAddress: Address
) => {
	const FractionToken = await viem.deployContract("FractionToken", [
		uri,
		tokenSupply,
		hatsContractAddress,
		forwarderAddress,
	]);

	return { FractionToken };
};
