import { ethers, upgrades, viem } from "hardhat";
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
	forwarderAddress: Address,
	splitsCreatorImpl: Address
) => {
	const splitsCreatorFactory = await ethers.getContractFactory("SplitsCreatorFactory");

	const _SplitsCreatorFactory = await upgrades.deployProxy(
		splitsCreatorFactory,
		[
			forwarderAddress,
			splitsCreatorImpl
		],
		{
			initializer: "initialize",
		}
	);

	await _SplitsCreatorFactory.waitForDeployment();
	const address = await _SplitsCreatorFactory.getAddress();

	// create a new instance of the contract
	const SplitsCreatorFactory = await viem.getContractAt(
		"SplitsCreatorFactory",
		address as Address
	);

	return { SplitsCreatorFactory };
};

export const deploySplitsCreator = async () => {
	const SplitsCreator = await viem.deployContract("SplitsCreator");

	return { SplitsCreator };
};
