import { Box, Heading, VStack } from "@chakra-ui/react";
import {
  useBalanceOfFractionTokens,
  useBalancesWithHat,
} from "hooks/useFractionToken";
import { useGetHats } from "hooks/useHats";
import { useActiveWallet } from "hooks/useWallet";
import { type FC, useMemo } from "react";
import { useParams } from "react-router";
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
  });

  const hatIds = useMemo(
    () => data?.balanceOfFractionTokens.map(({ hatId }) => hatId.toString()),
    [data],
  );

  const { hats } = useGetHats(hatIds || []);

  const hatsWithBalance = useMemo(() => {
    if (!hats) return [];
    return hats.map((hat, index) => ({
      hat,
      ...data?.balanceOfFractionTokens[index],
    }));
  }, [data, hats]);

  return (
    <Box>
      <Heading pb={5}>アシストクレジットの残高</Heading>
      <VStack width="full" gapY={5}>
        {wallet &&
          hatsWithBalance.map(({ hat, balance, wearer }) => (
            <HatsListItemParser
              key={`${hat.id}${wearer}`}
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
