import { viem } from "hardhat";

export type SplitsWarehouse = Awaited<
	ReturnType<typeof deploySplitsProtocol>
>["SplitsWarehouse"];

export type PullSplitsFactory = Awaited<
	ReturnType<typeof deploySplitsProtocol>
>["PullSplitsFactory"];

export type PushSplitsFactory = Awaited<
	ReturnType<typeof deploySplitsProtocol>
>["PushSplitsFactory"];

export const deploySplitsProtocol = async () => {
	const SplitsWarehouse = await viem.deployContract("SplitsWarehouse", [
		"ETH",
		"ETH",
	]);

	const PullSplitsFactory = await viem.deployContract("PullSplitFactory", [
		SplitsWarehouse.address,
	]);

	const PushSplitsFactory = await viem.deployContract("PushSplitFactory", [
		SplitsWarehouse.address,
	]);

	return {
		SplitsWarehouse,
		PullSplitsFactory,
		PushSplitsFactory,
	};
};

export const deploySplitCreator = async (
	splitFactoryAddress: string,
	fractionTokenAddress: string,
	forwarderAddress: string
) => {
	const SplitCreator = await viem.deployContract("SplitCreator", [
		splitFactoryAddress,
		fractionTokenAddress,
		forwarderAddress,
	]);

	return { SplitCreator };
};
