import { Address, zeroAddress } from "viem";
import { deployBigBang } from "../../helpers/deploy/BigBang";
import { deployFractionToken } from "../../helpers/deploy/FractionToken";
import { deployHatsTimeFrameModule } from "../../helpers/deploy/Hats";
import {
	deploySplitsCreator,
	deploySplitsCreatorFactory,
} from "../../helpers/deploy/Splits";

/**
 * Deploy all contracts
 * @returns
 */
const deployAll = async () => {
	const { HatsTimeFrameModule } = await deployHatsTimeFrameModule();

	const { FractionToken } = await deployFractionToken(
		"",
		10000n,
		process.env.HATS_ADDRESS as Address,
		zeroAddress
	);

	const { SplitsCreator } = await deploySplitsCreator();

	const { SplitsCreatorFactory } = await deploySplitsCreatorFactory(
		SplitsCreator.address
	);

	const { BigBang } = await deployBigBang({
		trustedForwarder: zeroAddress,
		hatsContractAddress: process.env.HATS_ADDRESS as Address,
		hatsModuleFacotryAddress: process.env
			.HATS_MODULE_FACTORY_ADDRESS as Address,
		hatsTimeFrameModule_impl: HatsTimeFrameModule.address,
		splitsCreatorFactoryAddress: SplitsCreatorFactory.address,
		splitsFactoryV2Address: process.env.PULL_SPLITS_FACTORY_ADDRESS as Address,
		fractionTokenAddress: FractionToken.address,
	});

	console.log("BigBang deployed at", BigBang.address);
	console.log("FractionToken deployed at", FractionToken.address);
	console.log("SplitsCreatorFactory deployed at", SplitsCreatorFactory.address);
	console.log("SplitsCreator deployed at", SplitsCreator.address);
	console.log("HatsTimeFrameModule deployed at", HatsTimeFrameModule.address);

	return;
};

deployAll();
