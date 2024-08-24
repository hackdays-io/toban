import {hatsDetailsClient, createSubgraphClient} from "@/lib/hats";
import {removeIpfsPrefix} from "@/lib/ipfs";
import {DefaultHatsDetailsSchema} from "@/types/hats";
import {useEffect, useMemo, useState} from "react";
import {useAccount, useChainId} from "wagmi";

const hatSubgraphClient = createSubgraphClient();

export const useWaitForIndexGraphAPI = () => {
  const chainId = useChainId();

  const waitForIndexGraphAPI = async (hatId: string) => {
    while (true) {
      const data = await hatSubgraphClient.getTree({
        chainId: chainId,
        treeId: parseInt(BigInt(hatId).toString(16).slice(0, 3), 16),
        props: {
          hats: {
            props: {
              details: true,
            },
          },
        },
      });

      console.log(data);

      if (data.hats?.length) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  };

  return {waitForIndexGraphAPI};
};

export const useGetTopHat = (hatId: string) => {
  const chainId = useChainId();

  const [topHat, setTopHat] = useState<DefaultHatsDetailsSchema>();

  const treeId = useMemo(() => {
    const _treeId = parseInt(BigInt(hatId).toString(16).slice(0, 3), 16);
    return _treeId;
  }, [hatId]);

  useEffect(() => {
    const fetch = async () => {
      if (!chainId || !treeId) return;

      const data = await hatSubgraphClient.getTree({
        chainId,
        treeId: treeId,
        props: {
          hats: {
            props: {
              details: true,
              prettyId: true,
            },
          },
        },
      });

      const topHat = data.hats?.find((hat) => !hat.prettyId?.includes("."));

      const cid = removeIpfsPrefix(topHat?.details || "");

      const metadata = await hatsDetailsClient.get(cid);

      setTopHat(metadata.parsedData as any);
    };
    fetch();
  }, [chainId, treeId]);

  return {topHat};
};
