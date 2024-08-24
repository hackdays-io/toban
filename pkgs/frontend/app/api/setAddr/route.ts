import { RPC_URLS } from "@/lib/web3";
import { NetworkNames } from "@/types";
import { getEventData } from "@/utils/getEventData";
import { ethers } from "ethers";
import { getRelayer } from "../requestRelayer/route";

/**
 * setAddr API
 * @param requestData
 */
export async function POST(
  req: any
)  {
  console.log(
    " ################################### [setAddr: START] ###################################"
  );

  // リクエストのJSONデータをパース
  const { txHash, networkId } = await req.json();
  const chainId: keyof NetworkNames = networkId;
  const rpcUrl = RPC_URLS[chainId];

  // provider
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const txData = provider.getTransactionReceipt(txHash);
  console.log("txData:", txData);

  // 生成されたサブドメインのnodeを取得する。
  const contractInterface = new ethers.Interface([]);
  const node = await getEventData(txData, contractInterface);

  // get relayer
  const relayer: any = await getRelayer();
  // コントラクトインスタンスを生成する。
  /*
  const resolver = new ethers.Contract(
    ABI,
    PublicResolver,
    relayer
  );
  */

  try {
    /*
    // setAddr でレコードを登録する。
    const tx = await resolver.setAddr(node, taskArgs.addr);
    // await tx.wait();
    console.log("tx hash:", tx.hash);
    */

    console.log(
      " ################################### [setAddr: END] ###################################"
    );

    return new Response(JSON.stringify({ 
      result: "ok",
      txHash: "test"
    }));
  } catch (error) {
    console.error("Error requestRelayer :", error);
    
    console.log(
      " ################################### [setAddr: END] ###################################"
    );
    
    return new Response(JSON.stringify({ result: "failed" }))
  }
}