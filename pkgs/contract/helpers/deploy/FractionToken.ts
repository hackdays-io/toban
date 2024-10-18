import { ethers, upgrades } from "hardhat";
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
	const fractionToken = await ethers.getContractFactory("FractionToken");
	const FractionToken = await upgrades.deployProxy(
		fractionToken,
		[uri, tokenSupply, hatsContractAddress, forwarderAddress],
		{
			initializer: "initialize",
		}
	);

	const tx = await FractionToken.deploymentTransaction();
	await tx?.wait();

	return { FractionToken };
};
