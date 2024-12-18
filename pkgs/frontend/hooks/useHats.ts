import { hatIdToTreeId } from "@hatsprotocol/sdk-v1-core";
import { Hat, HatsSubgraphClient, Tree } from "@hatsprotocol/sdk-v1-subgraph";
import { HATS_ABI } from "abi/hats";
import { useCallback, useEffect, useState } from "react";
import { Address, decodeEventLog, encodeFunctionData } from "viem";
import { base, optimism, sepolia } from "viem/chains";
import { HATS_ADDRESS } from "./useContracts";
import { useActiveWallet } from "./useWallet";
import { currentChain, publicClient } from "./useViem";
import { ipfs2https, ipfs2httpsJson } from "utils/ipfs";

// ###############################################################
// Read with subgraph
// ###############################################################

// Subgraph用のインスタンスを生成
export const hatsSubgraphClient = new HatsSubgraphClient({
  config: {
    [sepolia.id]: {
      endpoint:
        "https://api.studio.thegraph.com/query/55784/hats-v1-sepolia/version/latest",
    },
    [optimism.id]: {
      endpoint:
        "https://api.studio.thegraph.com/query/55784/hats-v1-optimism/version/latest",
    },
    [base.id]: {
      endpoint:
        "https://api.studio.thegraph.com/query/55784/hats-v1-base/version/latest",
    },
  },
});

export const useTreeInfo = (treeId: number) => {
  const [treeInfo, setTreeInfo] = useState<Tree>();

  const { getTreeInfo } = useHats();

  useEffect(() => {
    const fetch = async () => {
      if (!treeId) return;
      const tree = await getTreeInfo({
        treeId: treeId,
      });

      if (!tree) return;

      setTreeInfo(tree);
    };

    fetch();
  }, [treeId]);

  return treeInfo;
};

/**
 * Hats 向けの React Hooks
 * @returns
 */
