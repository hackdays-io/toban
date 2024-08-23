import SampleForwarderJson from "@/contracts/SampleForwarder.sol/SampleForwarder.json";
import { FORWARDER_CONTRACT_ADDRESS } from "@/lib/constants";
import { getUint48 } from "@/lib/utils";
import { RPC_URLS } from "@/lib/web3";
import { ForwardRequest } from "@/types";
import { Contract, ethers } from "ethers";

type NetworkNames = {
  [key in 1 | 10 | 137 | 8453 | 42161 | 11155111]: string;
};

const networkNames: NetworkNames = {
  1: 'Ethereum Mainnet',
  10: 'Optimism',
  137: 'Polygon',
  8453: 'Base',
  42161: 'Arbitrum',
  11155111: 'Sepolia'
};

/**
 * Forwarderコントラクトインスタンスを作成するメソッド
 */
const creteForwarderContract = (
  forwarderAddress: string,
  forwarderAbi: any,  
  provider: ethers.JsonRpcProvider
) => {
  return new Contract(
    forwarderAddress,
    forwarderAbi,
    provider
  ) as any;
}


/**
 * メタトランザクション用のトランザクションを作成するメソッド
 * @param chainId 
 * @returns 
 */
export const createTypedSignData = async(
  accountAddress: string | undefined,
  chainId: keyof NetworkNames,
  contractAddress: string,
  contractAbi: any,
  functionName: string,
  args: any[]
) => {
 
  console.log(
    "================================= [gasless: START] ================================="
  );
 
  // 接続中のネットワークIDとRPC URLを取得
  const currentRpcUrl = RPC_URLS[chainId];
  const provider = new ethers.JsonRpcProvider(currentRpcUrl);

  console.log("provider: ", (await provider.getNetwork()).chainId);

  // Forwarderコントラクトインスタンスを生成する。
  const forwarder:any = creteForwarderContract(FORWARDER_CONTRACT_ADDRESS, SampleForwarderJson.abi, provider);
  console.log("forwarder", forwarder.target);

  // MetaTransaction実行対象のコントラクトインスタンスを生成する。
  const logicContract = new Contract(contractAddress, contractAbi, provider);
  console.log("logicContract", logicContract.target);

  // 呼び出すメソッドの関数のエンコード済みデータを用意する。
  const encodedData: any = logicContract.interface.encodeFunctionData(
    functionName,
    args
  );

  // get domain
  const domain = await forwarder.eip712Domain();
  // get unit48
  const uint48Time = getUint48();

  console.log("encodedData:", encodedData);
  console.log("domain:", domain);
  console.log("uint48Time:", uint48Time);

  // get nonce
  const nonce = await forwarder.getNonce(accountAddress!);
  console.log("nonce:", nonce);

  // 署名対象のtypedDataを作成する。
  const typedData = {
    domain: {
      name: domain[1],
      version: domain[2],
      chainId: chainId,
      verifyingContract: domain[4].toString(),
    },
    types: {
      ForwardRequest: ForwardRequest,
    },
    primaryType: "ForwardRequest",
    message: {
      from: accountAddress!.toString(),
      to: contractAddress.toString(),
      value: 0,
      gas: 360000,
      nonce: nonce,
      //deadline: uint48Time.toString(),
      data: encodedData.toString(),
    },
  };
  
  console.log("typedData:", typedData);
  return typedData;
};
