import {DataClient} from "@0xsplits/splits-sdk";
import {useState} from "react";
import {useChainId} from "wagmi";

/**
 * SplitsProtocolの読み取り系Hook
 * @returns
 */
const useSplitsRead = () => {
  const [relatedSplits, setRelatedSplits] = useState<any[]>([]);

  const chainId = useChainId();

  /**
   * getRelatedSplits hook
   * @returns
   */
  const getRelatedSplits = async (address: string) => {
    const dataClient = new DataClient({
      apiConfig: {
        apiKey: process.env.NEXT_PUBLIC_SPLITS_API_KEY!,
      },
    });

    const args = {
      chainId: chainId,
      address: address,
    };

    console.log("args", args);

    const response = await dataClient.getRelatedSplits(args);
    console.log("response", response);
    setRelatedSplits(response as any);
  };

  return {getRelatedSplits, relatedSplits};
};

export default useSplitsRead;
