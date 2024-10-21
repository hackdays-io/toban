import { expect } from "chai";
import { Signer } from "ethers";
import { ethers, viem } from "hardhat";
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

	let signer1: Signer;
	let signer2: Signer;
	let signer3: Signer;

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

		[address1, address2, address3, address4] = await viem.getWalletClients();

		[signer1, signer2, signer3] = await ethers.getSigners();

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
		await FractionToken.mint(hatId, address1.account?.address!);
		await FractionToken.mint(hatId, address2.account?.address!);

		const tokenId = await FractionToken.getTokenId(
			hatId,
			address2.account?.address!
		);

		// address2のtokenの半分をaddress3に移動
		await (FractionToken as any)
			.connect(signer2)
			.safeTransferFrom(
				address2.account?.address!,
				address3.account?.address!,
				tokenId,
				5000n,
				"0x"
			);

		// address1のtokenを自ら半分burnする
		await FractionToken.burn(
			address1.account?.address!,
			address1.account?.address!,
			hatId,
			5000n,
			{
				account: address1.account!,
			}
		);

		// address3のtokenをaddress2によって半分burnする
		await (FractionToken as any)
			.connect(signer2)
			.burn(
				address3.account?.address!,
				address2.account?.address!,
				hatId,
				2500n
			);

		let balance: bigint;

		// address1のbalance
		balance = await FractionToken["balanceOf(address,address,uint256)"](
			address1.account?.address!,
			address1.account?.address!,
			hatId
		);
		expect(balance).to.equal(5000n);

		// address2のbalance
		balance = await FractionToken["balanceOf(address,address,uint256)"](
			address2.account?.address!,
			address2.account?.address!,
			hatId
		);
		expect(balance).to.equal(5000n);

		// address3のbalance
		balance = await FractionToken["balanceOf(address,address,uint256)"](
			address3.account?.address!,
			address2.account?.address!,
			hatId
		);
		expect(balance).to.equal(2500n);
	});

	it("should fail to mint a token", async () => {
		// roleのない人にtokenはmintできない
		await FractionToken.mint(hatId, address3.account?.address!).catch(
			(error: any) => {
				expect(error.message).to.include("not authorized");
			}
		);

		// tokenは二度mintできない
		await FractionToken.mint(hatId, address1.account?.address!).catch(
			(error: any) => {
				expect(error.message).to.include("already received");
			}
		);
	});

	it("should fail to burn a token", async () => {
		// address1のtokenはaddress2によってburnできない
		await (FractionToken as any)
			.connect(signer2)
			.burn(
				address1.account?.address!,
				address1.account?.address!,
				hatId,
				5000n
			)
			.catch((error: any) => {
				expect(error.message).to.include("not authorized");
			});
	});
});
