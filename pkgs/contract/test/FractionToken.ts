import { expect } from "chai";
import { viem } from "hardhat";
import { decodeEventLog, PublicClient, WalletClient, zeroAddress } from "viem";
import {
	deployFractionToken,
	FractionToken,
} from "../helpers/deploy/FractionToken";
import { deployHatsProtocol, Hats } from "../helpers/deploy/Hats";
import { upgradeFractionToken } from "../helpers/upgrade/fractionToken";

describe("FractionToken", () => {
	let Hats: Hats;
	let FractionToken: FractionToken;

	let address1: WalletClient;
	let address2: WalletClient;
	let address3: WalletClient;
	let address4: WalletClient;

	let hatId: bigint;

	let publicClient: PublicClient;

	before(async () => {
		// Hatsコントラクトをデプロイする。
		const { Hats: _Hats } = await deployHatsProtocol();
		Hats = _Hats;

		// FractionTokenをデプロイする。
		const { FractionToken: _FractionToken } = await deployFractionToken(
			"",
			10000n,
			Hats.address,
			zeroAddress
		);
		FractionToken = _FractionToken;

		[address1, address2, address3, address4] = await viem.getWalletClients();

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
				if (decodedLog.eventName === "HatCreated") hatId = decodedLog.args.id;
			} catch (error) {}
		}

		// address1,address2,address4にHatをmint
		await Hats.write.mintHat([hatId, address1.account?.address!]);
		await Hats.write.mintHat([hatId, address2.account?.address!]);
	});

	it("should mint, transfer and burn tokens", async () => {
		// address1,address2にtokenをmint
		await FractionToken.write.mint([hatId, address1.account?.address!]);
		await FractionToken.write.mint([hatId, address2.account?.address!]);

		const tokenId = await FractionToken.read.getTokenId([
			hatId,
			address2.account?.address!,
		]);

		// transfer と burn前の残高情報を取得する
		let balance: bigint;

		// 処理前のaddress1のbalance
		balance = await FractionToken.read.balanceOf([
			address1.account?.address!,
			address1.account?.address!,
			hatId,
		]);
		expect(balance).to.equal(10000n);

		// 処理前のaddress2のbalance
		balance = await FractionToken.read.balanceOf([
			address2.account?.address!,
			address2.account?.address!,
			hatId,
		]);
		expect(balance).to.equal(10000n);

		// 処理前のaddress3のbalance
		balance = await FractionToken.read.balanceOf([
			address3.account?.address!,
			address2.account?.address!,
			hatId,
		]);
		expect(balance).to.equal(0n);

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

		// address1のtokenを自ら半分burnする
		await FractionToken.write.burn(
			[address1.account?.address!, address1.account?.address!, hatId, 5000n],
			{
				account: address1.account!,
			}
		);

		// address3のtokenをaddress2によって半分burnする
		await FractionToken.write.burn(
			[address3.account?.address!, address2.account?.address!, hatId, 2500n],
			{
				account: address2.account!,
			}
		);

		// 処理後のaddress1のbalance
		balance = await FractionToken.read.balanceOf([
			address1.account?.address!,
			address1.account?.address!,
			hatId,
		]);
		expect(balance).to.equal(5000n);

		// 処理後のaddress2のbalance
		balance = await FractionToken.read.balanceOf([
			address2.account?.address!,
			address2.account?.address!,
			hatId,
		]);
		expect(balance).to.equal(5000n);

		// 処理後のaddress3のbalance
		balance = await FractionToken.read.balanceOf([
			address3.account?.address!,
			address2.account?.address!,
			hatId,
		]);
		expect(balance).to.equal(2500n);
	});

	it("should fail to mint a token", async () => {
		// roleのない人にtokenはmintできない
		await FractionToken.write
			.mint([hatId, address3.account?.address!])
			.catch((error: any) => {
				expect(error.message).to.include("not authorized");
			});

		// tokenは二度mintできない
		await FractionToken.write
			.mint([hatId, address1.account?.address!])
			.catch((error: any) => {
				expect(error.message).to.include("already received");
			});
	});

	it("should fail to burn a token", async () => {
		// address1のtokenはaddress2によってburnできない
		await FractionToken.write
			.burn([
				address1.account?.address!,
				address1.account?.address!,
				hatId,
				5000n,
			])
			.catch((error: any) => {
				expect(error.message).to.include("not authorized");
			});
	});

	/**
	 * 以降は、Upgradeのテストコードになる。
	 * Upgrade後に再度機能をテストする。
	 */
	describe("Upgrade Test", () => {
		it("upgrde", async () => {
			// FractionTokenをアップグレード
			const newFractionToken = await upgradeFractionToken(
				FractionToken.address,
				"FractionToken_Mock_v2",
				["", 10000n, Hats.address, zeroAddress]
			);

			// upgrade後にしかないメソッドを実行
			const result = await newFractionToken.read.testUpgradeFunction();
			expect(result).to.equal("testUpgradeFunction");
		});

		it("should mint, transfer and burn tokens after upgrade", async () => {
			// FractionTokenをアップグレード
			const newFractionToken = await upgradeFractionToken(
				FractionToken.address,
				"FractionToken_Mock_v2",
				["", 10000n, Hats.address, zeroAddress]
			);

			// get token id
			const tokenId = await newFractionToken.read.getTokenId([
				hatId,
				address2.account?.address!,
			]);

			// address2のtokenの半分をaddress3に移動
			await FractionToken.write.safeTransferFrom(
				[
					address2.account?.address!,
					address3.account?.address!,
					tokenId as bigint,
					5000n,
					"0x",
				],
				{
					account: address2.account!,
				}
			);

			let balance;

			// address1のbalance
			balance = await newFractionToken.read.balanceOf([
				address1.account?.address!,
				address1.account?.address!,
				hatId,
			]);
			expect(balance as bigint).to.equal(0n);

			// address3のtokenをaddress2によって半分burnする
			await newFractionToken.write.burn(
				[address3.account?.address!, address2.account?.address!, hatId, 2500n],
				{
					account: address2.account!,
				}
			);

			// address2のbalance
			balance = await newFractionToken.read.balanceOf([
				address2.account?.address!,
				address2.account?.address!,
				hatId,
			]);
			expect(balance as bigint).to.equal(0n);

			// address3のbalance
			balance = await newFractionToken.read.balanceOf([
				address3.account?.address!,
				address2.account?.address!,
				hatId,
			]);
			expect(balance as bigint).to.equal(5000n);
		});

		it("should fail to mint a token after upgrade", async () => {
			// FractionTokenをアップグレード
			const newFractionToken = await upgradeFractionToken(
				FractionToken.address,
				"FractionToken_Mock_v2",
				["", 10000n, Hats.address, zeroAddress]
			);

			// roleのない人にtokenはmintできない
			await newFractionToken.write
				.mint([hatId, address3.account?.address!])
				.catch((error: any) => {
					expect(error.message).to.include("not authorized");
				});

			// tokenは二度mintできない
			await newFractionToken.write
				.mint([hatId, address1.account?.address!])
				.catch((error: any) => {
					expect(error.message).to.include("already received");
				});
		});
	});
});
