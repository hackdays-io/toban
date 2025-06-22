import {
  Box,
  Button,
  Flex,
  Grid,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Link } from "@remix-run/react";
import { OrderDirection, TransferFractionToken_OrderBy } from "gql/graphql";
import { useNamesByAddresses } from "hooks/useENS";
import { useGetTransferFractionTokens } from "hooks/useFractionToken";
import { type FC, useMemo, useState } from "react";
import { ipfs2https } from "utils/ipfs";
import { abbreviateAddress } from "utils/wallet";
import { UserIcon } from "../icon/UserIcon";

interface Props {
  treeId: string;
  limit?: number;
}

interface FriendshipData {
  user1: string;
  user2: string;
  totalAmount: number;
  transactionCount: number;
}

interface FriendshipItemProps {
  treeId: string;
  friendship: FriendshipData;
  rank: number;
  sortBy: SortType;
}

const FriendshipItem: FC<FriendshipItemProps> = ({
  treeId,
  friendship,
  rank,
  sortBy,
}) => {
  const addresses = useMemo(() => {
    return [friendship.user1, friendship.user2];
  }, [friendship.user1, friendship.user2]);

  const { names } = useNamesByAddresses(addresses);

  const user1Name = useMemo(() => {
    return names?.[0]?.[0];
  }, [names]);

  const user2Name = useMemo(() => {
    return names?.[1]?.[0];
  }, [names]);

  return (
    <Box
      h="70px"
      py={3}
      px={4}
      w="full"
      borderColor="gray.200"
      position="relative"
      bgColor="purple.50"
      borderRadius={8}
      overflow="hidden"
      border="1px solid"
      borderBottomColor="purple.200"
    >
      <Grid
        gridTemplateColumns="60px 1fr 100px"
        justifyContent="space-between"
        alignItems="center"
        height="100%"
      >
        {/* Rank */}
        <Flex
          alignItems="center"
          justifyContent="center"
          w="40px"
          h="40px"
          borderRadius="full"
          bgColor="purple.500"
          color="white"
          fontWeight="bold"
          fontSize="lg"
        >
          {rank}
        </Flex>

        {/* Users */}
        <Flex
          alignItems="center"
          justifyContent="center"
          gap={3}
          px={2}
          minW="0"
        >
          <Link to={`/${treeId}/member/${friendship.user1}`}>
            <VStack gap={1} minW="0" alignItems="center">
              <UserIcon
                size="32px"
                userImageUrl={ipfs2https(user1Name?.text_records?.avatar)}
              />
              <Text
                fontSize="xs"
                fontWeight="medium"
                color="gray.700"
                maxW="70px"
                textAlign="center"
                overflow="hidden"
                whiteSpace="nowrap"
                textOverflow="ellipsis"
              >
                {user1Name?.name || abbreviateAddress(friendship.user1)}
              </Text>
            </VStack>
          </Link>

          <Text
            color="purple.500"
            fontWeight="bold"
            fontSize="lg"
            alignSelf="flex-start"
            mt={2}
          >
            ⟷
          </Text>

          <Link to={`/${treeId}/member/${friendship.user2}`}>
            <VStack gap={1} minW="0" alignItems="center">
              <UserIcon
                size="32px"
                userImageUrl={ipfs2https(user2Name?.text_records?.avatar)}
              />
              <Text
                fontSize="xs"
                fontWeight="medium"
                color="gray.700"
                maxW="70px"
                textAlign="center"
                overflow="hidden"
                whiteSpace="nowrap"
                textOverflow="ellipsis"
              >
                {user2Name?.name || abbreviateAddress(friendship.user2)}
              </Text>
            </VStack>
          </Link>
        </Flex>

        {/* Stats */}
        <Box textAlign="center" w="100px">
          {sortBy === "totalAmount" ? (
            <>
              <Text fontSize="lg" fontWeight="bold" color="purple.600">
                {friendship.totalAmount}
              </Text>
              <Text fontSize="xs" color="gray.500">
                {friendship.transactionCount}回
              </Text>
            </>
          ) : (
            <>
              <Text fontSize="lg" fontWeight="bold" color="purple.600">
                {friendship.transactionCount}回
              </Text>
              <Text fontSize="xs" color="gray.500">
                {friendship.totalAmount}pt
              </Text>
            </>
          )}
        </Box>
      </Grid>
    </Box>
  );
};

type SortType = "totalAmount" | "transactionCount";

/**
 * フレンドシップランキングを表示するコンポーネント
 * 二人の間でのアシストクレジット総量と取引回数を表示
 */
export const FriendshipRanking: FC<Props> = ({ treeId, limit = 50 }) => {
  const [sortBy, setSortBy] = useState<SortType>("totalAmount");
  const { data } = useGetTransferFractionTokens({
    where: {
      workspaceId: treeId,
    },
    orderBy: TransferFractionToken_OrderBy.BlockTimestamp,
    orderDirection: OrderDirection.Desc,
    first: limit,
  });

  const friendshipData = useMemo(() => {
    if (!data?.transferFractionTokens) return [];

    // ユーザーペア間のデータを集計
    const pairMap = new Map<string, FriendshipData>();

    for (const token of data.transferFractionTokens) {
      const user1 = token.from.toLowerCase();
      const user2 = token.to.toLowerCase();

      // アドレスをソートしてペアキーを作成（順序に関係なく同じペアとして扱う）
      const sortedPair = [user1, user2].sort();
      const pairKey = `${sortedPair[0]}-${sortedPair[1]}`;

      if (pairMap.has(pairKey)) {
        const existing = pairMap.get(pairKey);
        if (existing) {
          existing.totalAmount += Number(token.amount);
          existing.transactionCount += 1;
        }
      } else {
        pairMap.set(pairKey, {
          user1: sortedPair[0],
          user2: sortedPair[1],
          totalAmount: Number(token.amount),
          transactionCount: 1,
        });
      }
    }

    // ソート
    return Array.from(pairMap.values())
      .sort((a, b) => {
        if (sortBy === "totalAmount") {
          return b.totalAmount - a.totalAmount;
        }
        return b.transactionCount - a.transactionCount;
      })
      .slice(0, 20); // 上位20ペアまで表示
  }, [data, sortBy]);

  if (
    !data?.transferFractionTokens ||
    data.transferFractionTokens.length === 0
  ) {
    return (
      <Box p={8} textAlign="center" color="gray.500">
        <Text>フレンドシップデータがありません</Text>
      </Box>
    );
  }

  return (
    <VStack gap={3} mt={4}>
      <Box w="full" mb={2}>
        <Text fontSize="sm" color="gray.600" textAlign="center">
          コミュニティ内での友情ランキング
        </Text>
        <HStack justifyContent="center" mt={3} gap={2}>
          <Button
            size="sm"
            variant={sortBy === "totalAmount" ? "solid" : "outline"}
            colorScheme="purple"
            onClick={() => setSortBy("totalAmount")}
          >
            総交換量順
          </Button>
          <Button
            size="sm"
            variant={sortBy === "transactionCount" ? "solid" : "outline"}
            colorScheme="purple"
            onClick={() => setSortBy("transactionCount")}
          >
            取引回数順
          </Button>
        </HStack>
      </Box>
      {friendshipData.map((friendship, index) => (
        <FriendshipItem
          treeId={treeId}
          key={`friendship_${friendship.user1}_${friendship.user2}`}
          friendship={friendship}
          rank={index + 1}
          sortBy={sortBy}
        />
      ))}
    </VStack>
  );
};
