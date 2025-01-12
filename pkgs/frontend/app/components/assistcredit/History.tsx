import { Box, HStack, Text, VStack } from "@chakra-ui/react";
import { TransferFractionToken_OrderBy } from "gql/graphql";
import { useNamesByAddresses } from "hooks/useENS";
import { useGetTransferFractionTokens } from "hooks/useFractionToken";
import { useGetHat } from "hooks/useHats";
import { type FC, useMemo } from "react";
import { FaChevronRight } from "react-icons/fa6";
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
  amount: number;
  detail?: HatsDetailSchama;
}

const AssistCreaditText: FC<AssistCreditTextProps> = ({ detail, amount }) => {
  return (
    <Text as="span">
      {detail?.data.name}のアシストクレジットを
      <Box as="span" fontWeight="bold">
        {amount}
      </Box>
      送りました！
    </Text>
  );
};

const AssistCreditItem: FC<ItemProps> = ({
  from,
  to,
  hatId,
  amount,
  timestamp,
}) => {
  const addresses = useMemo(() => {
    return [from, to];
  }, [from, to]);

  const { names } = useNamesByAddresses(addresses);

  const { hat } = useGetHat(hatId);

  const fromUser = useMemo(() => {
    return names?.[0]?.[0];
  }, [names]);

  const toUser = useMemo(() => {
    return names?.[1]?.[0];
  }, [names]);

  return (
    <HStack flexWrap="wrap" rowGap={0}>
      <HatsListItemParser imageUri={hat?.imageUri} detailUri={hat?.details}>
        <>
          <UserIcon
            size="25px"
            userImageUrl={ipfs2https(fromUser?.text_records?.avatar)}
          />
          <Text as="span">{fromUser?.name || abbreviateAddress(from)} が</Text>
          <UserIcon
            size="25px"
            userImageUrl={ipfs2https(toUser?.text_records?.avatar)}
          />
          <Text as="span">{toUser?.name || abbreviateAddress(to)} に</Text>
        </>
        <AssistCreaditText amount={amount} />
      </HatsListItemParser>
    </HStack>
  );
};

export const AssistCreditHistory: FC<Props> = ({ treeId, limit }) => {
  const { data } = useGetTransferFractionTokens({
    where: {
      workspaceId: treeId,
    },
    orderBy: TransferFractionToken_OrderBy.BlockTimestamp,
    first: limit,
  });

  return (
    <VStack rowGap={3}>
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