export const useHats = () => {
  const { wallet } = useActiveWallet();

  const [isLoading, setIsLoading] = useState(false);

  /**
   * ツリー情報を取得するコールバック関数
   * @param chainId
   * @param treeId
   */
  const getTreeInfo = useCallback(
    async (params: { treeId: number }) => {
      if (!wallet) return;

      setIsLoading(true);

      try {
        const tree = await hatsSubgraphClient.getTree({
          chainId: currentChain.id,
          treeId: params.treeId,
          props: {
            hats: {
              props: {
                prettyId: true,
                status: true,
                createdAt: true,
                details: true,
                maxSupply: true,
                eligibility: true,
                imageUri: true,
                toggle: true,
                levelAtLocalTree: true,
                currentSupply: true,
              },
            },
          },
        });

        return tree;
      } catch (error) {
        console.error("error occured when fetching treeInfo:", error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [wallet]
  );

  /**
   * 特定のウォレットアドレスが着用している全てのHats情報を取得するコールバック関数
   * @param chainId
   * @param hatId
   */
  const getWearersInfo = useCallback(
    async (params: { hatId: string }) => {
      if (!wallet) return;

      setIsLoading(true);

      try {
        const wearers = await hatsSubgraphClient.getWearersOfHatPaginated({
          chainId: currentChain.id,
          props: {},
          hatId: BigInt(params.hatId),
          page: 0,
          perPage: 100,
        });

        return wearers;
      } catch (error) {
        console.error("error occured when getting WearersInfo:", error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [wallet]
  );

  /**
   * Hats所有者の情報を取得するコールバック関数
   * @param chainId
   * @param walletAddress
   */
  const getWearerInfo = useCallback(
    async (params: { walletAddress: string }) => {
      if (!wallet) return;

      setIsLoading(true);

      try {
        const wearer = await hatsSubgraphClient.getWearer({
          chainId: currentChain.id,
          wearerAddress: params.walletAddress as `0x${string}`,
          props: {
            currentHats: {
              props: {
                prettyId: true,
                status: true,
                createdAt: true,
                details: true,
                maxSupply: true,
                eligibility: true,
                toggle: true,
                mutable: true,
                imageUri: true,
                levelAtLocalTree: true,
                currentSupply: true,
              },
            },
          },
        });

        return wearer;
      } catch (error) {
        console.error("error occured when getting WearerInfo:", error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [wallet]
  );

  const getTreesInfoByWearer = useCallback(
    async (params: { walletAddress: string }) => {
      const wearer = await getWearerInfo({
        walletAddress: params.walletAddress as `0x${string}`,
      });

      console.log("wearer", wearer);

      if (!wearer?.currentHats) return [];

      const treesIds = wearer.currentHats.map((hat) => {
        const treeId = hatIdToTreeId(BigInt(hat.id));
        return treeId;
      });

      const treesInfo = await hatsSubgraphClient.getTreesByIds({
        chainId: currentChain.id,
        treeIds: treesIds,
        props: {
          hats: {
            props: {
              details: true,
              imageUri: true,
            },
          },
        },
      });

      console.log("treesInfo", treesInfo);

      return treesInfo;
    },
    [getWearerInfo]
  );

  const getWorkspacesList = useCallback(
    async (params: { walletAddress: string }) => {
      const treesInfo = await getTreesInfoByWearer({
        walletAddress: params.walletAddress,
      });
      console.log("treesInfo", treesInfo);
      const workspacesList = await Promise.all(
        treesInfo.map(async (tree) => {
          const detailsUri = tree?.hats?.[0]?.details;
          const detailsJson = detailsUri
            ? await ipfs2httpsJson(detailsUri)
            : undefined;
          const imageIpfsUri = tree?.hats?.[0].imageUri;
          const imageHttps = ipfs2https(imageIpfsUri);
          return {
            treeId: tree?.id,
            name: detailsJson?.data.name,
            imageUrl: imageHttps,
          };
        })
      );
      return workspacesList;
    },
    [getTreesInfoByWearer]
  );

  /**
   * HatsTimeframeModuleコントラクトのアドレスを取得するコールバック関数
   */
  const getHatsTimeframeModuleAddress = useCallback(
    async (params: { chainId: number; hatId: string }) => {
      if (!wallet) return;

      setIsLoading(true);

      try {
        const treeId = hatIdToTreeId(BigInt(params.hatId));
        // get TreeInfo
        const tree = await getTreeInfo({
          treeId,
        });
        const hatterHat = tree?.hats?.find(
          (hat: Hat) => hat.levelAtLocalTree === 1
        );
        if (!hatterHat) {
          throw new Error("Hatter hat not found");
        }
        // get WearersInfo
        const wearers = await getWearersInfo({
          hatId: hatterHat.id,
        });

        if (wearers!.length === 0) {
          throw new Error("No wearers found for hatter hat");
        }

        return wearers![0].id;
      } catch (error) {
        console.error(
          "error occured when getting HatsTimeframeModuleAddress:",
          error
        );
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [wallet]
  );

  /**
   * 新しくHatを作成するコールバック関数
   * @param parentHatId
   * @param details
   * @param maxSupply
   * @param eligibility
   * @param toggle
   * @param mutable
   * @param imageURI
   */
  const createHat = useCallback(
    async (params: {
      parentHatId: bigint;
      details?: string;
      maxSupply?: number;
      eligibility?: Address;
      toggle?: Address;
      mutable?: boolean;
      imageURI?: string;
    }) => {
      if (!wallet) return;

      setIsLoading(true);

      try {
        const txHash = await wallet.sendTransaction({
          calls: [
            {
              to: HATS_ADDRESS,
              data: encodeFunctionData({
                abi: HATS_ABI,
                functionName: "createHat",
                args: [
                  params.parentHatId,
                  params.details || "",
                  params.maxSupply || 5,
                  params.eligibility ||
                    "0x0000000000000000000000000000000000004a75",
                  params.toggle || "0x0000000000000000000000000000000000004a75",
                  params.mutable || true,
                  params.imageURI || "",
                ],
              }),
            },
          ],
        });

        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });

        const log = receipt.logs.find((log) => {
          try {
            const decodedLog = decodeEventLog({
              abi: HATS_ABI,
              data: log.data,
              topics: log.topics,
            });
            return decodedLog.eventName === "HatCreated";
          } catch (error) {
            console.error("error occured when creating Hats :", error);
          }
        })!;

        if (log) {
          const decodedLog = decodeEventLog({
            abi: HATS_ABI,
            data: log.data,
            topics: log.topics,
          });
          console.log({ decodedLog });
        }
        return txHash;
      } catch (error) {
        console.error("error occured when creating Hats:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [wallet]
  );

  /**
   * ロールを付与するコールバック関数
   * @param hatId
   * @param wearer
   */
  const mintHat = useCallback(
    async (params: { hatId: bigint; wearer: Address }) => {
      if (!wallet) return;

      setIsLoading(true);

      try {
        const txHash = await wallet.sendTransaction({
          calls: [
            {
              to: HATS_ADDRESS,
              data: encodeFunctionData({
                abi: HATS_ABI,
                functionName: "mintHat",
                args: [params.hatId, params.wearer],
              }),
            },
          ],
        });

        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });

        console.log({ receipt });

        return txHash;
      } catch (error) {
        console.error("error occured when minting Hat:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [wallet]
  );

  return {
    isLoading,
    getTreeInfo,
    getWearersInfo,
    getWearerInfo,
    getTreesInfoByWearer,
    getWorkspacesList,
    getHatsTimeframeModuleAddress,
    createHat,
    mintHat,
  };
};
