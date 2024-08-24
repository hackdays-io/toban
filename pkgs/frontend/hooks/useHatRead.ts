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

export const useGetHats = (hatId: string) => {
  const chainId = useChainId();

  const [topHat, setTopHat] = useState<DefaultHatsDetailsSchema>();
  const [hatterHat, setHatterHat] = useState<DefaultHatsDetailsSchema>();
  const [hatterHatId, setHatterHatId] = useState<bigint>(BigInt(0));
  const [roleHats, setRoleHats] = useState<any[]>();

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
              imageUri: true,
            },
          },
        },
      });

      const topHat = data.hats?.find((hat) => !hat.prettyId?.includes("."));
      const hatterHat = data.hats?.find(
        (hat) => hat.prettyId?.split(".").length === 2
      );
      const roleHats = data.hats?.filter(
        (hat) => hat.prettyId?.split(".").length === 3
      );

      const topCid = removeIpfsPrefix(topHat?.details || "");
      const hatterCid = removeIpfsPrefix(hatterHat?.details || "");
      const roleCids = roleHats?.map((hat) => {
        return {
          cid: removeIpfsPrefix(hat.details || ""),
          imageUri: hat.imageUri,
          id: hat.id,
        };
      });

      const topMetadata = await hatsDetailsClient.get(topCid);
      const hatterMetadata = await hatsDetailsClient.get(hatterCid);
      if (roleCids) {
        const rolesMetadata = await Promise.all(
          roleCids.map(async (role) => {
            const metadata = await hatsDetailsClient.get(role.cid);
            return {
              ...role,
              parsedData: metadata,
            };
          })
        );
        setRoleHats(rolesMetadata);
      }

      setTopHat(topMetadata.parsedData as any);
      setHatterHat(hatterMetadata.parsedData as any);
      setHatterHatId(BigInt(hatterHat?.id || 0));
    };
    fetch();
  }, [chainId, treeId]);

  return {topHat, hatterHat, hatterHatId, roleHats};
};
