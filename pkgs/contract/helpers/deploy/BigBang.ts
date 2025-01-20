import { ethers, upgrades, viem } from "hardhat";
import type { Address } from "viem";

export type BigBang = Awaited<ReturnType<typeof deployBigBang>>["BigBang"];

export const deployBigBang = async (params: {
	hatsContractAddress: Address;
	hatsModuleFacotryAddress: Address;
	hatsTimeFrameModule_impl: Address;
	hatsHatCreatorModule_impl: Address;
	splitsCreatorFactoryAddress: Address;
	splitsFactoryV2Address: Address;
	fractionTokenAddress: Address;
}) => {
  /*
	const BigBang = await viem.deployContract("BigBang", [
		params.trustedForwarder,
		params.hatsContractAddress,
		params.hatsModuleFacotryAddress,
		params.hatsTimeFrameModule_impl,
		params.hatsHatCreatorModule_impl,
		params.splitsCreatorFactoryAddress,
		params.splitsFactoryV2Address,
		params.fractionTokenAddress,
	]);
	*/

	const bigBang = await ethers.getContractFactory("BigBang");
	const _BigBang = await upgrades.deployProxy(
		bigBang,
		[
			params.hatsContractAddress,
			params.hatsModuleFacotryAddress,
			params.hatsTimeFrameModule_impl,
			params.hatsHatCreatorModule_impl,
			params.splitsCreatorFactoryAddress,
			params.splitsFactoryV2Address,
			params.fractionTokenAddress,
		],
		{
			initializer: "initialize",
		}
	);

  await _BigBang.waitForDeployment();
  const address = await _BigBang.getAddress();

  // create a new instance of the contract
  const BigBang = await viem.getContractAt("BigBang", address as Address);

  return { BigBang };
};
