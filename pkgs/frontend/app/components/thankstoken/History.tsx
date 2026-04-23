import { Box, Flex, Grid, Skeleton, Text, VStack } from "@chakra-ui/react";
import { Link } from "@remix-run/react";
import type { GetThanksTokenMintsQuery } from "gql/graphql";
import { useNamesByAddresses } from "hooks/useENS";
import { useGetHat } from "hooks/useHats";
import { useThanksTokenActivity } from "hooks/useThanksToken";
import type { NameData } from "namestone-sdk";
import { type FC, useMemo } from "react";
import { ipfs2https } from "utils/ipfs";
import { abbreviateAddress } from "utils/wallet";
import { formatEther, hexToString } from "viem";
import { UserIcon } from "../icon/UserIcon";

interface Props {
  treeId: string;
  limit?: number;
}

interface UserProps extends Props {
  userAddress: string;
  data: GetThanksTokenMintsQuery | undefined;
  txType: "sent" | "received";
}

interface ActivityItemProps {
  treeId: string;
  activity: GetThanksTokenMintsQuery["mintThanksTokens"][0];
  fromUser?: NameData;
  toUser?: NameData;
}

const collectAddresses = (pairs: { from: string; to: string }[]): string[] => {
  const set = new Set<string>();
  for (const p of pairs) {
    if (p.from) set.add(p.from);
    if (p.to) set.add(p.to);
  }
  return Array.from(set);
};

const buildNamesByAddress = (groups: NameData[][]): Map<string, NameData> => {
  const map = new Map<string, NameData>();
  for (const group of groups) {
    const entry = group[0];
    if (entry?.address) {
      map.set(entry.address.toLowerCase(), entry);
    }
  }
  return map;
};

const SKELETON_ROW_KEYS = [
  "row-a",
  "row-b",
  "row-c",
  "row-d",
  "row-e",
  "row-f",
  "row-g",
  "row-h",
  "row-i",
  "row-j",
];

const HistorySkeletonList: FC<{ rows?: number; height?: string }> = ({
  rows = 3,
  height = "56px",
}) => (
  <VStack gap={2} w="full">
    {SKELETON_ROW_KEYS.slice(0, rows).map((k) => (
      <Skeleton key={k} height={height} w="full" borderRadius={5} />
    ))}
  </VStack>
);

const ThanksTokenActivityItem: FC<ActivityItemProps> = ({
  treeId,
  activity,
  fromUser,
  toUser,
}) => {
  const message = useMemo(() => {
    return hexToString(activity.data || "0x");
  }, [activity.data]);

  return (
    <Box
      py={3}
      px={2}
      w="full"
      borderColor="gray.200"
      position="relative"
      bgColor="green.100"
      borderRadius={5}
      overflow="hidden"
    >
      <Box
        position="absolute"
        w="55%"
        h="100%"
        top={0}
        left={0}
        bgColor="green.300"
        opacity={0.5}
      />
      <Box
        position="absolute"
        top={0}
        left="55%"
        as="span"
        display="inline-block"
        width="0"
        height="0"
        borderTop="30px solid transparent"
        borderBottom="30px solid transparent"
        borderLeft="60px solid"
        borderLeftColor="green.300"
        opacity={0.5}
        marginRight={2}
      />
      <Grid
        position="relative"
        gridTemplateColumns="37.5% 25% 37.5%"
        justifyContent="space-between"
        alignItems="center"
      >
        <Link to={`/${treeId}/member/${activity.from}`}>
          <Flex alignItems="center" gap={2}>
            <UserIcon
              size="25px"
              userImageUrl={ipfs2https(fromUser?.text_records?.avatar)}
            />
            <Text fontSize="sm" fontWeight="medium" color="gray.700">
              {fromUser?.name || abbreviateAddress(activity.from)}
            </Text>
          </Flex>
        </Link>

        <Box textAlign="center">
          <Text fontSize="lg" fontWeight="semibold" color="green.600">
            {Number(formatEther(BigInt(activity.amount))).toLocaleString()}{" "}
            <Box fontSize="xs" as="span">
              THX
            </Box>
          </Text>
        </Box>

        <Link to={`/${treeId}/member/${activity.to}`}>
          <Flex justifyContent="flex-end" alignItems="center" gap={2}>
            <Text fontSize="sm" fontWeight="medium" color="gray.700">
              {toUser?.name || abbreviateAddress(activity.to)}
            </Text>
            <UserIcon
              size="25px"
              userImageUrl={ipfs2https(toUser?.text_records?.avatar)}
            />
          </Flex>
        </Link>
      </Grid>
      {message && (
        <Text fontSize="sm" zIndex={1} position="relative">
          {message}
        </Text>
      )}
    </Box>
  );
};

/**
 * ワークスペース全体のサンクストークン履歴を表示するコンポーネント
 */
