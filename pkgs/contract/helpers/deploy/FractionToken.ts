import { ethers, upgrades, viem } from "hardhat";
import { Address } from "viem";

export type FractionToken = Awaited<
	ReturnType<typeof deployFractionToken>
>["FractionToken"];

export const deployFractionToken = async (
	uri: string,
	tokenSupply: bigint = 10000n,
	hatsContractAddress: Address
) => {
	const fractionToken = await ethers.getContractFactory("FractionToken");
	const _FractionToken = await upgrades.deployProxy(
		fractionToken,
		[uri, tokenSupply, hatsContractAddress],
		{
			initializer: "initialize",
		}
	);

	await _FractionToken.waitForDeployment();
	const address = await _FractionToken.getAddress();

	// create a new instance of the contract
	const FractionToken = await viem.getContractAt(
		"FractionToken",
		address as Address
	);

	return { FractionToken };
};
