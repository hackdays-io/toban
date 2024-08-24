import {createSubgraphClient, hatsDetailsClient} from "@/lib/hats";
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

export const useGetHats = (topHatId: string) => {
  const chainId = useChainId();

  const [topHat, setTopHat] = useState<DefaultHatsDetailsSchema>();
  const [hatterHat, setHatterHat] = useState<DefaultHatsDetailsSchema>();
  const [hatterHatId, setHatterHatId] = useState<bigint>(BigInt(0));
  const [roleHats, setRoleHats] = useState<any[]>();

  const treeId = useMemo(() => {
    const _treeId = parseInt(BigInt(topHatId).toString(16).slice(0, 3), 16);
    return _treeId;
  }, [topHatId]);

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

      console.log("topHat:", topHat);
      console.log("hatterHat:", hatterHat);

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

export const useGetHat = (hatId: bigint) => {
  const chainId = useChainId();

  const [details, setDetails] = useState<DefaultHatsDetailsSchema>();
  const [imageUri, setImageUri] = useState<string>();

  useEffect(() => {
    const fetch = async () => {
      const data = await hatSubgraphClient.getHat({
        chainId,
        hatId,
        props: {
          details: true,
          imageUri: true,
        },
      });

      const cid = removeIpfsPrefix(data.details || "");
      const metadata = await hatsDetailsClient.get(cid);

      setDetails(metadata.parsedData as any);
      setImageUri(data.imageUri);
    };

    fetch();
  }, []);

  return {details, imageUri};
};

export const useGetMyRoles = () => {
  const chainId = useChainId();
  const {address} = useAccount();

  const [myRoles, setMyRoles] = useState<
    {imageURI: string; details: DefaultHatsDetailsSchema; hatId: BigInt}[]
  >([]);

  useEffect(() => {
    const fetch = async () => {
      if (!address) return;
      const data = await hatSubgraphClient.getWearer({
        chainId,
        wearerAddress: address!,
        props: {
          currentHats: {
            props: {
              details: true,
              imageUri: true,
              prettyId: true,
            },
          },
        },
      });

      const roles = data.currentHats?.filter(
        (ch) => ch.prettyId?.split(".").length === 3
      );

      if (roles) {
        const rolesMetadata = await Promise.all(
          roles.map(async (role) => {
            const cid = removeIpfsPrefix(role.details || "");
            const metadata = await hatsDetailsClient.get(cid);
            return {
              imageURI: role.imageUri!,
              details: metadata as any,
              hatId: BigInt(role.id),
            };
          })
        );
        setMyRoles(rolesMetadata);
      }
    };

    fetch();
  }, [address]);

  return {myRoles};
};
