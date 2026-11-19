import { task } from "hardhat/config";

/**
 * Task definitions. Actions are loaded lazily (Hardhat 3 requires this for
 * anything that touches the network), so each action file default-exports
 * `async (args, hre) => {}` and opens its own connection.
 *
 * Hardhat 3 options always carry a default value; options that were
 * `addParam` (required) in Hardhat 2 default to "" and are checked by the
 * action via `requireOption`.
 */
export const tasks = [
  task("bigbang", "bigbang")
    .addOption({
      name: "owner",
      description: "The address of the user who will own the topHat.",
      defaultValue: "",
    })
    .addOption({
      name: "tophatdetails",
      description: "The details of the topHat.",
      defaultValue: "",
    })
    .addOption({
      name: "tophatimageuri",
      description: "The image URI of the topHat.",
      defaultValue: "",
    })
    .addOption({
      name: "hatterhatdetails",
      description: "The details of the hatterHat.",
      defaultValue: "",
    })
    .addOption({
      name: "hatterhatimageuri",
      description: "The image URI of the hatterHat.",
      defaultValue: "",
    })
    .addOption({
      name: "memberhatdetails",
      description: "The details of the memberHat.",
      defaultValue: "",
    })
    .addOption({
      name: "memberhatimageuri",
      description: "The image URI of the memberHat.",
      defaultValue: "",
    })
    .setAction(() => import("./BigBang/bigbang"))
    .build(),

  task("batchMintHat", "Batch mint hats to multiple addresses")
    .addOption({
      name: "hatid",
      description: "Hat ID to mint",
      defaultValue: "",
    })
    .addOption({
      name: "csv",
      description:
        "Path to CSV file containing addresses and optional timestamps",
      defaultValue: "",
    })
    .addOption({
      name: "addresses",
      description: "Comma-separated list of addresses",
      defaultValue: "",
    })
    .addOption({
      name: "batchsize",
      description: "Maximum batch size (default: 50)",
      defaultValue: "50",
    })
    .addOption({
      name: "module",
      description:
        "HatsTimeFrameModule instance address (clone). If omitted, uses the address from outputs",
      defaultValue: "",
    })
    .setAction(() => import("./HatsTimeFrameModule/batchMintHat"))
    .build(),

  task("getWoreTime", "getWoreTime")
    .addOption({
      name: "wearer",
      description: "address of wearer",
      defaultValue: "",
    })
    .setAction(() => import("./HatsTimeFrameModule/getWoreTime"))
    .build(),

  task("mintHat", "mintHat")
    .addOption({ name: "hatid", description: "hatid", defaultValue: "" })
    .addOption({
      name: "wearer",
      description: "address of wearer",
      defaultValue: "",
    })
    .addOption({
      name: "module",
      description:
        "HatsTimeFrameModule instance address (clone). If omitted, uses the address from outputs",
      defaultValue: "",
    })
    .setAction(() => import("./HatsTimeFrameModule/mintHat"))
    .build(),

  task("registerSubdomain", "register subdomain")
    .addOption({
      name: "label",
      description: "label for subdomain",
      defaultValue: "",
    })
    .setAction(() => import("./ens/registerSubdomain"))
    .build(),

  task("getBalance", "getBalance")
    .setAction(() => import("./utils/getBalance"))
    .build(),

  task("getChainInfo", "getChainInfo of connected chain")
    .setAction(() => import("./utils/getChainInfo"))
    .build(),

  task("getContractAddress", "getContractAddress of connected chain")
    .addOption({
      name: "contract",
      description: "contract name in <contractName>Moduel#<contractName>",
      defaultValue: "",
    })
    .setAction(() => import("./utils/getContractAddress"))
    .build(),

  task("resetContractAddressesJson", "resetContractAddressesJson")
    .setAction(() => import("./utils/resetContractAddressesJson"))
    .build(),
];
