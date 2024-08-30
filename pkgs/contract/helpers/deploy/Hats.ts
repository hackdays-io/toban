import { viem } from "hardhat";
import { Address, zeroAddress } from "viem";

export type Hats = Awaited<ReturnType<typeof deployHatsProtocol>>["Hats"];

export type HatsModuleFactory = Awaited<
	ReturnType<typeof deployHatsModuleFactory>
>["HatsModuleFactory"];

export type HatsModule = Awaited<
	ReturnType<typeof deployEmptyHatsModule>
>["HatsModule"];

export type HatsTimeFrameModule = Awaited<
	ReturnType<typeof deployHatsTimeFrameModule>
>["HatsTimeFrameModule"];

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
	const HatsModule = await viem.deployContract("HatsModule", ["0.0.0"]);

	return { HatsModule };
};

export const deployHatsTimeFrameModule = async (
	forwarderAddress: Address = zeroAddress,
	version: string = "0.0.0"
) => {
	const HatsTimeFrameModule = await viem.deployContract("HatsTimeFrameModule", [
		forwarderAddress,
		version,
	]);

	return { HatsTimeFrameModule };
};
