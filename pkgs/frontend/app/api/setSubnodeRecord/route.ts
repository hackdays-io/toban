import { getRelayer } from "../requestRelayer/route";

/**
 * setSubnodeRecord API
 * @param requestData
 */
export async function POST(
  req: any
)  {
  console.log(
    " ################################### [setSubnodeRecord: START] ###################################"
  );

  const { label } = await req.json();

  // get relayer
  const relayer: any = await getRelayer();

  // コントラクトインスタンスを生成する。
  /*
  const nameWrapper = new ethers.Contract(
    NameWrapperABI,
    NameWrapper,
    relayer
  );
  */

  try {
    // sub domainを登録する。
    /*
    const tx = await nameWrapper.setSubnodeRecord(
      CONTRACT_TOBAN_PARENT_NODE,
      label,
      await relayer.getAddress(),
      RESOLEVER_CONTRACT_ADDRESS,
      0,
      0,
      0,
      {
        gasLimit: 6000000,
      }
    );
    console.log(
      " ################################### [setSubnodeRecord: END] ###################################"
    );
    */

    return new Response(JSON.stringify({ 
      result: "ok",
      // txHash: tx.hash
    }));
  } catch (error) {
    console.error("Error requestRelayer :", error);
    console.log(
      " ################################### [setSubnodeRecord: END] ###################################"
    );
    
    return new Response(JSON.stringify({ result: "failed" }))
  }
}