import { Box, Heading, List, Text } from "@chakra-ui/react";
import { useParams } from "@remix-run/react";
import { useGetTransferFractionTokens } from "hooks/useFractionToken";
import type { FC } from "react";
import { abbreviateAddress } from "utils/wallet";
import { StickyNav } from "~/components/StickyNav";

const WorkspaceMember: FC = () => {
  const { treeId } = useParams();

  const { data } = useGetTransferFractionTokens({
    where: {
      workspaceId: treeId,
    },
  });

  return (
    <>
      {/* Members */}
      <Box mb={4}>
        <Heading pb={4}>Transaction History</Heading>
        <List.Root>
          {data?.transferFractionTokens.map((token) => (
            <List.Item>
              <Text>
                {abbreviateAddress(token.from)} → {abbreviateAddress(token.to)}{" "}
                : {token.amount}
              </Text>
            </List.Item>
          ))}
        </List.Root>
      </Box>
      <StickyNav />
    </>
  );
};

export default WorkspaceMember;
