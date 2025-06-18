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

describe("ThanksToken", () => {
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
      await deployHatsTimeFrameModule(
        "0x0000000000000000000000000000000000000001",
        "0.0.0",
        Create2Deployer.address,
      );
    HatsTimeFrameModule_IMPL = _HatsTimeFrameModule;

    const { HatsFractionTokenModule: _HatsFractionTokenModule_IMPL } =
      await deployHatsFractionTokenModule(
        validateAddress(deployer),
        "0.0.0",
        Create2Deployer.address,
      );
    HatsFractionTokenModule_IMPL = _HatsFractionTokenModule_IMPL;

    const timeFrameInitData = encodeAbiParameters(
      [{ type: "address" }],
      [validateAddress(deployer)],
    );

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
      [{ type: "address" }, { type: "string" }, { type: "uint256" }],
      [validateAddress(deployer), "https://example.com/fraction-token", 10000n],
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
      {
        initialOwner: await deployer
          .getAddresses()
          .then((addresses) => addresses[0]),
        name: "Test Thanks Token",
        symbol: "TTT",
        hatsAddress: Hats.address,
        fractionTokenAddress: HatsFractionTokenModule.address,
        hatsTimeFrameModuleAddress: HatsTimeFrameModule.address,
        defaultCoefficient: 1000000000000000000n, // 1.0 in wei
      },
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
    const owner = await DeployedThanksToken.read.owner();
    const deployerAddress = validateAddress(deployer);

    expect(name).to.equal("Test Thanks Token");
    expect(symbol).to.equal("TTT");
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
          console.log("Error minting FractionToken:", error.message);
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
      const initialBalance = await DeployedThanksToken.read.balanceOf([
        address2Validated,
      ]);
      const approveAmount = initialBalance / 2n;

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
        [address2Validated, address3Validated, approveAmount / 2n],
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

      expect(address2BalanceAfter).to.equal(
        initialBalance - approveAmount / 2n,
      );
      expect(address3BalanceAfter).to.equal(approveAmount / 2n);

      expect(allowanceAfter).to.equal(approveAmount - approveAmount / 2n);
    });
  });

  // describe("ThanksToken specific functions", () => {
  //   it("should mint tokens correctly", async () => {
  //     const isWearingHat = await Hats.read.balanceOf([
  //       address1Validated,
  //       hatId,
  //     ]);

  //     if (isWearingHat === 0n) {
  //       await HatsTimeFrameModule.write.mintHat([
  //         hatId,
  //         address1Validated,
  //         BigInt(Math.floor(Date.now() / 1000) - 3600 * 10), // Wearing for 10 hours
  //       ]);
  //     } else {
  //       console.log("Address already wearing hat, skipping time update");
  //     }

  //     const fractionBalance = await FractionToken.read.balanceOf([
  //       address1Validated,
  //       address1Validated,
  //       hatId,
  //     ]);

  //     if (fractionBalance === 0n) {
  //       await FractionToken.write
  //         .mintInitialSupply([hatId, address1Validated, 0n], {
  //           account: deployer.account,
  //         })
  //         .catch(() => {
  //           /* Ignore if already minted */
  //         });
  //     }

  //     const relatedRoles = [
  //       {
  //         hatId,
  //         wearer: address1Validated,
  //       },
  //     ];

  //     const mintableAmount = await ThanksToken.read.mintableAmount([
  //       address1Validated,
  //       relatedRoles,
  //     ]);

  //     // Gather data for calculation
  //     const roleData = await gatherRoleData(address1Validated, relatedRoles);
  //     const tokenBalance = await ThanksToken.read.balanceOf([
  //       address1Validated,
  //     ]);
  //     const addressCoefficient = await ThanksToken.read
  //       .addressCoefficient([address1Validated])
  //       .catch(() => 0n);
  //     const defaultCoefficient = await ThanksToken.read
  //       .defaultCoefficient()
  //       .catch(() => 1000000000000000000n); // 1e18 as default
  //     const mintedAmount = await ThanksToken.read.mintedAmount([
  //       address1Validated,
  //     ]);

  //     const expectedMintableAmount = calculateExpectedMintableAmount(
  //       address1Validated,
  //       roleData,
  //       tokenBalance,
  //       addressCoefficient,
  //       defaultCoefficient,
  //       mintedAmount,
  //     );

  //     expect(mintableAmount).to.equal(expectedMintableAmount);

  //     if (mintableAmount === 0n) {
  //       console.log("Setting up test data for mintableAmount calculation");
  //       await ThanksToken.write.setAddressCoefficient([
  //         address1Validated,
  //         10000000000000000000n, // 10.0 in wei to ensure we get a non-zero value
  //       ]);

  //       const updatedMintableAmount = await ThanksToken.read.mintableAmount([
  //         address1Validated,
  //         relatedRoles,
  //       ]);

  //       if (updatedMintableAmount === 0n) {
  //         console.log("Cannot get non-zero mintable amount for testing");
  //         return; // Skip the test by returning early
  //       }

  //       // Gather updated data for calculation
  //       const updatedRoleData = await gatherRoleData(
  //         address1Validated,
  //         relatedRoles,
  //       );
  //       const updatedTokenBalance = await ThanksToken.read.balanceOf([
  //         address1Validated,
  //       ]);
  //       const updatedAddressCoefficient =
  //         await ThanksToken.read.addressCoefficient([address1Validated]);
  //       const updatedDefaultCoefficient =
  //         await ThanksToken.read.defaultCoefficient();
  //       const updatedMintedAmount = await ThanksToken.read.mintedAmount([
  //         address1Validated,
  //       ]);

  //       const expectedUpdatedAmount = calculateExpectedMintableAmount(
  //         address1Validated,
  //         updatedRoleData,
  //         updatedTokenBalance,
  //         updatedAddressCoefficient,
  //         updatedDefaultCoefficient,
  //         updatedMintedAmount,
  //       );

  //       expect(updatedMintableAmount).to.equal(expectedUpdatedAmount);

  //       const amountToMint = updatedMintableAmount / 2n;
  //       return { updatedMintableAmount, amountToMint };
  //     }

  //     const amountToMint = mintableAmount / 2n;

  //     const initialAddress2Balance = await ThanksToken.read.balanceOf([
  //       address2Validated,
  //     ]);
  //     const initialAddress1MintedAmount = await ThanksToken.read.mintedAmount([
  //       address1Validated,
  //     ]);

  //     try {
  //       await ThanksToken.write.mint(
  //         [address2Validated, amountToMint, relatedRoles],
  //         { account: address1.account },
  //       );
  //     } catch (error: any) {
  //       console.log("Error minting tokens:", error.message);
  //       throw new Error(`Mint should have succeeded: ${error.message}`);
  //     }

  //     const address2BalanceAfter = await ThanksToken.read.balanceOf([
  //       address2Validated,
  //     ]);
  //     const address1MintedAmountAfter = await ThanksToken.read.mintedAmount([
  //       address1Validated,
  //     ]);

  //     expect(address2BalanceAfter).to.equal(
  //       initialAddress2Balance + amountToMint,
  //     );
  //     expect(address1MintedAmountAfter).to.equal(
  //       initialAddress1MintedAmount + amountToMint,
  //     );
  //   });

  //   it("should set address coefficient correctly", async () => {
  //     const relatedRoles = [
  //       {
  //         hatId,
  //         wearer: address1Validated,
  //       },
  //     ];

  //     const initialMintableAmount = await ThanksToken.read.mintableAmount([
  //       address1Validated,
  //       relatedRoles,
  //     ]);

  //     // Gather data for calculation
  //     const roleData = await gatherRoleData(address1Validated, relatedRoles);
  //     const tokenBalance = await ThanksToken.read.balanceOf([
  //       address1Validated,
  //     ]);
  //     const addressCoefficient = await ThanksToken.read
  //       .addressCoefficient([address1Validated])
  //       .catch(() => 0n);
  //     const defaultCoefficient = await ThanksToken.read
  //       .defaultCoefficient()
  //       .catch(() => 1000000000000000000n); // 1e18 as default
  //     const mintedAmount = await ThanksToken.read.mintedAmount([
  //       address1Validated,
  //     ]);

  //     const expectedInitialAmount = calculateExpectedMintableAmount(
  //       address1Validated,
  //       roleData,
  //       tokenBalance,
  //       addressCoefficient,
  //       defaultCoefficient,
  //       mintedAmount,
  //     );

  //     expect(initialMintableAmount).to.equal(expectedInitialAmount);

  //     await ThanksToken.write.setAddressCoefficient([
  //       address1Validated,
  //       5000000000000000000n, // 5.0 in wei
  //     ]);

  //     const newMintableAmount = await ThanksToken.read.mintableAmount([
  //       address1Validated,
  //       relatedRoles,
  //     ]);

  //     // Gather updated data for calculation
  //     const updatedRoleData = await gatherRoleData(
  //       address1Validated,
  //       relatedRoles,
  //     );
  //     const updatedTokenBalance = await ThanksToken.read.balanceOf([
  //       address1Validated,
  //     ]);
  //     const updatedAddressCoefficient =
  //       await ThanksToken.read.addressCoefficient([address1Validated]);
  //     const updatedDefaultCoefficient =
  //       await ThanksToken.read.defaultCoefficient();
  //     const updatedMintedAmount = await ThanksToken.read.mintedAmount([
  //       address1Validated,
  //     ]);

  //     const expectedNewAmount = calculateExpectedMintableAmount(
  //       address1Validated,
  //       updatedRoleData,
  //       updatedTokenBalance,
  //       updatedAddressCoefficient,
  //       updatedDefaultCoefficient,
  //       updatedMintedAmount,
  //     );

  //     expect(newMintableAmount).to.equal(expectedNewAmount);

  //     if (initialMintableAmount > 0n && newMintableAmount > 0n) {
  //       const ratio = Number(newMintableAmount) / Number(initialMintableAmount);
  //       console.log(
  //         `Coefficient test: initial=${initialMintableAmount}, new=${newMintableAmount}, ratio=${ratio}`,
  //       );

  //       expect(Number(newMintableAmount)).to.be.gt(
  //         Number(initialMintableAmount),
  //       );

  //       console.log(
  //         `Coefficient test: initial=${initialMintableAmount}, new=${newMintableAmount}, ratio=${Number(newMintableAmount) / Number(initialMintableAmount)}`,
  //       );
  //     }
  //   });

  //   it("should set multiple address coefficients at once", async () => {
  //     await ThanksToken.write
  //       .setAddressCoefficient([
  //         address1Validated,
  //         1000000000000000000n, // 1.0 in wei (default)
  //       ])
  //       .catch((error) => {
  //         console.log("Error setting address1 coefficient:", error.message);
  //       });

  //     await ThanksToken.write
  //       .setAddressCoefficient([
  //         address2Validated,
  //         1000000000000000000n, // 1.0 in wei (default)
  //       ])
  //       .catch((error) => {
  //         console.log("Error setting address2 coefficient:", error.message);
  //       });

  //     const relatedRoles1 = [
  //       {
  //         hatId,
  //         wearer: address1Validated,
  //       },
  //     ];

  //     const relatedRoles2 = [
  //       {
  //         hatId,
  //         wearer: address2Validated,
  //       },
  //     ];

  //     const initialMintableAmount1 = await ThanksToken.read.mintableAmount([
  //       address1Validated,
  //       relatedRoles1,
  //     ]);

  //     const initialMintableAmount2 = await ThanksToken.read.mintableAmount([
  //       address2Validated,
  //       relatedRoles2,
  //     ]);

  //     // Gather data for calculation - address1
  //     const roleData1 = await gatherRoleData(address1Validated, relatedRoles1);
  //     const tokenBalance1 = await ThanksToken.read.balanceOf([
  //       address1Validated,
  //     ]);
  //     const addressCoefficient1 = await ThanksToken.read
  //       .addressCoefficient([address1Validated])
  //       .catch(() => 0n);
  //     const defaultCoefficient1 = await ThanksToken.read
  //       .defaultCoefficient()
  //       .catch(() => 1000000000000000000n); // 1e18 as default
  //     const mintedAmount1 = await ThanksToken.read.mintedAmount([
  //       address1Validated,
  //     ]);

  //     const expectedInitialAmount1 = calculateExpectedMintableAmount(
  //       address1Validated,
  //       roleData1,
  //       tokenBalance1,
  //       addressCoefficient1,
  //       defaultCoefficient1,
  //       mintedAmount1,
  //     );

  //     // Gather data for calculation - address2
  //     const roleData2 = await gatherRoleData(address2Validated, relatedRoles2);
  //     const tokenBalance2 = await ThanksToken.read.balanceOf([
  //       address2Validated,
  //     ]);
  //     const addressCoefficient2 = await ThanksToken.read
  //       .addressCoefficient([address2Validated])
  //       .catch(() => 0n);
  //     const defaultCoefficient2 = await ThanksToken.read
  //       .defaultCoefficient()
  //       .catch(() => 1000000000000000000n); // 1e18 as default
  //     const mintedAmount2 = await ThanksToken.read.mintedAmount([
  //       address2Validated,
  //     ]);

  //     const expectedInitialAmount2 = calculateExpectedMintableAmount(
  //       address2Validated,
  //       roleData2,
  //       tokenBalance2,
  //       addressCoefficient2,
  //       defaultCoefficient2,
  //       mintedAmount2,
  //     );

  //     expect(initialMintableAmount1).to.equal(expectedInitialAmount1);
  //     expect(initialMintableAmount2).to.equal(expectedInitialAmount2);

  //     await ThanksToken.write.setAddressCoefficients([
  //       [address1Validated, address2Validated],
  //       [2000000000000000000n, 3000000000000000000n], // 2.0 and 3.0 in wei
  //     ]);

  //     const newMintableAmount1 = await ThanksToken.read.mintableAmount([
  //       address1Validated,
  //       relatedRoles1,
  //     ]);

  //     const newMintableAmount2 = await ThanksToken.read.mintableAmount([
  //       address2Validated,
  //       relatedRoles2,
  //     ]);

  //     // Gather updated data for calculation - address1
  //     const updatedRoleData1 = await gatherRoleData(
  //       address1Validated,
  //       relatedRoles1,
  //     );
  //     const updatedTokenBalance1 = await ThanksToken.read.balanceOf([
  //       address1Validated,
  //     ]);
  //     const updatedAddressCoefficient1 =
  //       await ThanksToken.read.addressCoefficient([address1Validated]);
  //     const updatedDefaultCoefficient1 =
  //       await ThanksToken.read.defaultCoefficient();
  //     const updatedMintedAmount1 = await ThanksToken.read.mintedAmount([
  //       address1Validated,
  //     ]);

  //     const expectedNewAmount1 = calculateExpectedMintableAmount(
  //       address1Validated,
  //       updatedRoleData1,
  //       updatedTokenBalance1,
  //       updatedAddressCoefficient1,
  //       updatedDefaultCoefficient1,
  //       updatedMintedAmount1,
  //     );

  //     // Gather updated data for calculation - address2
  //     const updatedRoleData2 = await gatherRoleData(
  //       address2Validated,
  //       relatedRoles2,
  //     );
  //     const updatedTokenBalance2 = await ThanksToken.read.balanceOf([
  //       address2Validated,
  //     ]);
  //     const updatedAddressCoefficient2 =
  //       await ThanksToken.read.addressCoefficient([address2Validated]);
  //     const updatedDefaultCoefficient2 =
  //       await ThanksToken.read.defaultCoefficient();
  //     const updatedMintedAmount2 = await ThanksToken.read.mintedAmount([
  //       address2Validated,
  //     ]);

  //     const expectedNewAmount2 = calculateExpectedMintableAmount(
  //       address2Validated,
  //       updatedRoleData2,
  //       updatedTokenBalance2,
  //       updatedAddressCoefficient2,
  //       updatedDefaultCoefficient2,
  //       updatedMintedAmount2,
  //     );

  //     expect(newMintableAmount1).to.equal(expectedNewAmount1);
  //     expect(newMintableAmount2).to.equal(expectedNewAmount2);

  //     // Verify coefficients were set correctly
  //     const coefficient1 = await ThanksToken.read.addressCoefficient([
  //       address1Validated,
  //     ]);
  //     const coefficient2 = await ThanksToken.read.addressCoefficient([
  //       address2Validated,
  //     ]);

  //     expect(coefficient1).to.equal(2000000000000000000n);
  //     expect(coefficient2).to.equal(3000000000000000000n);
  //   });

  //   it("should calculate mintable amount for user with RoleShare but without hat", async () => {
  //     // First, ensure address1 has a hat and RoleShare
  //     const isWearingHat = await Hats.read.balanceOf([
  //       address1Validated,
  //       hatId,
  //     ]);

  //     if (isWearingHat === 0n) {
  //       await HatsTimeFrameModule.write.mintHat([
  //         hatId,
  //         address1Validated,
  //         BigInt(Math.floor(Date.now() / 1000) - 3600 * 10), // Wearing for 10 hours
  //       ]);
  //     }

  //     // First, ensure we have a significant amount of tokens minted
  //     try {
  //       await FractionToken.write.mintInitialSupply(
  //         [hatId, address1Validated, 10000n],
  //         { account: deployer.account },
  //       );
  //       console.log("Successfully minted initial supply");
  //     } catch (error: any) {
  //       console.log("Initial supply already minted, continuing");
  //     }

  //     const tokenId = await FractionToken.read.getTokenId([
  //       hatId,
  //       address1Validated,
  //     ]);

  //     const currentBalance = await FractionToken.read.balanceOf([
  //       address1Validated,
  //       address1Validated,
  //       hatId,
  //     ]);

  //     console.log(`Current balance for address1: ${currentBalance}`);

  //     expect(
  //       currentBalance > 0n,
  //       "Need non-zero RoleShare balance for this test",
  //     ).to.be.true;
  //     console.log(`Current balance for address1: ${currentBalance}`);

  //     const transferAmount = 1n;

  //     // Transfer a small amount to address2 (who doesn't have the hat)
  //     await FractionToken.write
  //       .safeTransferFrom(
  //         [
  //           address1Validated,
  //           address2Validated,
  //           tokenId,
  //           transferAmount,
  //           "0x", // empty bytes data
  //         ],
  //         { account: address1.account },
  //       )
  //       .then(() => {
  //         console.log(
  //           `Successfully transferred ${transferAmount} tokens to address2`,
  //         );
  //       })
  //       .catch((error: any) => {
  //         console.log(`Transfer failed: ${error.message}`);
  //         throw new Error(
  //           "Cannot test RoleShare without hat due to transfer failure",
  //         );
  //       });

  //     const relatedRoles = [
  //       {
  //         hatId,
  //         wearer: address1Validated,
  //       },
  //     ];

  //     // Check mintable amount for address2 (has RoleShare but no hat)
  //     const mintableAmount = await ThanksToken.read.mintableAmount([
  //       address2Validated,
  //       relatedRoles,
  //     ]);

  //     await ThanksToken.write.setAddressCoefficient([
  //       address2Validated,
  //       10000000000000000000n, // 10.0 in wei to ensure we get a non-zero value
  //     ]);

  //     // Check mintable amount again after setting coefficient
  //     const updatedMintableAmount = await ThanksToken.read.mintableAmount([
  //       address2Validated,
  //       relatedRoles,
  //     ]);

  //     // Gather data for calculation
  //     const roleData = await gatherRoleData(address2Validated, relatedRoles);
  //     const tokenBalance = await ThanksToken.read.balanceOf([
  //       address2Validated,
  //     ]);
  //     const addressCoefficient = await ThanksToken.read.addressCoefficient([
  //       address2Validated,
  //     ]);
  //     const defaultCoefficient = await ThanksToken.read.defaultCoefficient();
  //     const mintedAmount = await ThanksToken.read.mintedAmount([
  //       address2Validated,
  //     ]);

  //     console.log(
  //       "Role data:",
  //       JSON.stringify(
  //         roleData,
  //         (key, value) =>
  //           typeof value === "bigint" ? value.toString() : value,
  //         2,
  //       ),
  //     );
  //     console.log("Token balance:", tokenBalance.toString());
  //     console.log("Address coefficient:", addressCoefficient.toString());
  //     console.log("Default coefficient:", defaultCoefficient.toString());
  //     console.log("Minted amount:", mintedAmount.toString());

  //     const expectedMintableAmount = calculateExpectedMintableAmount(
  //       address2Validated,
  //       roleData,
  //       tokenBalance,
  //       addressCoefficient,
  //       defaultCoefficient,
  //       mintedAmount,
  //     );

  //     // Check that the expected mintable amount matches the actual amount
  //     expect(updatedMintableAmount).to.equal(expectedMintableAmount);

  //     // For this test, we specifically expect the amount to be greater than 0
  //     // since we have RoleShare but no hat
  //     expect(Number(updatedMintableAmount)).to.be.gt(0);

  //     console.log(
  //       `Mintable amount for user with RoleShare but no hat: ${updatedMintableAmount}`,
  //     );
  //   });

  //   it("should prevent minting to yourself", async () => {
  //     const relatedRoles = [
  //       {
  //         hatId,
  //         wearer: address1Validated,
  //       },
  //     ];

  //     await ThanksToken.write.setAddressCoefficient([
  //       address1Validated,
  //       10000000000000000000n, // 10.0 in wei to ensure we get a non-zero value
  //     ]);

  //     const mintableAmount = await ThanksToken.read.mintableAmount([
  //       address1Validated,
  //       relatedRoles,
  //     ]);

  //     expect(
  //       mintableAmount > 0n,
  //       "Need non-zero mintable amount to test self-minting prevention",
  //     ).to.be.true;
  //     console.log(`Mintable amount for self-minting test: ${mintableAmount}`);

  //     try {
  //       await ThanksToken.write.mint(
  //         [address1Validated, mintableAmount, relatedRoles],
  //         { account: address1.account },
  //       );
  //       // If we get here, the mint succeeded when it should have failed
  //       expect.fail("Mint to self should have failed");
  //     } catch (error: any) {
  //       expect(error.message).to.include("Cannot mint to yourself");
  //     }
  //   });

  //   it("should prevent minting more than mintable amount", async () => {
  //     const relatedRoles3 = [
  //       {
  //         hatId,
  //         wearer: address3Validated,
  //       },
  //     ];

  //     await ThanksToken.write.setAddressCoefficient([
  //       address3Validated,
  //       10000000000000000000n, // 10.0 in wei to ensure we get a non-zero value
  //     ]);

  //     const mintableAmount3 = await ThanksToken.read.mintableAmount([
  //       address3Validated,
  //       relatedRoles3,
  //     ]);

  //     // Gather data for calculation
  //     const roleData3 = await gatherRoleData(address3Validated, relatedRoles3);
  //     const tokenBalance3 = await ThanksToken.read.balanceOf([
  //       address3Validated,
  //     ]);
  //     const addressCoefficient3 = await ThanksToken.read.addressCoefficient([
  //       address3Validated,
  //     ]);
  //     const defaultCoefficient3 = await ThanksToken.read.defaultCoefficient();
  //     const mintedAmount3 = await ThanksToken.read.mintedAmount([
  //       address3Validated,
  //     ]);

  //     const expectedMintableAmount3 = calculateExpectedMintableAmount(
  //       address3Validated,
  //       roleData3,
  //       tokenBalance3,
  //       addressCoefficient3,
  //       defaultCoefficient3,
  //       mintedAmount3,
  //     );

  //     expect(mintableAmount3).to.equal(expectedMintableAmount3);

  //     expect(
  //       mintableAmount3 > 0n,
  //       "Need non-zero mintable amount to test minting limits",
  //     ).to.be.true;
  //     console.log(`Mintable amount for minting limit test: ${mintableAmount3}`);

  //     try {
  //       await ThanksToken.write.mint(
  //         [address1Validated, mintableAmount3 + 1n, relatedRoles3],
  //         { account: address3.account },
  //       );
  //       // If we get here, the mint succeeded when it should have failed
  //       expect.fail("Mint exceeding mintable amount should have failed");
  //     } catch (error: any) {
  //       expect(error.message).to.include("Amount exceeds mintable amount");
  //     }
  //   });

  //   it("should use default coefficient when address coefficient is not set", async () => {
  //     // Reset address coefficient to 0
  //     await ThanksToken.write.setAddressCoefficient([address1Validated, 0n]);

  //     // Set default coefficient
  //     const newDefaultCoefficient = 2000000000000000000n; // 2.0 in wei
  //     await ThanksToken.write.setDefaultCoefficient([newDefaultCoefficient]);

  //     const relatedRoles = [
  //       {
  //         hatId,
  //         wearer: address1Validated,
  //       },
  //     ];

  //     const mintableAmount = await ThanksToken.read.mintableAmount([
  //       address1Validated,
  //       relatedRoles,
  //     ]);

  //     // Gather data for calculation
  //     const roleData = await gatherRoleData(address1Validated, relatedRoles);
  //     const tokenBalance = await ThanksToken.read.balanceOf([
  //       address1Validated,
  //     ]);
  //     const addressCoefficient = await ThanksToken.read.addressCoefficient([
  //       address1Validated,
  //     ]);
  //     const defaultCoefficient = await ThanksToken.read.defaultCoefficient();
  //     const mintedAmount = await ThanksToken.read.mintedAmount([
  //       address1Validated,
  //     ]);

  //     const expectedMintableAmount = calculateExpectedMintableAmount(
  //       address1Validated,
  //       roleData,
  //       tokenBalance,
  //       addressCoefficient,
  //       defaultCoefficient,
  //       mintedAmount,
  //     );

  //     expect(mintableAmount).to.equal(expectedMintableAmount);
  //     expect(defaultCoefficient).to.equal(newDefaultCoefficient);

  //     // Reset default coefficient for other tests
  //     await ThanksToken.write
  //       .setDefaultCoefficient([1000000000000000000n])
  //       .catch((error) => {
  //         console.log("Error resetting default coefficient:", error.message);
  //       });
  //   });
  // });
});
