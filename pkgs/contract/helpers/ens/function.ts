import * as dotenv from "dotenv";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import { privateKeyToAccount } from "viem/accounts";
import { NAME_WRAPPER_ABI } from "./abi";
import {
  CONTRACT_TOBAN_PARENT_NODE,
  NAME_WRAPPER_CONTRACT_ADDRESS,
  RESOLEVER_CONTRACT_ADDRESS,
} from "./constants";

dotenv.config();

const { PRIVATE_KEY } = process.env;

// create Signer from Private Key
const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);

/**
 * register subdomain method
 */
export const registerSubdomain = async (
  hre: HardhatRuntimeEnvironment,
  label: string,
) => {
  const [bobWalletClient] = await hre.viem.getWalletClients();
  // register subdomain methodを呼び出す。
  const txHash = await bobWalletClient.writeContract({
    address: NAME_WRAPPER_CONTRACT_ADDRESS,
    abi: NAME_WRAPPER_ABI,
    functionName: "setSubnodeRecord",
    args: [
      CONTRACT_TOBAN_PARENT_NODE,
      label,
      account.address,
      RESOLEVER_CONTRACT_ADDRESS,
      0,
      0,
      0,
    ],
    account,
  });

  console.log(`registerSubdomain tx: ${txHash}`);

  return txHash;
};
