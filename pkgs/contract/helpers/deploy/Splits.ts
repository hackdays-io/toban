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

export const deploySplitsCreator = async (
	splitFactoryAddress: Address,
	fractionTokenAddress: Address,
	forwarderAddress: Address
) => {
	const SplitsCreator = await viem.deployContract("SplitsCreator", [
		splitFactoryAddress,
		fractionTokenAddress,
		forwarderAddress,
	]);

	return { SplitsCreator };
};
