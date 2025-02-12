import { Box, Flex, Grid, Text, VStack } from "@chakra-ui/react";
import { OrderDirection, TransferFractionToken_OrderBy } from "gql/graphql";
import { useNamesByAddresses } from "hooks/useENS";
import { useGetTransferFractionTokens } from "hooks/useFractionToken";
import { useGetHat } from "hooks/useHats";
import { type FC, useMemo } from "react";
import type { HatsDetailSchama } from "types/hats";
import { ipfs2https } from "utils/ipfs";
import { abbreviateAddress } from "utils/wallet";
import { HatsListItemParser } from "../common/HatsListItemParser";
import { UserIcon } from "../icon/UserIcon";

interface Props {
  treeId: string;
  limit?: number;
}

interface ItemProps {
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

const AssistCreditItem: FC<ItemProps> = ({ from, to, amount, hatId }) => {
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
        <Flex alignItems="center" gap={2}>
          <UserIcon
            size="25px"
            userImageUrl={ipfs2https(fromUser?.text_records?.avatar)}
          />
          <Text fontSize="sm" fontWeight="medium" color="gray.700">
            {fromUser?.name || abbreviateAddress(from)}
          </Text>
        </Flex>

        <Box textAlign="left">
          <HatsListItemParser imageUri={hat?.imageUri} detailUri={hat?.details}>
            <AssistCreaditText />
          </HatsListItemParser>
          <Text fontSize="lg" fontWeight="semibold" color="blue.600">
            {amount}{" "}
            <Box fontSize="xs" as="span">
              tokens
            </Box>
          </Text>
        </Box>

        <Flex justifyContent="flex-end" alignItems="center" gap={2}>
          <Text fontSize="sm" fontWeight="medium" color="gray.700">
            {toUser?.name || abbreviateAddress(to)}
          </Text>
          <UserIcon
            size="25px"
            userImageUrl={ipfs2https(toUser?.text_records?.avatar)}
          />
        </Flex>
      </Grid>
    </Box>
  );
};

export const AssistCreditHistory: FC<Props> = ({ treeId, limit }) => {
  const { data } = useGetTransferFractionTokens({
    where: {
      workspaceId: treeId,
    },
    orderBy: TransferFractionToken_OrderBy.BlockTimestamp,
    orderDirection: OrderDirection.Desc,
    first: limit,
  });

  return (
    <VStack gap={2}>
      {data?.transferFractionTokens.map((token) => (
        <AssistCreditItem
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
