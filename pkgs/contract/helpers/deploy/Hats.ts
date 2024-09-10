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

export type BigBang = Awaited<ReturnType<typeof deployBigBang>>["BigBang"];

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

export const deployBigBang = async (
	forwarderAddress: Address = zeroAddress,
	hatsAddress: string = "0x3bc1A0Ad72417f2d411118085256fC53CBdDd137" // Hats Protocol CA
) => {
	const BigBang = await viem.deployContract("BigBang", [
		forwarderAddress,
		hatsAddress,
	]);

	return { BigBang };
};
