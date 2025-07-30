import { expect } from "chai";
import { viem } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import type { Address, PublicClient, WalletClient } from "viem";
import { decodeEventLog, encodeAbiParameters } from "viem";
import {
  Create2Deployer,
  deployCreate2Deployer,
} from "../helpers/deploy/Create2Factory";
import {
  type Hats,
  type HatsModuleFactory,
  type HatsTimeFrameModule,
  type HatsFractionTokenModule,
  deployHatsProtocol,
  deployHatsModuleFactory,
  deployHatsTimeFrameModule,
  deployHatsFractionTokenModule,
} from "../helpers/deploy/Hats";
import {
  type ThanksToken,
  type ThanksTokenFactory,
  deployThanksToken,
  deployThanksTokenFactory,
} from "../helpers/deploy/ThanksToken";

interface ContractError extends Error {
  message: string;
}

const createHat = async (
  Hats: Hats,
  publicClient: PublicClient,
  topHatId: bigint,
  roleName: string,
): Promise<bigint> => {
  let txHash = await Hats.write.createHat([
    topHatId,
    roleName,
    100,
    "0x0000000000000000000000000000000000004a75",
    "0x0000000000000000000000000000000000004a75",
    true,
    "",
  ]);
  let receipt = await publicClient.waitForTransactionReceipt({
    hash: txHash,
  });

  let hatId: bigint | undefined = undefined;
  for (const log of receipt.logs) {
    const decodedLog = decodeEventLog({
      abi: Hats.abi,
      data: log.data,
      topics: log.topics,
    });
    if (decodedLog.eventName === "HatCreated") {
      hatId = decodedLog.args.id;
    }
  }

  if (!hatId) {
    throw new Error("Hatter hat ID not found in transaction logs");
  }
  return hatId as bigint;
};

