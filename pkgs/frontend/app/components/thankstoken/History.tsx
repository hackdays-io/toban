import { Box, Flex, Grid, Text, VStack } from "@chakra-ui/react";
import { Link } from "@remix-run/react";
import type { GetThanksTokenMintsQuery } from "gql/graphql";
import { useNamesByAddresses } from "hooks/useENS";
import { useGetHat } from "hooks/useHats";
import { useThanksTokenActivity } from "hooks/useThanksToken";
import { type FC, useMemo } from "react";
import { ipfs2https } from "utils/ipfs";
import { abbreviateAddress } from "utils/wallet";
import { formatEther } from "viem";
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
  activity: {
    type: "transfer" | "mint";
    from?: string;
    to: string;
    amount: string;
    blockTimestamp: string;
    thanksToken: {
      symbol: string;
    };
  };
}

const ThanksTokenActivityItem: FC<ActivityItemProps> = ({
  treeId,
  activity,
}) => {
  const addresses = useMemo(() => {
    if (activity.type === "transfer" && activity.from) {
      return [activity.from, activity.to];
    }
    return [activity.to];
  }, [activity]);

  const { names } = useNamesByAddresses(addresses);

  const fromUser = useMemo(() => {
    return activity.type === "transfer" ? names?.[0]?.[0] : null;
  }, [names, activity.type]);

  const toUser = useMemo(() => {
    return activity.type === "transfer" ? names?.[1]?.[0] : names?.[0]?.[0];
  }, [names, activity.type]);

  const isTransfer = activity.type === "transfer";

  return (
    <Box
      h="60px"
      py={3}
      px={2}
      w="full"
      borderColor="gray.200"
      position="relative"
      bgColor={isTransfer ? "green.100" : "blue.100"}
      borderRadius={5}
      overflow="hidden"
    >
      <Box
        position="absolute"
        w="55%"
        h="100%"
        top={0}
        left={0}
        bgColor={isTransfer ? "green.300" : "blue.300"}
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
        borderLeftColor={isTransfer ? "green.300" : "blue.300"}
        opacity={0.5}
        marginRight={2}
      />
      <Grid
        position="relative"
        gridTemplateColumns={isTransfer ? "37.5% 25% 37.5%" : "50% 50%"}
        justifyContent="space-between"
        alignItems="center"
      >
        {isTransfer && activity.from && (
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
        )}

        <Box textAlign={isTransfer ? "left" : "center"}>
          <Text fontSize="xs" lineHeight={1} color="gray.600">
            {isTransfer ? "送信" : "発行"}
          </Text>
          <Text
            fontSize="lg"
            fontWeight="semibold"
            color={isTransfer ? "green.600" : "blue.600"}
          >
            {Number(formatEther(BigInt(activity.amount))).toLocaleString()}{" "}
            <Box fontSize="xs" as="span">
              {activity.thanksToken.symbol}
            </Box>
          </Text>
        </Box>

        <Link to={`/${treeId}/member/${activity.to}`}>
          <Flex
            justifyContent={isTransfer ? "flex-end" : "flex-start"}
            alignItems="center"
            gap={2}
          >
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
    </Box>
  );
};

/**
 * ワークスペース全体のサンクストークン履歴を表示するコンポーネント
 */
export const ThanksTokenHistory: FC<Props> = ({ treeId, limit = 10 }) => {
  const { activities } = useThanksTokenActivity(treeId, limit);

  if (!activities || activities.length === 0) {
    return (
      <Box p={4} textAlign="center" color="gray.500">
        アクティビティはまだありません
      </Box>
    );
  }

  return (
    <VStack gap={2}>
      {activities.map((activity, index) => (
        <ThanksTokenActivityItem
          key={`activity_${activity.type}_${index}`}
          treeId={treeId}
          activity={activity}
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
}

const ThanksTokenItem: FC<ItemProps> = ({
  treeId,
  from,
  to,
  amount,
  hatId,
}) => {
  const addresses = useMemo(() => {
    return [from, to];
  }, [from, to]);

  const { names } = useNamesByAddresses(addresses);

  const fromUser = useMemo(() => {
    return names?.[0]?.[0];
  }, [names]);

  const toUser = useMemo(() => {
    return names?.[1]?.[0];
  }, [names]);

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
  if (!data?.mintThanksTokens || data.mintThanksTokens.length === 0) {
    return (
      <Box p={4} textAlign="center" color="gray.500">
        {txType === "sent" ? "送信履歴はありません" : "受信履歴はありません"}
      </Box>
    );
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
        />
      ))}
    </VStack>
  );
};
