import { Box, Flex, Grid, Text, VStack } from "@chakra-ui/react";
import { Link } from "@remix-run/react";
import type { GetTransferFractionTokensQuery } from "gql/graphql";
import { OrderDirection, TransferFractionToken_OrderBy } from "gql/graphql";
import { useNamesByAddresses } from "hooks/useENS";
import { useGetTransferFractionTokens } from "hooks/useFractionToken";
import { useGetHat } from "hooks/useHats";
import { type FC, useMemo, useState } from "react";
import type { HatsDetailSchama } from "types/hats";
import { ipfs2https } from "utils/ipfs";
import { abbreviateAddress } from "utils/wallet";
import { HatsListItemParser } from "../common/HatsListItemParser";
import { UserIcon } from "../icon/UserIcon";
import DateRangePicker from "../ui/daterangepicker";

interface Props {
  treeId: string;
  limit?: number;
}

interface UserProps extends Props {
  userAddress: string;
  data: GetTransferFractionTokensQuery | undefined;
  txType: "sent" | "received";
}

interface ItemProps {
  treeId: string;
  from: string;
  to: string;
  hatId: string;
  amount: number;
  timestamp: number;
}

interface AssistCreditTextProps {
  detail?: HatsDetailSchama;
}

const AssistCreaditText: FC<AssistCreditTextProps> = ({ detail }) => {
  return (
    <Text fontSize="xs" lineHeight={1}>
      {detail?.data.name}
    </Text>
  );
};

const AssistCreditItem: FC<ItemProps> = ({
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
    <Box
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
          <HatsListItemParser imageUri={hat?.imageUri} detailUri={hat?.details}>
            <AssistCreaditText />
          </HatsListItemParser>
          <Text fontSize="lg" fontWeight="semibold" color="blue.600">
            {amount}{" "}
            <Box fontSize="xs" as="span">
              points
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
    </Box>
  );
};

/**
 * ワークスペース全体のアシストクレジット履歴を表示するコンポーネント
 */
export const AssistCreditHistory: FC<Props> = ({ treeId, limit }) => {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - 30);
    return { from, to };
  });

  const { data } = useGetTransferFractionTokens({
    where: {
      workspaceId: treeId,
    },
    orderBy: TransferFractionToken_OrderBy.BlockTimestamp,
    orderDirection: OrderDirection.Desc,
    first: limit,
    dateRange: {
      startDate: Math.floor(dateRange.from.getTime() / 1000).toString(),
      endDate: Math.floor(dateRange.to.getTime() / 1000).toString(),
    },
  });

  return (
    <VStack gap={2}>
      <DateRangePicker
        onUpdate={(values) =>
          setDateRange({
            from: values.range.from as Date,
            to: values.range.to as Date,
          })
        }
        initialDateFrom={dateRange.from}
        initialDateTo={dateRange.to}
      />
      {data?.transferFractionTokens.map((token) => (
        <AssistCreditItem
          treeId={treeId}
          key={`th_${token.id}`}
          from={token.from}
          to={token.to}
          hatId={token.hatId}
          amount={token.amount}
          timestamp={token.blockTimestamp}
        />
      ))}
    </VStack>
  );
};

/**
 * ユーザーのアシストクレジット履歴を表示するコンポーネント
 * txType が "sent" の場合は送信履歴、"received" の場合は受信履歴を表示する
 */
export const UserAssistCreditHistory: FC<UserProps> = ({ data, txType }) => {
  if (
    !data?.transferFractionTokens ||
    data.transferFractionTokens.length === 0
  ) {
    return (
      <Box p={4} textAlign="center" color="gray.500">
        {txType === "sent" ? "送信履歴はありません" : "受信履歴はありません"}
      </Box>
    );
  }

  return (
    <VStack gap={2}>
      {data.transferFractionTokens.map((token) => (
        <AssistCreditItem
          treeId={token.workspaceId || ""}
          key={`${txType}_${token.id}`}
          from={token.from}
          to={token.to}
          hatId={token.hatId}
          amount={token.amount}
          timestamp={token.blockTimestamp}
        />
      ))}
    </VStack>
  );
};
