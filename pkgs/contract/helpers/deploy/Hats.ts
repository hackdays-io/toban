import { viem } from "hardhat";
import { Address } from "viem";

export type Hats = Awaited<ReturnType<typeof deployHatsProtocol>>["Hats"];

export type HatsModuleFactory = Awaited<
	ReturnType<typeof deployHatsModuleFactory>
>["HatsModuleFactory"];

export type HatsModule = Awaited<
	ReturnType<typeof deployEmptyHatsModule>
>["HatsModule"];

export const deployHatsProtocol = async () => {
	const Hats = await viem.deployContract("Hats", ["test", "https://test.com"]);

	return { Hats };
};

export const deployHatsModuleFactory = async (hatsAddress: Address) => {
	const HatsModuleFactory = await viem.deployContract("HatsModuleFactory", [
		hatsAddress,
		"0.0.1",
	]);

	return { HatsModuleFactory };
};

export const deployEmptyHatsModule = async () => {
	const HatsModule = await viem.deployContract(
		"contracts/hats/module/HatsModule.sol:HatsModule",
		["0.0.0"]
	);

	return { HatsModule };
};
