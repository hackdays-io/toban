import { gql } from "@apollo/client/core";
import { useQuery } from "@apollo/client/react/hooks";
import { FRACTION_TOKEN_ABI } from "abi/fractiontoken";
import type {
  GetTransferFractionTokensQuery,
  GetTransferFractionTokensQueryVariables,
  OrderDirection,
  TransferFractionToken_Filter,
  TransferFractionToken_OrderBy,
} from "gql/graphql";
import { useCallback, useEffect, useState } from "react";
import {
  type Address,
  decodeEventLog,
  encodeFunctionData,
  encodePacked,
  keccak256,
} from "viem";
import {
  FRACTION_TOKEN_ADDRESS,
  fractionTokenBaseConfig,
} from "./useContracts";
import { publicClient } from "./useViem";
import { useActiveWallet } from "./useWallet";

export const useTokenRecipients = (
  params: {
    wearer: Address;
    hatId: Address;
  }[],
) => {
  const [recipients, setRecipients] = useState<
    {
      assistant: Address;
      hatIds: Address[];
    }[]
  >([]);

  const { getTokenId, getTokenRecipients } = useFractionToken();

  useEffect(() => {
    const fetch = async () => {
      try {
        const fetchedRecipients = await Promise.all(
          params.map(async ({ hatId, wearer }) => {
            const tokenId = getTokenId({
              hatId: BigInt(hatId),
              account: wearer,
            });
            if (!tokenId) return;
            return {
              hatId,
              assistants: (await getTokenRecipients({ tokenId })) || [],
            };
          }),
        );

        const formattedRecipients = fetchedRecipients
          .filter((r) => !!r)
          .reduce(
            (acc, r) => {
              for (const a of r.assistants) {
                const existing = acc.find((item) => item.assistant === a);
                if (existing) {
                  existing.hatIds.push(r.hatId);
                } else {
                  acc.push({ assistant: a, hatIds: [r.hatId] });
                }
              }
              return acc;
            },
            [] as {
              assistant: Address;
              hatIds: Address[];
            }[],
          );

        setRecipients(formattedRecipients);
      } catch (error) {
        console.error("error occured when fetching tokenRecipients:", error);
      }
    };

    fetch();
  }, [params, getTokenId, getTokenRecipients]);

  return recipients;
};

export const useHoldersWithoutWearers = ({
  hatId,
  wearers,
}: {
  hatId?: string;
  wearers: string[];
}) => {
  const [holders, setHolders] = useState<Address[]>([]);

  const { getTokenId, getTokenRecipients } = useFractionToken();

  useEffect(() => {
    const fetch = async () => {
      if (!hatId) return;
      try {
        const fetchedRecipients = await Promise.all(
          wearers.map(async (w) => {
            const tokenId = getTokenId({
              hatId: BigInt(hatId),
              account: w as Address,
            });
            if (!tokenId) return [];
            const recipients = (await getTokenRecipients({ tokenId }))?.filter(
              (r) => r.toLowerCase() !== w.toLowerCase(),
            );
            return recipients || [];
          }),
        );

        setHolders(fetchedRecipients.flat());
      } catch (error) {
        console.error("error occured when fetching tokenRecipients:", error);
      }
    };

    fetch();
  }, [getTokenId, getTokenRecipients, hatId, wearers]);

  return holders;
};

