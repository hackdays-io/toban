import SampleForwarderJson from "@/contracts/SampleForwarder.sol/SampleForwarder.json";
import { FORWARDER_CONTRACT_ADDRESS } from "@/lib/constants";
import {
  DefenderRelayProvider,
  DefenderRelaySigner,
} from "@openzeppelin/defender-relay-client/lib/ethers";
import { Contract } from "ethers";

/**
 * get Relayer method
 */
export const getRelayer = async () => {
  const credentials: any = {
    apiKey: process.env.NEXT_PUBLIC_DEFENDER_API_KEY,
    apiSecret: process.env.NEXT_PUBLIC_DEFENDER_SECRET_KEY,
  };

  const ozProvider = new DefenderRelayProvider(credentials);
  const ozSigner = new DefenderRelaySigner(credentials, ozProvider, {
    speed: "fast",
  });

  console.log("ozSigner:", await ozSigner.getAddress());

  return ozSigner;
};

/**
 * requestRelayer API
 * @param requestData
 */
export async function POST(
  req: any
)  {
  // let res:any;
  // リクエストのJSONデータをパース
  const { typedSignData, signature } = await req.json();
  console.log("typedSignData:", typedSignData);
  console.log("signature:", signature);

  if (typedSignData === undefined || signature === undefined) {
    return new Response("Request has no request", {
      status: 503,
    });
  }

  // get relayer
  const relayer: any = await getRelayer();
  // create forwarder contract instance
  const forwarder: any = new Contract(
    FORWARDER_CONTRACT_ADDRESS,
    SampleForwarderJson.abi,
    relayer
  ) as any;

  try {
    // create meta transaction request data
    const requestData = {
      req:{
        from: typedSignData.message.from,
        to: typedSignData.message.to,
        value: typedSignData.message.value,
        gas: typedSignData.message.gas,
        nonce: typedSignData.message.nonce,
        data: typedSignData.message.data,
      },
      signature: signature,
    }
    // call verify method
    const result = await forwarder.verify(requestData.req, requestData.signature);
    console.log("verify result:", result);
    if (!result) throw "invalid request data!";

    // call execute method from relayer
    const result2 = await forwarder.execute(requestData.req, requestData.signature);

    console.log("tx hash:", result2.hash);

    console.log(
      " ========================================= [RequestRaler: END] =============================================="
    );
   
    return new Response(JSON.stringify({ 
      result: "ok",
      txHash: result2.hash
    }));
  } catch (error) {
    console.error("Error requestRelayer :", error);
    console.log(
      " ========================================= [RequestRaler: END] =============================================="
    );
    
    return new Response(JSON.stringify({ result: "failed" }))
  }
}