export const ThanksTokenHistory: FC<Props> = ({ treeId, limit = 10 }) => {
  const { mints, isLoading: isActivityLoading } = useThanksTokenActivity(
    treeId,
    limit,
  );

  const allAddresses = useMemo(
    () => collectAddresses(mints?.mintThanksTokens ?? []),
    [mints],
  );

  const { names, isLoading: isNamesLoading } =
    useNamesByAddresses(allAddresses);
  const namesByAddress = useMemo(() => buildNamesByAddress(names), [names]);

  if (isActivityLoading || !mints) {
    return <HistorySkeletonList rows={Math.min(limit, 3)} />;
  }

  if (mints.mintThanksTokens.length === 0) {
    return (
      <Box p={4} textAlign="center" color="gray.500">
        アクティビティはまだありません
      </Box>
    );
  }

  if (isNamesLoading && namesByAddress.size === 0) {
    return <HistorySkeletonList rows={Math.min(limit, 3)} />;
  }

  return (
    <VStack gap={2}>
      {mints.mintThanksTokens.map((mint) => (
        <ThanksTokenActivityItem
          key={`activity_${mint.id}`}
          treeId={treeId}
          activity={mint}
          fromUser={namesByAddress.get(mint.from.toLowerCase())}
          toUser={namesByAddress.get(mint.to.toLowerCase())}
        />
      ))}
    </VStack>
  );
};

interface ItemProps {
  treeId: string;
  from: string;
  to: string;
  hatId: string;
  amount: number;
  timestamp: number;
  fromUser?: NameData;
  toUser?: NameData;
}

const ThanksTokenItem: FC<ItemProps> = ({
  treeId,
  from,
  to,
  amount,
  hatId,
  fromUser,
  toUser,
}) => {
  const { hat } = useGetHat(hatId);

  return (
    <Flex
      h="60px"
      py={3}
      px={2}
      w="full"
      borderColor="gray.200"
      position="relative"
      bgColor="blue.100"
      borderRadius={5}
      overflow="hidden"
    >
      <Box
        position="absolute"
        w="55%"
        h="100%"
        top={0}
        left={0}
        bgColor="blue.300"
        opacity={0.5}
      />
      <Box
        position="absolute"
        top={0}
        left="55%"
        as="span"
        display="inline-block"
        width="0"
        height="0"
        borderTop="30px solid transparent"
        borderBottom="30px solid transparent"
        borderLeft="60px solid"
        borderLeftColor="blue.300"
        opacity={0.5}
        marginRight={2}
      />
      <Grid
        position="relative"
        gridTemplateColumns="37.5% 25% 37.5%"
        justifyContent="space-between"
        alignItems="center"
        width="full"
      >
        <Link to={`/${treeId}/member/${from}`}>
          <Flex alignItems="center" gap={2}>
            <UserIcon
              size="25px"
              userImageUrl={ipfs2https(fromUser?.text_records?.avatar)}
            />
            <Text fontSize="sm" fontWeight="medium" color="gray.700">
              {fromUser?.name || abbreviateAddress(from)}
            </Text>
          </Flex>
        </Link>

        <Box textAlign="left">
          <Text fontSize="lg" fontWeight="semibold" color="blue.600">
            {amount}{" "}
            <Box fontSize="xs" as="span">
              THX
            </Box>
          </Text>
        </Box>

        <Link to={`/${treeId}/member/${to}`}>
          <Flex justifyContent="flex-end" alignItems="center" gap={2}>
            <Text fontSize="sm" fontWeight="medium" color="gray.700">
              {toUser?.name || abbreviateAddress(to)}
            </Text>
            <UserIcon
              size="25px"
              userImageUrl={ipfs2https(toUser?.text_records?.avatar)}
            />
          </Flex>
        </Link>
      </Grid>
    </Flex>
  );
};

export const UserThanksHistory: FC<UserProps> = ({ data, txType }) => {
  const allAddresses = useMemo(
    () => collectAddresses(data?.mintThanksTokens ?? []),
    [data],
  );

  const { names, isLoading: isNamesLoading } =
    useNamesByAddresses(allAddresses);
  const namesByAddress = useMemo(() => buildNamesByAddress(names), [names]);

  if (!data) {
    return <HistorySkeletonList rows={3} height="60px" />;
  }

  if (!data.mintThanksTokens || data.mintThanksTokens.length === 0) {
    return (
      <Box p={4} textAlign="center" color="gray.500">
        {txType === "sent" ? "送信履歴はありません" : "受信履歴はありません"}
      </Box>
    );
  }

  if (isNamesLoading && namesByAddress.size === 0) {
    return <HistorySkeletonList rows={3} height="60px" />;
  }

  return (
    <VStack gap={2}>
      {data.mintThanksTokens.map((token) => (
        <ThanksTokenItem
          treeId={token.workspaceId || ""}
          key={`${txType}_${token.id}`}
          from={token.from}
          to={token.to}
          hatId={token.id}
          amount={token.amount}
          timestamp={token.blockTimestamp}
          fromUser={namesByAddress.get(token.from.toLowerCase())}
          toUser={namesByAddress.get(token.to.toLowerCase())}
        />
      ))}
    </VStack>
  );
};
