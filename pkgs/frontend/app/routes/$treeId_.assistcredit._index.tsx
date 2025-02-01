import { Box, Heading, VStack } from "@chakra-ui/react";
import { useParams } from "@remix-run/react";
import { useBalancesWithHat } from "hooks/useFractionToken";
import { useGetHats } from "hooks/useHats";
import { useActiveWallet } from "hooks/useWallet";
import { type FC, useMemo } from "react";
import { StickyNav } from "~/components/StickyNav";
import { HatsListItemParser } from "~/components/common/HatsListItemParser";
import RoleWithBalance from "~/components/roles/RoleWithBalance";

const WorkspaceWithBalance: FC = () => {
  const { treeId } = useParams();

  const { wallet } = useActiveWallet();
  const me = wallet?.account?.address;

  const tokens = useBalancesWithHat(treeId, me);

  const hatIds = useMemo(
    () => tokens.map(({ hatId }) => hatId.toString()),
    [tokens],
  );

  const { hats } = useGetHats(hatIds);

  const hatsWithBalance = useMemo(() => {
    if (!hats) return [];
    return hats.map((hat, index) => ({
      hat,
      ...tokens[index],
    }));
  }, [tokens, hats]);

  return (
    <Box>
      <Heading pb={5}>アシストクレジットの残高</Heading>
      <VStack width="full" marginY={5} gapY={5}>
        {hatsWithBalance.map(({ hat, balance, isHolder }) => (
          <HatsListItemParser
            key={hat.id}
            imageUri={hat.imageUri}
            detailUri={hat.details}
          >
            <RoleWithBalance
              balance={Number(balance)}
              isHolder={isHolder}
              treeId={treeId}
              hatId={hat.id}
              address={me}
            />
          </HatsListItemParser>
        ))}
      </VStack>
      <StickyNav />
    </Box>
  );
};

export default WorkspaceWithBalance;