export const useHoldersWithBalance = ({
  wearer,
  hatId,
}: {
  wearer?: string;
  hatId?: string;
}) => {
  const [holders, setHolders] = useState<
    {
      holder: Address;
      balance: bigint;
    }[]
  >([]);

  const { getTokenId, getTokenRecipients } = useFractionToken();

  useEffect(() => {
    const fetch = async () => {
      if (!wearer || !hatId) return;
      try {
        const tokenId = getTokenId({
          hatId: BigInt(hatId),
          account: wearer as Address,
        });
        if (!tokenId) return;
        const holders = [...((await getTokenRecipients({ tokenId })) || [])];

        if (!holders.length) return;
        const balances = await publicClient.readContract({
          ...fractionTokenBaseConfig,
          functionName: "balanceOfBatch",
          args: [holders, holders.map(() => BigInt(tokenId))],
        });

        const holdersWithBalance = holders.map((holder, index) => ({
          holder,
          balance: balances[index],
        }));

        setHolders(holdersWithBalance);
      } catch (error) {
        console.error("error occured when fetching tokenRecipients:", error);
      }
    };

    fetch();
  }, [getTokenId, getTokenRecipients, wearer, hatId]);

  return holders;
};

export const useBalanceOfFractionToken = (
  holder: Address,
  address: Address,
  hatId: bigint,
) => {
  const [balance, setBalance] = useState<bigint>();

  useEffect(() => {
    const fetch = async () => {
      if (!holder || !address || !hatId) return;
      try {
        const balance = await publicClient.readContract({
          ...fractionTokenBaseConfig,
          functionName: "balanceOf",
          args: [holder, address, hatId],
        });
        setBalance(balance);
      } catch (error) {
        setBalance(0n);
      }
    };

    fetch();
  }, [holder, hatId, address]);

  return balance;
};

export const useBalancesWithHat = (treeId?: string, address?: Address) => {
  const { data: data1 } = useGetTransferFractionTokens({
    where: {
      workspaceId: treeId,
      from: address?.toLowerCase(),
    },
    first: 100,
  });

  const { data: data2 } = useGetTransferFractionTokens({
    where: {
      workspaceId: treeId,
      to: address?.toLowerCase(),
    },
    first: 100,
  });

  const [balances, setBalances] = useState<
    {
      balance: bigint;
      isHolder: boolean;
      hatId: bigint;
    }[]
  >([]);

  useEffect(() => {
    const fetch = async () => {
      if (!address) return;

      const data = {
        transferFractionTokens: [
          ...(data1?.transferFractionTokens || []),
          ...(data2?.transferFractionTokens || []),
        ],
      };

      const tokens = Array.from(
        new Set(
          data.transferFractionTokens
            .filter(({ workspaceId }) => Number(workspaceId) > 0)
            .map(({ wearer, hatId }) => JSON.stringify({ wearer, hatId })),
        ),
      );

      try {
        const _balances = await Promise.all(
          tokens
            .map((token) => JSON.parse(token))
            .map(async ({ wearer, hatId }) => {
              const isHolder = address.toLowerCase() === wearer.toLowerCase();

              const balance = await publicClient.readContract({
                ...fractionTokenBaseConfig,
                functionName: "balanceOf",
                args: [address, wearer as Address, BigInt(hatId)],
              });

              return { balance, isHolder, hatId };
            }),
        );
        setBalances(_balances);
      } catch (error) {
        console.error(error);
        setBalances([]);
      }
    };

    fetch();
  }, [address, data1, data2]);

  return balances;
};

/**
 * FractionToken 向けの React Hooks
 * @returns
 */
