import {
	Address,
	decodeEventLog,
	formatEther,
	parseEther,
	PublicClient,
	WalletClient,
	zeroAddress,
} from "viem";
import {
	deployFractionToken,
	FractionToken,
} from "../helpers/deploy/FractionToken";
import { deployHatsProtocol, Hats } from "../helpers/deploy/Hats";
import {
	deploySplitsCreator,
	deploySplitsProtocol,
	PullSplitsFactory,
	PushSplitsFactory,
	SplitsCreator,
	SplitsWarehouse,
} from "../helpers/deploy/Splits";
import { viem } from "hardhat";
import { expect } from "chai";
import { signTx } from "../utils/signTx";

describe("Wallet Test", () => {
	let address0: WalletClient;
	let address1: WalletClient;
	const secretKey0 = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
	// const address1 = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

	before(async () => {
		[address0, address1] = await viem.getWalletClients();
	});

	it("should sign with viem", async () => {
		expect(await signTx(secretKey0, address1.account?.address!)).to.match(/^0x[0-9a-fA-F]+$/);
	});
});
