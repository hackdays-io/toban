import { decodeEventLog, PublicClient, WalletClient, zeroAddress } from "viem";
import { deployFractionToken, FractionToken } from "../helpers/deploy/FractionToken";
import { deployHatsProtocol, Hats } from "../helpers/deploy/Hats";
import { viem } from "hardhat";

describe("Burn", () => {
  let Hats: Hats;
  let FractionToken: FractionToken;

  let address1: WalletClient;
  let address2: WalletClient;
  let address3: WalletClient;

  let hat1_id: bigint;
  let hat2_id: bigint;

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
      "https://test.com/tophat.png"
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
				if (decodedLog.eventName == "HatCreated") hat1_id = decodedLog.args.id;
			} catch (error) {}
		}

		txHash = await Hats.write.createHat([
			BigInt(
				"0x0000000100000000000000000000000000000000000000000000000000000000"
			),
			"role2",
			10,
			"0x0000000000000000000000000000000000004a75",
			"0x0000000000000000000000000000000000004a75",
			true,
			"https://test.com/hat_image.png",
		]);

		receipt = await publicClient.waitForTransactionReceipt({
			hash: txHash,
		});

		for (const log of receipt.logs) {
			try {
				const decodedLog = decodeEventLog({
					abi: Hats.abi,
					data: log.data,
					topics: log.topics,
				});
				if (decodedLog.eventName == "HatCreated") hat2_id = decodedLog.args.id;
			} catch (error) {}
		}

    // address1とaddress2にHatをmint
		await Hats.write.mintHat([hat1_id, address1.account?.address!]);
		await Hats.write.mintHat([hat2_id, address2.account?.address!]);

		// address1とaddress2にFractionTokenをmint
		await FractionToken.write.mint([hat1_id, address1.account?.address!]);
		await FractionToken.write.mint([hat2_id, address2.account?.address!]);

    const tokenId = await FractionToken.read.getTokenId([
			hat2_id,
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

    it("should burn tokens", async () => {
      await FractionToken.write.burn(
        [
          address1.account?.address!,
          address2.account?.address!,
          hat1_id,
          10000n
        ],
        {
          account: address1.account!
        }
      );

      // このbalanceがnever型になってしまいます
      const balance = await FractionToken.read.balanceOf(
        [
          address1.account?.address!,
          address2.account?.address!,
          hat1_id
        ]
      );
    })
  });
})