export const useFractionToken = () => {
  const { wallet } = useActiveWallet();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * tokenRecipientsを取得するコールバック関数
   * @param tokenId
   */
  const getTokenRecipients = useCallback(
    async (params: { tokenId: bigint }) => {
      setIsLoading(true);

      try {
        const res = await publicClient.readContract({
          ...fractionTokenBaseConfig,
          functionName: "getTokenRecipients",
          args: [params.tokenId],
        });

        return res;
      } catch (error) {
        console.error("error occured when fetching tokenRecipients:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  /**
   * tokenIdを取得するコールバック関数
   * @param hatId
   * @param account address
   */
  const getTokenId = (params: { hatId: bigint; account: Address }) => {
    setIsLoading(true);

    try {
      const tokenId = BigInt(
        keccak256(
          encodePacked(["uint256", "address"], [params.hatId, params.account]),
        ).toString(),
      );

      return tokenId;
    } catch (error) {
      console.error("error occured when fetching tokenId:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const mintInitialSupplyFractionToken = useCallback(
    async (params: { hatId: bigint; account: Address; amount?: bigint }) => {
      if (!wallet) return;

      setIsLoading(true);

      try {
        const txHash = await wallet.writeContract({
          ...fractionTokenBaseConfig,
          functionName: "mintInitialSupply",
          args: [params.hatId, params.account, params.amount || BigInt(0)],
        });

        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });

        const log = receipt.logs.find((log) => {
          try {
            const decodedLog = decodeEventLog({
              abi: FRACTION_TOKEN_ABI,
              data: log.data,
              topics: log.topics,
            });
            return decodedLog.eventName === "InitialMint";
          } catch (error) {
            console.error("error occured when minting FractionToken:", error);
          }
        });

        if (log) {
          const decodedLog = decodeEventLog({
            abi: FRACTION_TOKEN_ABI,
            data: log.data,
            topics: log.topics,
          });
          console.log({ decodedLog });
        }
        return txHash;
      } finally {
        setIsLoading(false);
      }
    },
    [wallet],
  );

  /**
   * FractionTokenを発行するコールバック関数
   * @param hatId
   * @param account address
   */
  const mintFractionToken = useCallback(
    async (params: { hatId: bigint; account: Address; amount: bigint }) => {
      if (!wallet) return;

      setIsLoading(true);

      try {
        const txHash = await wallet.writeContract({
          ...fractionTokenBaseConfig,
          functionName: "mint",
          args: [params.hatId, params.account, params.amount],
        });

        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });

        const log = receipt.logs.find((log) => {
          try {
            const decodedLog = decodeEventLog({
              abi: FRACTION_TOKEN_ABI,
              data: log.data,
              topics: log.topics,
            });
            return decodedLog.eventName === "TransferSingle";
          } catch (error) {
            console.error("error occured when minting FractionToken:", error);
          }
        });

        if (log) {
          const decodedLog = decodeEventLog({
            abi: FRACTION_TOKEN_ABI,
            data: log.data,
            topics: log.topics,
          });
          console.log({ decodedLog });
        }
        return txHash;
      } finally {
        setIsLoading(false);
      }
    },
    [wallet],
  );

  /**
   * FractionTokenを送信するコールバック関数
   * @param hatId
   * @param account address
   * @param to recipient address
   * @param amount amount of token
   */
  const sendFractionToken = useCallback(
    async (params: {
      hatId: bigint;
      account: Address;
      to: Address;
      amount: bigint;
    }) => {
      if (!wallet) return;

      setIsLoading(true);

      try {
        // tokenIdを取得
        const tokenId = await publicClient.readContract({
          ...fractionTokenBaseConfig,
          functionName: "getTokenId",
          args: [params.hatId, params.account],
        });

        // FractionTokenをtransferする。
        const txHash = await wallet.writeContract({
          ...fractionTokenBaseConfig,
          functionName: "safeTransferFrom",
          args: [params.account, params.to, tokenId, params.amount, "0x"],
        });

        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });

        const log = receipt.logs.find((log) => {
          try {
            const decodedLog = decodeEventLog({
              abi: FRACTION_TOKEN_ABI,
              data: log.data,
              topics: log.topics,
            });
            return decodedLog.eventName === "TransferSingle";
          } catch (error) {
            console.error("error occured when minting FractionToken:", error);
          }
        });

        if (log) {
          const decodedLog = decodeEventLog({
            abi: FRACTION_TOKEN_ABI,
            data: log.data,
            topics: log.topics,
          });
          console.log({ decodedLog });
        }
        return txHash;
      } finally {
        setIsLoading(false);
      }
    },
    [wallet],
  );

  return {
    isLoading,
    getTokenRecipients,
    getTokenId,
    mintInitialSupplyFractionToken,
    mintFractionToken,
    sendFractionToken,
  };
};

