import { expect } from "chai";
import { viem } from "hardhat";
import { decodeEventLog, PublicClient, WalletClient, zeroAddress } from "viem";
import {
	deployFractionToken,
	FractionToken,
} from "../helpers/deploy/FractionToken";
import { deployHatsProtocol, Hats } from "../helpers/deploy/Hats";

describe("FractionToken", () => {
	let Hats: Hats;
	let FractionToken: FractionToken;

	let address1: WalletClient;
	let address2: WalletClient;
	let address3: WalletClient;
	let address4: WalletClient;

	let hatId: bigint;
	let topHatId: bigint;

	let publicClient: PublicClient;

	before(async () => {
		const { Hats: _Hats } = await deployHatsProtocol();
		Hats = _Hats;

		const { FractionToken: _FractionToken } = await deployFractionToken(
			"",
			10000n,
			Hats.address,
			zeroAddress
		);
		FractionToken = _FractionToken;

		[address1, address2, address3, address4] = await viem.getWalletClients();

		publicClient = await viem.getPublicClient();

		let tx1 = await Hats.write.mintTopHat([
			address1.account?.address!,
			"Description",
			"https://test.com/tophat.png",
		]);

		let receipt1 = await publicClient.waitForTransactionReceipt({
			hash: tx1,
		});

		for (const log of receipt1.logs) {
			try {
				const decodedLog = decodeEventLog({
					abi: Hats.abi,
					data: log.data,
					topics: log.topics,
				});
				if (decodedLog.eventName === "HatCreated") topHatId = decodedLog.args.id;
			} catch (error) {}
		}

		let tx2 = await Hats.write.createHat([
			BigInt(
				"0x0000000100000000000000000000000000000000000000000000000000000000"
			),
			"role1",
			10,
			"0x0000000000000000000000000000000000004a75",
			"0x0000000000000000000000000000000000004a75",
			true,
			"https://test.com/hat_image.png",
		]);

		let receipt2 = await publicClient.waitForTransactionReceipt({
			hash: tx2,
		});

		for (const log of receipt2.logs) {
			try {
				const decodedLog = decodeEventLog({
					abi: Hats.abi,
					data: log.data,
					topics: log.topics,
				});
				if (decodedLog.eventName === "HatCreated") hatId = decodedLog.args.id;
			} catch (error) {}
		}

		// address2,address3にHatをmint
		await Hats.write.mintHat([hatId, address2.account?.address!]);
		await Hats.write.mintHat([hatId, address3.account?.address!]);
	});

	it("should mint, transfer and burn tokens", async () => {
		// address1がaddress2,address3にtokenをmint
		await FractionToken.write.mintInitialSupply(
			[
				hatId,
				address2.account?.address!,
				10000n,
			],
			{
				account: address1.account!,
			}
		);
		await FractionToken.write.mintInitialSupply(
			[
				hatId,
				address3.account?.address!,
				10000n,
			],
			{
				account: address1.account!,
			}
		);

		const tokenId = await FractionToken.read.getTokenId([
			hatId,
			address2.account?.address!,
		]);

		// address2のtokenの半分をaddress4に移動
		await FractionToken.write.safeTransferFrom(
			[
				address2.account?.address!,
				address4.account?.address!,
				tokenId,
				5000n,
				"0x",
			],
			{
				account: address2.account!,
			}
		);

		// address2のtokenをaddress1が半分burnする
		await FractionToken.write.burn(
			[
				address2.account?.address!,
				address2.account?.address!,
				hatId,
				2500n
			],
			{
				account: address1.account!,
			}
		);

		let balance: bigint;

		// address2のbalance
		balance = await FractionToken.read.balanceOf([
			address2.account?.address!,
			address2.account?.address!,
			hatId,
		]);
		expect(balance).to.equal(2500n);

		// address3のbalance
		balance = await FractionToken.read.balanceOf([
			address3.account?.address!,
			address3.account?.address!,
			hatId,
		]);
		expect(balance).to.equal(10000n);

		// address4のbalance
		balance = await FractionToken.read.balanceOf([
			address4.account?.address!,
			address2.account?.address!,
			hatId,
		]);
		expect(balance).to.equal(5000n);
	});

	it("should fail to mint a token", async () => {
		// 権限のない人にtokenはmintできない
		await FractionToken.write
			.mintInitialSupply([hatId, address4.account?.address!, 10000n])
			.catch((error: any) => {
				expect(error.message).to.include("Not authorized");
			});

		// tokenは二度mintできない
		await FractionToken.write
			.mintInitialSupply([hatId, address2.account?.address!, 10000n])
			.catch((error: any) => {
				expect(error.message).to.include("This account has already received");
			});
	});

	it("should fail to burn a token", async () => {
		// address2のtokenはaddress3によってburnできない
		await FractionToken.write
			.burn(
				[
					address2.account?.address!,
					address2.account?.address!,
					hatId,
					5000n,
				],
				{
					account: address3.account!,
				}
			)
			.catch((error: any) => {
				expect(error.message).to.include("Not authorized");
			});
	});
});
