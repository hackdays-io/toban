import { Box, Flex, Text } from "@chakra-ui/react";
import { useNamesByAddresses } from "hooks/useENS";
import { FC, useMemo } from "react";
import { UserIcon } from "../icon/UserIcon";
import { ipfs2https } from "utils/ipfs";
import { abbreviateAddress } from "utils/wallet";

interface SplitRecipientsListProps {
  recipients: { address: string; percentAllocation: number }[];
}

export const SplitRecipientsList: FC<SplitRecipientsListProps> = ({
  recipients,
}) => {
  const addresses = useMemo(() => {
    return recipients.map((r) => r.address);
  }, [recipients]);
  const { names } = useNamesByAddresses(addresses);

  const totalAllocation = useMemo(() => {
    return recipients.reduce((acc, r) => acc + r.percentAllocation, 0);
  }, [recipients]);

  return (
    <>
      {recipients.map((recipient) => {
        const name = names.find(
          (name) => name[0]?.address === recipient.address
        )?.[0];
        return (
          <Flex key={recipient.address} my={2} alignItems="center" gap={2}>
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
              (Number(recipient.percentAllocation) / totalAllocation) *
              100
            ).toFixed(2)}{" "}
            %
          </Flex>
        );
      })}
    </>
  );
};
