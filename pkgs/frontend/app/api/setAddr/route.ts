import {RESOLEVER_CONTRACT_ADDRESS} from "@/lib/constants";
import {getRelayer} from "@/lib/ozSigner";
import {PublicReszolverABI} from "@/utils/abis/PublicReszolverABI";
import {getEventData} from "@/utils/getEventData";
import {ethers} from "ethers";

/**
 * setAddr API
 * @param requestData
 */
export async function POST(req: any) {
  console.log(
    " ################################### [setAddr: START] ###################################"
  );

  // リクエストのJSONデータをパース
  const {txData, addr} = await req.json();

  // 生成されたサブドメインのnodeを取得する。
  const contractInterface = new ethers.Interface(PublicReszolverABI);
  const node = getEventData(txData, contractInterface);

  // get relayer
  const relayer: any = await getRelayer();
  // コントラクトインスタンスを生成する。
  const resolver = new ethers.Contract(
    RESOLEVER_CONTRACT_ADDRESS,
    PublicReszolverABI,
    relayer
  );

  try {
    // setAddr でレコードを登録する。
    const tx = await resolver.setAddr(node, addr);
    // await tx.wait();
    console.log("tx hash:", tx.hash);

    console.log(
      " ################################### [setAddr: END] ###################################"
    );

    return new Response(
      JSON.stringify({
        result: "ok",
        txHash: tx.hash,
      })
    );
  } catch (error) {
    console.error("Error requestRelayer :", error);

    console.log(
      " ################################### [setAddr: END] ###################################"
    );

    return new Response(JSON.stringify({result: "failed"}));
  }
}
