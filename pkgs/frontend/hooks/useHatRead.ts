import {hatsDetailsClient, createSubgraphClient} from "@/lib/hats";
import {removeIpfsPrefix} from "@/lib/ipfs";
import {useEffect, useState} from "react";
import {useAccount, useChainId} from "wagmi";

const hatSubgraphClient = createSubgraphClient();

export const useGetTopHat = (treeId: number) => {
  const chainId = useChainId();

  type TopHat = {
    id: string;
    prettyId: string;
    details: string;
  };
  const [topHat, setTopHat] = useState<TopHat>();

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

      const cid = removeIpfsPrefix(data.hats[0].details || "");

      if (!data.hats || data.hats.length === 0) return;
      const metadata = await hatsDetailsClient.get(
        "QmXEsYeiRtUovpAYQaRhELkbr9Ra4kWGXhmF2THUEwwHYZ"
      );
      console.log(data);
      console.log(metadata);
    };
    fetch();
  }, [chainId, treeId]);

  return;
};