describe("ThanksToken", () => {
  const tokenName =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~あいうえお";
  const tokenSymbol = "ALL-CHARS-シンボル";

  let Create2Deployer: Create2Deployer;
  let Hats: Hats;
  let HatsModuleFactory: HatsModuleFactory;
  let HatsTimeFrameModule_IMPL: HatsTimeFrameModule;
  let HatsTimeFrameModule: HatsTimeFrameModule;
  let HatsFractionTokenModule_IMPL: HatsFractionTokenModule;
  let HatsFractionTokenModule: HatsFractionTokenModule;
  let DeployedThanksToken: ThanksToken;
  let ThanksTokenFactory: ThanksTokenFactory;

  let deployer: WalletClient;
  let address1: WalletClient;
  let address2: WalletClient;
  let address3: WalletClient;
  let publicClient: PublicClient;

  let topHatId: bigint;
  let hatId: bigint;

  let address1Validated: Address;
  let address2Validated: Address;
  let address3Validated: Address;

  const validateAddress = (client: WalletClient): Address => {
    if (!client.account?.address) {
      throw new Error("Wallet client account address is undefined");
    }
    return client.account.address;
  };

  before(async () => {
    [deployer, address1, address2, address3] = await viem.getWalletClients();
    publicClient = await viem.getPublicClient();

    address1Validated = validateAddress(address1);
    address2Validated = validateAddress(address2);
    address3Validated = validateAddress(address3);

    const { Create2Deployer: _Create2Deployer } = await deployCreate2Deployer();
    Create2Deployer = _Create2Deployer;

    const { Hats: _Hats } = await deployHatsProtocol();
    Hats = _Hats;

    const { HatsModuleFactory: _HatsModuleFactory } =
      await deployHatsModuleFactory(Hats.address);
    HatsModuleFactory = _HatsModuleFactory;

    const { HatsTimeFrameModule: _HatsTimeFrameModule } =
      await deployHatsTimeFrameModule("0.0.0", Create2Deployer.address);
    HatsTimeFrameModule_IMPL = _HatsTimeFrameModule;

    const { HatsFractionTokenModule: _HatsFractionTokenModule_IMPL } =
      await deployHatsFractionTokenModule("0.0.0", Create2Deployer.address);
    HatsFractionTokenModule_IMPL = _HatsFractionTokenModule_IMPL;

    const deployerAddress = validateAddress(deployer);
    const txHash = await Hats.write.mintTopHat([
      deployerAddress,
      "Test Top Hat",
      "",
    ]);
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });

    for (const log of receipt.logs) {
      try {
        const decodedLog = decodeEventLog({
          abi: Hats.abi,
          data: log.data,
          topics: log.topics,
        });
        if (decodedLog.eventName === "TransferSingle") {
          topHatId = decodedLog.args.id;
          break;
        }
      } catch (error) {}
    }

    const operatorTobanId = await createHat(
      Hats,
      publicClient,
      topHatId,
      "OperatorToban",
    );
    const timeFrameHatId = await createHat(
      Hats,
      publicClient,
      operatorTobanId,
      "TimeFrameToban",
    );
    const timeFrameInitData = encodeAbiParameters(
      [{ type: "uint256" }],
      [timeFrameHatId],
    );

    await HatsModuleFactory.write.createHatsModule([
      HatsTimeFrameModule_IMPL.address,
      topHatId,
      "0x",
      timeFrameInitData,
      BigInt(0),
    ]);

    const hatsTimeFrameModuleAddress =
      await HatsModuleFactory.read.getHatsModuleAddress([
        HatsTimeFrameModule_IMPL.address,
        topHatId,
        "0x",
        BigInt(0),
      ]);

    HatsTimeFrameModule = await viem.getContractAt(
      "HatsTimeFrameModule",
      hatsTimeFrameModuleAddress,
    );

    // Deploy HatsFractionTokenModule
    const fractionTokenInitData = encodeAbiParameters(
      [{ type: "string" }, { type: "uint256" }],
      ["https://example.com/fraction-token", 10000n],
    );

    await HatsModuleFactory.write.createHatsModule([
      HatsFractionTokenModule_IMPL.address,
      topHatId,
      "0x",
      fractionTokenInitData,
      BigInt(1),
    ]);

    const hatsFractionTokenModuleAddress =
      await HatsModuleFactory.read.getHatsModuleAddress([
        HatsFractionTokenModule_IMPL.address,
        topHatId,
        "0x",
        BigInt(1),
      ]);

    HatsFractionTokenModule = await viem.getContractAt(
      "HatsFractionTokenModule",
      hatsFractionTokenModuleAddress,
    );

    const { ThanksToken: _ThanksToken } = await deployThanksToken(
      Create2Deployer.address,
    );
    DeployedThanksToken = _ThanksToken;

    const { ThanksTokenFactory: _ThanksTokenFactory } =
      await deployThanksTokenFactory(
        {
          initialOwner: await deployer
            .getAddresses()
            .then((addresses) => addresses[0]),
          implementation: DeployedThanksToken.address,
          hatsAddress: Hats.address,
          fractionTokenAddress: HatsFractionTokenModule.address,
          hatsTimeFrameModuleAddress: HatsTimeFrameModule.address,
        },
        Create2Deployer.address,
      );
    ThanksTokenFactory = _ThanksTokenFactory;

    // Set BigBang address on ThanksTokenFactory (temporarily set deployer for testing)
    await ThanksTokenFactory.write.setBigBang([deployerAddress]);

    // Create ThanksToken instance using factory
    const createTxHash =
      await ThanksTokenFactory.write.createThanksTokenDeterministic([
        tokenName,
        tokenSymbol,
        deployerAddress,
        1000000000000000000n, // 1.0 in wei
        "0x0000000000000000000000000000000000000000000000000000000000000001" as `0x${string}`,
      ]);

    const createReceipt = await publicClient.waitForTransactionReceipt({
      hash: createTxHash,
    });

    let thanksTokenAddress: Address | undefined;
    for (const log of createReceipt.logs) {
      try {
        const decodedLog = decodeEventLog({
          abi: ThanksTokenFactory.abi,
          data: log.data,
          topics: log.topics,
        });
        if (decodedLog.eventName === "ThanksTokenCreated") {
          thanksTokenAddress = decodedLog.args.tokenAddress as Address;
          break;
        }
      } catch (error) {}
    }

    if (!thanksTokenAddress) {
      throw new Error("ThanksToken address not found in transaction logs");
    }

    // Get the actual ThanksToken clone instance
    DeployedThanksToken = await viem.getContractAt(
      "ThanksToken",
      thanksTokenAddress,
    );

    let txHash2 = await Hats.write.createHat([
      topHatId,
      "Hatter Hat",
      100, // max supply
      deployerAddress, // toggle address
      deployerAddress, // eligibility module
      true, // mutable
      "", // image URI
    ]);
    let receipt2 = await publicClient.waitForTransactionReceipt({
      hash: txHash2,
    });

    let hatterHatId: bigint | undefined;

    for (const log of receipt2.logs) {
      try {
        const decodedLog = decodeEventLog({
          abi: Hats.abi,
          data: log.data,
          topics: log.topics,
        });
        if (decodedLog.eventName === "HatCreated") {
          hatterHatId = decodedLog.args.id;
          break;
        }
      } catch (error) {}
    }

    if (!hatterHatId) {
      throw new Error("Hatter hat ID not found in transaction logs");
    }

    await Hats.write.mintHat([hatterHatId, HatsTimeFrameModule.address]);

    txHash2 = await Hats.write.createHat([
      hatterHatId,
      "Role Hat",
      10, // max supply
      deployerAddress, // toggle address
      deployerAddress, // eligibility module
      true, // mutable
      "", // image URI
    ]);
    receipt2 = await publicClient.waitForTransactionReceipt({ hash: txHash2 });

    for (const log of receipt2.logs) {
      try {
        const decodedLog = decodeEventLog({
          abi: Hats.abi,
          data: log.data,
          topics: log.topics,
        });
        if (decodedLog.eventName === "HatCreated") {
          hatId = decodedLog.args.id;
          break;
        }
      } catch (error) {}
    }
  });

  it("should initialize with correct name, symbol and owner", async () => {
    const name = await DeployedThanksToken.read.name();
    const symbol = await DeployedThanksToken.read.symbol();
    const owner = await DeployedThanksToken.read.WORKSPACE_OWNER();
    const deployerAddress = validateAddress(deployer);

    expect(name).to.equal(tokenName);
    expect(symbol).to.equal(tokenSymbol);
    expect(owner.toLowerCase()).to.equal(deployerAddress.toLowerCase());
  });

  describe("ERC20 standard functions", () => {
    before(async () => {
      const isWearingHat = await Hats.read.balanceOf([
        address1Validated,
        hatId,
      ]);

      if (isWearingHat === 0n) {
        const currentTime = await time.latest();
        await HatsTimeFrameModule.write
          .mintHat([hatId, address1Validated, BigInt(currentTime - 3600 * 10)])
          .catch((error) => {
            console.log("Error minting hat:", error.message);
          });
      }

      await HatsFractionTokenModule.write
        .mintInitialSupply([hatId, address1Validated, 0n], {
          account: deployer.account,
        })
        .catch((error) => {
          console.log("Error minting HatsFractionTokenModule:", error.message);
        });
    });

    it("should have correct totalSupply", async () => {
      let totalSupply = await DeployedThanksToken.read.totalSupply();
      expect(Number(totalSupply)).to.equal(0);

      await DeployedThanksToken.write.setAddressCoefficient([
        address1Validated,
        10000000000000000000n, // 10.0 in wei
      ]);

      const relatedRoles = [
        {
          hatId,
          wearer: address1Validated,
        },
      ];

      const mintableAmount = await DeployedThanksToken.read.mintableAmount([
        address1Validated,
        relatedRoles,
      ]);

      expect(Number(mintableAmount)).to.be.equal(100);

      await DeployedThanksToken.write.mint(
        [address2Validated, mintableAmount / 2n, relatedRoles],
        {
          account: address1.account,
        },
      );

      totalSupply = await DeployedThanksToken.read.totalSupply();

      expect(Number(totalSupply)).to.be.equal(50);
    });

    it("should transfer tokens correctly", async () => {
      const initialBalance = await DeployedThanksToken.read.balanceOf([
        address2Validated,
      ]);
      const transferAmount = initialBalance / 2n;

      await DeployedThanksToken.write.transfer(
        [address3Validated, transferAmount],
        {
          account: address2.account,
        },
      );

      const address2BalanceAfter = await DeployedThanksToken.read.balanceOf([
        address2Validated,
      ]);
      const address3BalanceAfter = await DeployedThanksToken.read.balanceOf([
        address3Validated,
      ]);

      expect(address2BalanceAfter).to.equal(initialBalance - transferAmount);
      expect(address3BalanceAfter).to.equal(transferAmount);
    });

    it("should approve and use allowance correctly", async () => {
      const address2BalanceBefore = await DeployedThanksToken.read.balanceOf([
        address2Validated,
      ]);
      const address3BalanceBefore = await DeployedThanksToken.read.balanceOf([
        address3Validated,
      ]);
      const approveAmount = address2BalanceBefore;

      await DeployedThanksToken.write.approve(
        [address3Validated, approveAmount],
        {
          account: address2.account,
        },
      );

      const allowance = await DeployedThanksToken.read.allowance([
        address2Validated,
        address3Validated,
      ]);

      expect(allowance).to.equal(approveAmount);

      await DeployedThanksToken.write.transferFrom(
        [address2Validated, address3Validated, approveAmount],
        { account: address3.account },
      );

      const address2BalanceAfter = await DeployedThanksToken.read.balanceOf([
        address2Validated,
      ]);
      const address3BalanceAfter = await DeployedThanksToken.read.balanceOf([
        address3Validated,
      ]);
      const allowanceAfter = await DeployedThanksToken.read.allowance([
        address2Validated,
        address3Validated,
      ]);

      expect(address2BalanceAfter).to.equal(0n);
      expect(address3BalanceAfter).to.equal(
        approveAmount + address3BalanceBefore,
      );

      expect(allowanceAfter).to.equal(0n);
    });
  });

  describe("ThanksToken specific functions", () => {
    it("should mint tokens correctly", async () => {
      const isWearingHat = await Hats.read.balanceOf([
        address1Validated,
        hatId,
      ]);

      if (isWearingHat === 0n) {
        await HatsTimeFrameModule.write.mintHat([
          hatId,
          address1Validated,
          BigInt(Math.floor(Date.now() / 1000) - 3600 * 10), // Wearing for 10 hours
        ]);
      } else {
        console.log("Address already wearing hat, skipping time update");
      }

      const fractionBalance = await HatsFractionTokenModule.read.balanceOf([
        address1Validated,
        address1Validated,
        hatId,
      ]);

      if (fractionBalance === 0n) {
        await HatsFractionTokenModule.write
          .mintInitialSupply([hatId, address1Validated, 0n], {
            account: deployer.account,
          })
          .catch(() => {
            /* Ignore if already minted */
          });
      }

      const relatedRoles = [
        {
          hatId,
          wearer: address1Validated,
        },
      ];

      const mintableAmount = await DeployedThanksToken.read.mintableAmount([
        address1Validated,
        relatedRoles,
      ]);
      const mintedAmount = await DeployedThanksToken.read.mintedAmount([
        address1Validated,
      ]);

      // Mintable amount - minted amount
      // (10 hours * 10 coefficient) - 50
      expect(mintableAmount).to.equal(50n);

      const amountToMint = mintableAmount / 2n;

      const initialAddress2Balance = await DeployedThanksToken.read.balanceOf([
        address2Validated,
      ]);
      const initialAddress1MintedAmount =
        await DeployedThanksToken.read.mintedAmount([address1Validated]);

      try {
        await DeployedThanksToken.write.mint(
          [address2Validated, amountToMint, relatedRoles],
          { account: address1.account },
        );
      } catch (error: any) {
        console.log("Error minting tokens:", error.message);
        throw new Error(`Mint should have succeeded: ${error.message}`);
      }

      const address2BalanceAfter = await DeployedThanksToken.read.balanceOf([
        address2Validated,
      ]);
      const address1MintedAmountAfter =
        await DeployedThanksToken.read.mintedAmount([address1Validated]);

      expect(address2BalanceAfter).to.equal(
        initialAddress2Balance + amountToMint,
      );
      expect(address1MintedAmountAfter).to.equal(
        initialAddress1MintedAmount + amountToMint,
      );
    });

    it("should update address coeefficient", async () => {
      const address1CoefficientBefore =
        await DeployedThanksToken.read.addressCoefficient([address1Validated]);
      expect(address1CoefficientBefore).to.equal(10000000000000000000n); // 10.0 in wei

      await DeployedThanksToken.write.setAddressCoefficient([
        address1Validated,
        20000000000000000000n, // 20.0 in wei
      ]);

      const address1CoefficientAfter =
        await DeployedThanksToken.read.addressCoefficient([address1Validated]);

      expect(address1CoefficientAfter).to.equal(20000000000000000000n);

      await DeployedThanksToken.write.setAddressCoefficients([
        [address2Validated, address3Validated],
        [30000000000000000000n, 40000000000000000000n], // 30.0 and 40.0 in wei
      ]);

      const address2CoefficientAfter =
        await DeployedThanksToken.read.addressCoefficient([address2Validated]);
      const address3CoefficientAfter =
        await DeployedThanksToken.read.addressCoefficient([address3Validated]);

      expect(address2CoefficientAfter).to.equal(30000000000000000000n);
      expect(address3CoefficientAfter).to.equal(40000000000000000000n);
    });

    it("should calculate mintable amount for user with RoleShare but without hat", async () => {
      // First, ensure address1 has a hat and RoleShare
      const isWearingHat = await Hats.read.balanceOf([
        address1Validated,
        hatId,
      ]);

      if (isWearingHat === 0n) {
        await HatsTimeFrameModule.write.mintHat([
          hatId,
          address1Validated,
          BigInt(Math.floor(Date.now() / 1000) - 3600 * 10), // Wearing for 10 hours
        ]);
      }

      // First, ensure we have a significant amount of tokens minted
      try {
        await HatsFractionTokenModule.write.mintInitialSupply(
          [hatId, address1Validated, 10000n],
          { account: deployer.account },
        );
        console.log("Successfully minted initial supply");
      } catch (error: any) {
        console.log("Initial supply already minted, continuing");
      }

      const tokenId = await HatsFractionTokenModule.read.getTokenId([
        hatId,
        address1Validated,
      ]);

      const currentBalance = await HatsFractionTokenModule.read.balanceOf([
        address1Validated,
        address1Validated,
        hatId,
      ]);

      expect(
        currentBalance > 0n,
        "Need non-zero RoleShare balance for this test",
      ).to.be.true;

      const transferAmount = 1000n;

      // Transfer a small amount to address2 (who doesn't have the hat)
      await HatsFractionTokenModule.write.safeTransferFrom(
        [
          address1Validated,
          address2Validated,
          tokenId,
          transferAmount,
          "0x", // empty bytes data
        ],
        { account: address1.account },
      );

      const relatedRoles = [
        {
          hatId,
          wearer: address1Validated,
        },
      ];

      // Check mintable amount for address2 (has RoleShare but no hat)
      const mintableAmount = await DeployedThanksToken.read.mintableAmount([
        address2Validated,
        relatedRoles,
      ]);

      // Check that the expected mintable amount matches the actual amount
      // ((10h * 1000 / 10000) + (20 / 10) GiveBack) * 30 Coefficient
      // 3 * 30
      expect(mintableAmount).to.equal(90n);
    });

    it("should prevent minting to yourself", async () => {
      const relatedRoles = [
        {
          hatId,
          wearer: address1Validated,
        },
      ];

      try {
        await DeployedThanksToken.write.mint(
          [address1Validated, 1n, relatedRoles],
          { account: address1.account },
        );
        // If we get here, the mint succeeded when it should have failed
        expect.fail("Mint to self should have failed");
      } catch (error: any) {
        expect(error.message).to.include("Cannot mint to yourself");
      }
    });

    it("should prevent minting more than mintable amount", async () => {
      const relatedRoles = [
        {
          hatId,
          wearer: address1Validated,
        },
      ];
      try {
        await DeployedThanksToken.write.mint(
          [address2Validated, 1000000n, relatedRoles],
          { account: address1.account },
        );
        // If we get here, the mint succeeded when it should have failed
        expect.fail("Mint exceeding mintable amount should have failed");
      } catch (error: any) {
        expect(error.message).to.include("Amount exceeds mintable amount");
      }
    });
  });
});
