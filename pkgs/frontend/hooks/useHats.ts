import { hatIdToTreeId, treeIdHexToDecimal } from "@hatsprotocol/sdk-v1-core";
import {
  type Hat,
  HatsSubgraphClient,
  type Tree,
} from "@hatsprotocol/sdk-v1-subgraph";
import { HATS_ABI } from "abi/hats";
import { useCallback, useEffect, useState } from "react";
import { ipfs2https, ipfs2httpsJson } from "utils/ipfs";
import { type Address, parseEventLogs } from "viem";
import { base, optimism, sepolia } from "viem/chains";
import { HATS_ADDRESS } from "./useContracts";
import { currentChain, publicClient } from "./useViem";
import { useActiveWallet } from "./useWallet";

// ###############################################################
// Read with subgraph
// ###############################################################

const theGraphAPIKey = import.meta.env.VITE_THEGRAPH_API_KEY;

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
      endpoint: theGraphAPIKey
        ? `https://gateway.thegraph.com/api/${theGraphAPIKey}/subgraphs/id/FWeAqrp36QYqv9gDWLwr7em8vtvPnPrmRRQgnBb6QbBs`
        : "https://api.studio.thegraph.com/query/55784/hats-v1-base/version/latest",
    },
  },
});

export const useTreeInfo = (treeId: number) => {
  const [treeInfo, setTreeInfo] = useState<Tree>();

  const { getTreeInfo } = useHats();

  useEffect(() => {
    const fetch = async () => {
      setTreeInfo(undefined);
      if (!treeId) return;

      const tree = await getTreeInfo({
        treeId: treeId,
      });
      if (!tree) return;

      setTreeInfo(tree);
    };

    fetch();
  }, [treeId, getTreeInfo]);

  return treeInfo;
};

/**
 * Hats 向けの React Hooks
 * @returns
 */
