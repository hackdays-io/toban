import { viem } from "hardhat";
import { Address } from "viem";

export type SplitsWarehouse = Awaited<
	ReturnType<typeof deploySplitsProtocol>
>["SplitsWarehouse"];

export type PullSplitsFactory = Awaited<
	ReturnType<typeof deploySplitsProtocol>
>["PullSplitsFactory"];

export type PushSplitsFactory = Awaited<
	ReturnType<typeof deploySplitsProtocol>
>["PushSplitsFactory"];

export type SplitsCreatorFactory = Awaited<
	ReturnType<typeof deploySplitsCreatorFactory>
>["SplitsCreatorFactory"];

export type SplitsCreator = Awaited<
	ReturnType<typeof deploySplitsCreator>
>["SplitsCreator"];

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

export const deploySplitsCreatorFactory = async (
	splitsCreatorImpl: Address
) => {
	const SplitsCreatorFactory = await viem.deployContract(
		"SplitsCreatorFactory",
		[splitsCreatorImpl]
	);

	return { SplitsCreatorFactory };
};

export const deploySplitsCreator = async () => {
	const SplitsCreator = await viem.deployContract("SplitsCreator");

	return { SplitsCreator };
};
