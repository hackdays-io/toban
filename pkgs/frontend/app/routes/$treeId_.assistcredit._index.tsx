import { Box, Heading, VStack } from "@chakra-ui/react";
import { useParams } from "@remix-run/react";
import { useBalanceOfFractionTokens } from "hooks/useFractionToken";
import { useGetHats } from "hooks/useHats";
import { useActiveWallet } from "hooks/useWallet";
import { type FC, useMemo } from "react";
import type { Address } from "viem";
import { StickyNav } from "~/components/StickyNav";
import { HatsListItemParser } from "~/components/common/HatsListItemParser";
import RoleWithBalance from "~/components/roles/RoleWithBalance";

const WorkspaceWithBalance: FC = () => {
  const { treeId } = useParams();

  const { wallet } = useActiveWallet();

  const { data } = useBalanceOfFractionTokens({
    where: {
      workspaceId: treeId,
      owner: wallet?.account.address.toLowerCase(),
    },
    first: 100,
  });

  const hatIds = useMemo(() => {
    return Array.from(
      new Set(data?.balanceOfFractionTokens.map(({ hatId }) => hatId)),
    );
  }, [data]);

  const { hats } = useGetHats(hatIds || []);

  const hatsWithBalance = useMemo(() => {
    if (!hats || !data) return [];
    return data.balanceOfFractionTokens
      .map(({ hatId, balance, wearer }) => {
        const hat = hats.find(({ id }) => hatId === BigInt(id).toString());
        if (hat) return { hat, balance, wearer };
      })
      .filter((data) => !!data);
  }, [hats, data]);

  return (
    <Box>
      <Heading pb={5}>アシストクレジットの残高</Heading>
      <VStack width="full" gapY={5}>
        {wallet &&
          hatsWithBalance.map(({ hat, balance, wearer }) => (
            <HatsListItemParser
              key={hat.id}
              imageUri={hat.imageUri}
              detailUri={hat.details}
            >
              <RoleWithBalance
                balance={Number(balance)}
                treeId={treeId}
                hatId={hat.id}
                wearer={wearer as Address}
                address={wallet?.account.address}
                showSendButton
              />
            </HatsListItemParser>
          ))}
      </VStack>
      <StickyNav />
    </Box>
  );
};

export default WorkspaceWithBalance;
