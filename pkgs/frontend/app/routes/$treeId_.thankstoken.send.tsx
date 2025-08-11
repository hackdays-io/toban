import { Box, Grid } from "@chakra-ui/react";
import { useNavigate, useParams } from "@remix-run/react";
import { useBalanceOfFractionTokens } from "hooks/useFractionToken";
import { useGetHats } from "hooks/useHats";
import { useActiveWallet } from "hooks/useWallet";
import { type FC, useMemo } from "react";
import { PageHeader } from "~/components/PageHeader";
import { HatsListItemParser } from "~/components/common/HatsListItemParser";
import RoleWithBalance from "~/components/roles/RoleWithBalance";

// ThanksToken send entrace: choose role, then navigate to existing assistcredit/send
const ThanksTokenSendEntrance: FC = () => {
  const { treeId } = useParams();
  const navigate = useNavigate();
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
    if (!hats || !data)
      return [] as {
        id: `0x${string}`;
        balance: number;
        wearer: string | null | undefined;
      }[];
    return data.balanceOfFractionTokens
      .map(({ hatId, balance, wearer }) => {
        const hat = hats.find(({ id }) => hatId === BigInt(id).toString());
        if (hat)
          return {
            id: hat.id as `0x${string}`,
            balance: Number(balance),
            wearer,
          };
        return undefined;
      })
      .filter(
        (
          d,
        ): d is {
          id: `0x${string}`;
          balance: number;
          wearer: string | null | undefined;
        } => !!d,
      );
  }, [hats, data]);

  return (
    <Grid gridTemplateRows="auto 1fr" minH="calc(100vh - 100px)">
      <PageHeader title="サンクストークンを送信" />
      <Box my={6}>
        {hatsWithBalance.map(({ id, balance, wearer }) => (
          <Box key={`hat_${id}`} mb={4}>
            <HatsListItemParser
              imageUri={hats?.find((h) => h.id === id)?.imageUri}
              detailUri={hats?.find((h) => h.id === id)?.details}
            >
              <RoleWithBalance
                balance={balance}
                treeId={treeId}
                hatId={id as `0x${string}`}
                wearer={wearer as `0x${string}`}
                address={wallet?.account.address as `0x${string}`}
                showSendButton
              />
            </HatsListItemParser>
          </Box>
        ))}
      </Box>
    </Grid>
  );
};

export default ThanksTokenSendEntrance;
