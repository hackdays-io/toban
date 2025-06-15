import { expect } from "chai";
import { viem } from "hardhat";
import type { Address, PublicClient, WalletClient } from "viem";
import { decodeEventLog, encodeAbiParameters } from "viem";
import {
  type Hats,
  type HatsModuleFactory,
  type HatsRoleModule,
  deployHatsModuleFactory,
  deployHatsProtocol,
  deployHatsRoleModule,
} from "../helpers/deploy/Hats";
import {
  Create2Deployer,
  deployCreate2Deployer,
} from "../helpers/deploy/Create2Factory";

describe("HatsModule", () => {
  let Create2Deployer: Create2Deployer;
  let Hats: Hats;
  let HatsModuleFactory: HatsModuleFactory;
  let HatsRoleModule_IMPL: HatsRoleModule;
  let HatsRoleModule: HatsRoleModule;
  let address1: WalletClient;
  let address2: WalletClient;
  let address3: WalletClient;
  let address1Validated: Address;
  let address2Validated: Address;
  let address3Validated: Address;

  let topHatId: bigint;

  let publicClient: PublicClient;

  const validateAddress = (client: WalletClient): Address => {
    if (!client.account?.address) {
      throw new Error("Wallet client account address is undefined");
    }
    return client.account.address;
  };

  before(async () => {
    const { Create2Deployer: _Create2Deployer } = await deployCreate2Deployer();
    Create2Deployer = _Create2Deployer;

    const { Hats: _Hats } = await deployHatsProtocol();
    const { HatsModuleFactory: _HatsModuleFactory } =
      await deployHatsModuleFactory(_Hats.address);

    Hats = _Hats;
    HatsModuleFactory = _HatsModuleFactory;

    [address1, address2, address3] = await viem.getWalletClients();
    address1Validated = validateAddress(address1);
    address2Validated = validateAddress(address2);
    address3Validated = validateAddress(address3);

    await Hats.write.mintTopHat([
      address1Validated,
      "Description",
      "https://test.com/tophat.png",
    ]);

    topHatId = BigInt(
      "0x0000000100000000000000000000000000000000000000000000000000000000",
    );

    const { HatsRoleModule: _HatsRoleModule } = await deployHatsRoleModule(
      address1Validated,
      "0.0.0",
      Create2Deployer.address,
    );
    HatsRoleModule_IMPL = _HatsRoleModule;

    publicClient = await viem.getPublicClient();
  });

  describe("deploy hat role module", () => {
    it("deploy hat role module", async () => {
      /* #YF TODO1: Find out how to deploy module */
      const hatRoleModuleAddress =
        await HatsModuleFactory.write.deployHatsModule({
          args: [HatsRoleModule_IMPL.address, "0.0.1", "HatsRoleModule"],
          account: address1Validated,
        });

      HatsRoleModule = await viem.getContractAt(
        "HatsRoleModule",
        hatRoleModuleAddress as Address,
      );
    });

    it("Should be able to initialze and create Admin Role", async () => {
      await HatsRoleModule.write.createAdminRoleOperator([
        address1Validated,
        "0x0000000000000000000000000000000000004a75",
        "0x0000000000000000000000000000000000004a75",
        "https://test.com/tophat.png",
      ]);

      let res = await HatsRoleModule.read.hasARole([
        address1Validated,
        "Admin",
      ]);

      expect(res).to.be.true;

      res = await HatsRoleModule.read.listRoles([]);
      expect(res).to.equals(["Admin"]);

      res = await HatsRoleModule.read.hasARole([address2Validated, "Admin"]);

      expect(res).to.be.false;
    });
    it("You can't assign a role that you haven't created.", async () => {
      /* #YF TODO2: Find out where sender is defined */

      const newRole = "Operator";
      expect(
        await HatsRoleModule.write.assignRoleToWearer([
          address2Validated,
          newRole,
        ]),
      ).rejectedWith("Role hat does not exist");

      await HatsRoleModule.write.createRole([
        newRole,
        "Role Hat Operator",
        30,
        "0x0000000000000000000000000000000000004a75",
        "0x0000000000000000000000000000000000004a75",
        true,
        "https://test.com/operator.png",
      ]);

      expect(
        await HatsRoleModule.write.assignRoleToWearer([
          address2Validated,
          newRole,
        ]),
      ).to.be.true;
    });

    it("admin has children's role", async () => {
      const res = await HatsRoleModule.read.hasARole([
        address1Validated,
        "Operator",
      ]);
      expect(res).to.be.true;
    });
  });
});