export const useTransferFractionToken = (hatId: bigint, wearer: Address) => {
  const { wallet } = useActiveWallet();

  const [isLoading, setIsLoading] = useState(false);
  const [tokenId, setTokenId] = useState<bigint>();
  const [initialized, setInitialized] = useState(false);

  const { getTokenRecipients, getTokenId } = useFractionToken();

  useEffect(() => {
    const fetch = async () => {
      const _tokenId = getTokenId({
        hatId: hatId,
        account: wearer,
      });
      if (!_tokenId) return;
      setTokenId(_tokenId);
      const recipients = await getTokenRecipients({ tokenId: _tokenId });
      if (recipients?.some((r) => r.toLowerCase() === wearer.toLowerCase())) {
        setInitialized(true);
      }
    };
    fetch();
  }, [hatId, wearer, getTokenId, getTokenRecipients]);

  const transferFractionToken = useCallback(
    async (to: Address, amount: bigint) => {
      console.log(wallet, tokenId);
      if (!wallet || !tokenId) return;

      setIsLoading(true);

      let txHash: `0x${string}` | undefined = undefined;
      let error: string | undefined = undefined;
      if (initialized) {
        try {
          txHash = await wallet.writeContract({
            ...fractionTokenBaseConfig,
            functionName: "safeTransferFrom",
            args: [wallet.account.address, to, tokenId, amount, "0x"],
          });
        } catch {
          error = "アシストクレジットの送信に失敗しました";
        } finally {
          setIsLoading(false);
        }
      } else if (
        wallet.account.address.toLocaleLowerCase() ===
        wearer.toLocaleLowerCase()
      ) {
        const mintInitialSupplyData = encodeFunctionData({
          abi: FRACTION_TOKEN_ABI,
          functionName: "mintInitialSupply",
          args: [hatId, wearer, BigInt(0)],
        });
        const transferData = encodeFunctionData({
          abi: FRACTION_TOKEN_ABI,
          functionName: "safeTransferFrom",
          args: [wallet.account.address, to, tokenId, amount, "0x"],
        });
        try {
          txHash = await wallet.writeContract({
            ...fractionTokenBaseConfig,
            functionName: "multicall",
            args: [[mintInitialSupplyData, transferData]],
          });
        } catch (error) {
          console.error(error);
        } finally {
          await publicClient.waitForTransactionReceipt({
            hash: txHash ?? "0x",
          });
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
        error = "この役割についてあなたはアシストクレジットの送信ができません";
      }

      return { txHash, error };
    },
    [wallet, initialized, tokenId, hatId, wearer],
  );

  return { isLoading, transferFractionToken };
};

/////////////////////////////////////
/////// Start subgraph section //////
/////////////////////////////////////

const queryGetTransferFractionTokens = gql(`
  query GetTransferFractionTokens($where: TransferFractionToken_filter = {}, $orderBy: TransferFractionToken_orderBy, $orderDirection: OrderDirection = asc, $first: Int = 10) {
    transferFractionTokens(where: $where, orderBy: $orderBy, orderDirection: $orderDirection, first: $first) {
      amount
      from
      to
      tokenId
      blockNumber
      blockTimestamp
      hatId
      id
      wearer
      workspaceId
    }
  }
`);

export const useGetTransferFractionTokens = (params: {
  where?: TransferFractionToken_Filter;
  orderBy?: TransferFractionToken_OrderBy;
  orderDirection?: OrderDirection;
  first?: number;
}) => {
  const result = useQuery<
    GetTransferFractionTokensQuery,
    GetTransferFractionTokensQueryVariables
  >(queryGetTransferFractionTokens, {
    variables: {
      where: params.where,
      orderBy: params.orderBy,
      orderDirection: params.orderDirection,
      first: params.first,
    },
  });

  return result;
};
