import { Box, Flex, Text } from "@chakra-ui/react";
import { useNamesByAddresses } from "hooks/useENS";
import { type FC, useMemo } from "react";
import { ipfs2https } from "utils/ipfs";
import { abbreviateAddress } from "utils/wallet";
import { UserIcon } from "../icon/UserIcon";

interface SplitRecipientsListProps {
  recipients: {
    list: { address: string; ownership: number }[];
    totalOwnership: number;
  };
}

export const SplitRecipientsList: FC<SplitRecipientsListProps> = ({
  recipients,
}) => {
  const addresses = useMemo(() => {
    return recipients.list?.map((r) => r.address);
  }, [recipients]);
  const { names } = useNamesByAddresses(addresses);

  return (
    <Box>
      {recipients.list?.map((recipient) => {
        const name = names.find(
          (name) => name[0]?.address === recipient.address,
        )?.[0];
        return (
          <Flex key={recipient.address} mb={3} alignItems="center" gap={2}>
            <UserIcon
              size="40px"
              userImageUrl={ipfs2https(name?.text_records?.avatar)}
            />
            <Box flexGrow={1}>
              <Text textStyle="sm">{name?.name}</Text>
              <Text textStyle="sm">
                {abbreviateAddress(name?.address || "")}
              </Text>
            </Box>
            {(
              (Number(recipient.ownership) / recipients.totalOwnership) *
              100
            ).toFixed(2)}{" "}
            %
          </Flex>
        );
      })}
    </Box>
  );
};
