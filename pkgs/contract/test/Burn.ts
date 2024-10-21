import { expect } from "chai";
import { viem } from "hardhat";
import { decodeEventLog, PublicClient, WalletClient, zeroAddress } from "viem";
import {
	deployFractionToken,
	FractionToken,
} from "../helpers/deploy/FractionToken";
import { deployHatsProtocol, Hats } from "../helpers/deploy/Hats";

describe("Burn", () => {
	let Hats: Hats;
	let FractionToken: FractionToken;

	let address1: WalletClient;
	let address2: WalletClient;
	let address3: WalletClient;

	let hatId: bigint;

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

		[address1, address2, address3] = await viem.getWalletClients();

		publicClient = await viem.getPublicClient();

		await Hats.write.mintTopHat([
			address1.account?.address!,
			"Description",
			"https://test.com/tophat.png",
		]);

		let txHash = await Hats.write.createHat([
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

		let receipt = await publicClient.waitForTransactionReceipt({
			hash: txHash,
		});

		for (const log of receipt.logs) {
			try {
				const decodedLog = decodeEventLog({
					abi: Hats.abi,
					data: log.data,
					topics: log.topics,
				});
				if (decodedLog.eventName == "HatCreated") hatId = decodedLog.args.id;
			} catch (error) {}
		}

		// address1とaddress2にHatをmint
		await Hats.write.mintHat([hatId, address1.account?.address!]);
		await Hats.write.mintHat([hatId, address2.account?.address!]);

		// address1とaddress2にFractionTokenをmint
		await FractionToken.write.mint([hatId, address1.account?.address!]);
		await FractionToken.write.mint([hatId, address2.account?.address!]);

		const tokenId = await FractionToken.read.getTokenId([
			hatId,
			address2.account?.address!,
		]);

		// address2のtokenの半分をaddress3に移動
		await FractionToken.write.safeTransferFrom(
			[
				address2.account?.address!,
				address3.account?.address!,
				tokenId,
				5000n,
				"0x",
			],
			{
				account: address2.account!,
			}
		);
	});

	it("should burn tokens", async () => {
		// address1のtokenを自身で半分burnする
		await FractionToken.write.burn(
			[address1.account?.address!, address1.account?.address!, hatId, 5000n],
			{
				account: address1.account!,
			}
		);

		// address3のtokenをaddress2によってすべてburnする
		await FractionToken.write.burn(
			[address3.account?.address!, address2.account?.address!, hatId, 5000n],
			{
				account: address2.account!,
			}
		);

		// address3のtokenをaddress1によってすべてburnするとRevertする
		await expect(
			FractionToken.write.burn(
				[address3.account?.address!, address2.account?.address!, hatId, 5000n],
				{
					account: address1.account!,
				}
			)
		).to.be.rejectedWith("not authorized");

		let balance: bigint;

		// address1のbalance
		balance = await FractionToken.read.balanceOf([
			address1.account?.address!,
			address1.account?.address!,
			hatId,
		]);
		expect(balance).to.equal(5000n);

		// address2のbalance
		balance = await FractionToken.read.balanceOf([
			address2.account?.address!,
			address2.account?.address!,
			hatId,
		]);
		expect(balance).to.equal(5000n);

		// address3のbalance
		balance = await FractionToken.read.balanceOf([
			address3.account?.address!,
			address2.account?.address!,
			hatId,
		]);
		expect(balance).to.equal(0n);
	});
});