export const useHats = () => {
  const { wallet } = useActiveWallet();

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  /**
   * ツリー情報を取得するコールバック関数
   * @param chainId
   * @param treeId
   */
  const getTreeInfo = useCallback(async (params: { treeId: number }) => {
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
              wearers: {
                props: {},
              },
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
  }, []);

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
    [wallet],
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
    [wallet],
  );

  const getTreesInfoByWearer = useCallback(
    async (params: { walletAddress: string }) => {
      const wearer = await getWearerInfo({
        walletAddress: params.walletAddress as `0x${string}`,
      });

      if (!wearer?.currentHats) return [];

      const treesIds = Array.from(
        new Set(
          wearer.currentHats.map((hat) => {
            const treeId = hatIdToTreeId(BigInt(hat.id));
            return treeId;
          }),
        ),
      );

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

      return treesInfo;
    },
    [getWearerInfo],
  );

  const getHat = useCallback(async (hatId: string) => {
    const hat = await hatsSubgraphClient.getHat({
      chainId: currentChain.id,
      hatId: BigInt(hatId),
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
    });

    return hat;
  }, []);

  const getWorkspacesList = useCallback(
    async (params: { walletAddress: string }) => {
      const treesInfo = await getTreesInfoByWearer({
        walletAddress: params.walletAddress,
      });
      const workspacesList = await Promise.all(
        treesInfo.map(async (tree) => {
          const detailsUri = tree?.hats?.[0]?.details;
          const detailsJson = detailsUri
            ? await ipfs2httpsJson(detailsUri)
            : undefined;
          const imageIpfsUri = tree?.hats?.[0].imageUri;
          const imageHttps = ipfs2https(imageIpfsUri);
          return {
            treeId: String(treeIdHexToDecimal(tree?.id)),
            name: detailsJson?.data.name,
            imageUrl: imageHttps,
          };
        }),
      );
      return workspacesList;
    },
    [getTreesInfoByWearer],
  );

  const getWorkspacesListByIds = useCallback(
    async (params: { treeIds: number[] }) => {
      const treesInfo = await hatsSubgraphClient.getTreesByIds({
        chainId: currentChain.id,
        treeIds: params.treeIds,
        props: {
          hats: {
            props: {
              details: true,
              imageUri: true,
            },
          },
        },
      });

      const workspacesList = await Promise.all(
        treesInfo.map(async (tree) => {
          const detailsUri = tree?.hats?.[0]?.details;
          const detailsJson = detailsUri
            ? await ipfs2httpsJson(detailsUri)
            : undefined;
          const imageIpfsUri = tree?.hats?.[0].imageUri;
          const imageHttps = ipfs2https(imageIpfsUri);
          return {
            treeId: String(treeIdHexToDecimal(tree?.id)),
            name: detailsJson?.data.name,
            imageUrl: imageHttps,
          };
        }),
      );
      return workspacesList;
    },
    [],
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
          (hat: Hat) => hat.levelAtLocalTree === 1,
        );
        if (!hatterHat) {
          throw new Error("Hatter hat not found");
        }
        // get WearersInfo
        const wearers = await getWearersInfo({
          hatId: hatterHat.id,
        });

        if (wearers?.length === 0) {
          throw new Error("No wearers found for hatter hat");
        }

        return wearers?.[0].id;
      } catch (error) {
        console.error(
          "error occured when getting HatsTimeframeModuleAddress:",
          error,
        );
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [wallet, getTreeInfo, getWearersInfo],
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
        const txHash = await wallet.writeContract({
          abi: HATS_ABI,
          address: HATS_ADDRESS,
          functionName: "createHat",
          args: [
            params.parentHatId,
            params.details || "",
            params.maxSupply || 5,
            params.eligibility || "0x0000000000000000000000000000000000004a75",
            params.toggle || "0x0000000000000000000000000000000000004a75",
            params.mutable || true,
            params.imageURI || "",
          ],
        });

        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });

        const parsedLog = parseEventLogs({
          abi: HATS_ABI,
          eventName: "HatCreated",
          logs: receipt.logs,
          strict: false,
        });

        return parsedLog;
      } catch (error) {
        console.error("error occured when creating Hats:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [wallet],
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
        const txHash = await wallet.writeContract({
          abi: HATS_ABI,
          address: HATS_ADDRESS,
          functionName: "mintHat",
          args: [params.hatId, params.wearer],
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
    [wallet],
  );

  const changeHatDetails = useCallback(
    async (params: { hatId: bigint; newDetails: string }) => {
      if (!wallet) return;

      setIsLoading(true);

      try {
        const txHash = await wallet.writeContract({
          abi: HATS_ABI,
          address: HATS_ADDRESS,
          functionName: "changeHatDetails",
          args: [params.hatId, params.newDetails],
        });

        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });

        const parsedLog = parseEventLogs({
          abi: HATS_ABI,
          eventName: "HatDetailsChanged",
          logs: receipt.logs,
          strict: false,
        });

        return parsedLog;
      } catch (error) {
        console.error("error occured when creating Hats:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [wallet],
  );

  const changeHatImageURI = useCallback(
    async (params: { hatId: bigint; newImageURI: string }) => {
      if (!wallet) return;

      setIsLoading(true);

      try {
        const txHash = await wallet.writeContract({
          abi: HATS_ABI,
          address: HATS_ADDRESS,
          functionName: "changeHatImageURI",
          args: [params.hatId, params.newImageURI],
        });

        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });

        const parsedLog = parseEventLogs({
          abi: HATS_ABI,
          eventName: "HatImageURIChanged",
          logs: receipt.logs,
          strict: false,
        });

        return parsedLog;
      } catch (error) {
        console.error("error occured when creating Hats:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [wallet],
  );

  const renounceHat = useCallback(
    async (hatId: bigint) => {
      if (!wallet) return;

      setIsLoading(true);

      try {
        const txHash = await wallet.writeContract({
          abi: HATS_ABI,
          address: HATS_ADDRESS,
          functionName: "renounceHat",
          args: [hatId],
        });

        await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    },
    [wallet],
  );

  /**
   * Transfers a hat from one wearer to another eligible wearer.
   * This hook wraps the `transferHat` function defined in the Hats.sol smart contract.
   *
   * @param params.hatId The hat in question (as bigint)
   * @param params.from The current wearer's address
   * @param params.to The new wearer's address
   */
  const transferHat = useCallback(
    async (params: { hatId: bigint; from: Address; to: Address }) => {
      if (!wallet) return;

      setIsLoading(true);
      setIsSuccess(false);
      try {
        const txHash = await wallet.writeContract({
          abi: HATS_ABI,
          address: HATS_ADDRESS,
          functionName: "transferHat",
          args: [params.hatId, params.from, params.to],
        });
        // Wait for the transaction to be mined
        await publicClient.waitForTransactionReceipt({ hash: txHash });
        console.log("Hat transferred successfully", txHash);
        setIsSuccess(true);
        return txHash;
      } catch (error) {
        console.error("Error occurred when transferring hat:", error);
        setIsSuccess(false);
        throw error;
      } finally {
        setIsSuccess(false);
        setIsLoading(false);
      }
    },
    [wallet],
  );

  return {
    isLoading,
    isSuccess,
    getTreeInfo,
    getWearersInfo,
    getWearerInfo,
    getTreesInfoByWearer,
    getHat,
    getWorkspacesList,
    getWorkspacesListByIds,
    getHatsTimeframeModuleAddress,
    createHat,
    mintHat,
    changeHatDetails,
    changeHatImageURI,
    renounceHat,
    transferHat,
  };
};

export const useGetHat = (hatId: string) => {
  const [hat, setHat] = useState<Hat>();
  const [isLoading, setIsLoading] = useState(false);

  const { getHat } = useHats();

  useEffect(() => {
    const fetch = async () => {
      if (!hatId) return;
      setIsLoading(true);
      try {
        const hat = await getHat(hatId);
        if (!hat) throw new Error("Hat not found");
        setHat(hat);
      } catch (error) {
        console.error("error occured when fetching hat:", error);
      }
      setIsLoading(false);
    };
    fetch();
  }, [hatId, getHat]);

  return { hat, isLoading };
};

export const useGetHats = (hatIds: string[]) => {
  const [hats, setHats] = useState<Hat[]>();
  const [isLoading, setIsLoading] = useState(false);

  const { getHat } = useHats();

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      try {
        const hats = await Promise.all(
          hatIds.map(async (hatId) => await getHat(hatId)),
        );
        setHats(hats);
      } catch (error) {
        console.error("error occured when fetching hats:", error);
      }
      setIsLoading(false);
    };
    fetch();
  }, [hatIds, getHat]);

  return { hats, isLoading };
};

export const useAssignableHats = (treeId: number) => {
  const [assignableHats, setAssignableHats] = useState<Hat[]>([]);

  const tree = useTreeInfo(treeId);

  useEffect(() => {
    if (!tree) return;
    const hats =
      tree?.hats?.filter((h) => Number(h.levelAtLocalTree) >= 2) || [];
    setAssignableHats(hats);
  }, [tree]);

  return assignableHats;
};
