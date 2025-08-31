import {
  AspectRatio,
  Box,
  Heading,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Link, useNavigate, useParams } from "@remix-run/react";
import { useGetBalanceOfFractionTokens } from "hooks/useFractionToken";
import { useGetHats, useTreeInfo } from "hooks/useHats";
import { useActiveWallet } from "hooks/useWallet";
import { type FC, useMemo } from "react";
import { FaPlus } from "react-icons/fa6";
import type { Address } from "viem";
import { StickyNav } from "~/components/StickyNav";
import CommonButton from "~/components/common/CommonButton";
import { HatsListItemParser } from "~/components/common/HatsListItemParser";
import { MyRole } from "~/components/roles/MyRole";
import RoleWithBalance from "~/components/roles/RoleWithBalance";
import { VRole } from "~/components/roles/VRole";

const WorkspaceWithBalance: FC = () => {
  const navigate = useNavigate();

  const { treeId } = useParams();
  const tree = useTreeInfo(Number(treeId));

  const { wallet } = useActiveWallet();
  const me = wallet?.account?.address;

  const { data } = useGetBalanceOfFractionTokens({
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

  // 0002は管理系のハットなのでここでは除外
  const tobanList = useMemo(() => {
    return tree?.hats?.filter(
      (h) =>
        Number(h.levelAtLocalTree) >= 2 &&
        h.prettyId?.startsWith(`${tree?.id}.0001`),
    );
  }, [tree]);

  return (
    <Box>
      {/* All roles */}
      <Box pt={5}>
        <Heading pb={4}>当番一覧</Heading>
        <SimpleGrid columns={4} gap={4}>
          {tobanList?.map((h) => (
            <Link key={`allrole${h.id}`} to={`/${treeId}/${h.id}`}>
              <HatsListItemParser imageUri={h.imageUri} detailUri={h.details}>
                <VRole iconSize="80px" />
              </HatsListItemParser>
            </Link>
          ))}
          <VStack>
            <AspectRatio width="80px" ratio={1}>
              <CommonButton
                rounded="xl"
                onClick={() => navigate(`/${treeId}/roles/new`)}
                bgColor="gray.300"
              >
                <FaPlus />
              </CommonButton>
            </AspectRatio>
            <Text>Add role</Text>
          </VStack>
        </SimpleGrid>
      </Box>

      {/* My roles */}
      <Box pt={10}>
        <Heading pb={4}>担当当番</Heading>
        <VStack gap={3} align="stretch">
          {tree?.hats
            ?.filter((h) => Number(h.levelAtLocalTree) >= 2)
            .filter((h) => h.wearers?.some((w) => w.id === me?.toLowerCase()))
            .map((h) => (
              <HatsListItemParser
                key={h.id}
                imageUri={h.imageUri}
                detailUri={h.details}
              >
                <MyRole address={me} treeId={treeId} hatId={h.id} />
              </HatsListItemParser>
            ))}
        </VStack>
      </Box>

      {/* Role Share */}
      <Box pt={14}>
        <Heading pb={4}>
          {["144", "175", "780"].includes(treeId || "")
            ? "ケアポイント"
            : "アシストクレジット"}
          の残高
        </Heading>
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
      </Box>
      <StickyNav />
    </Box>
  );
};

export default WorkspaceWithBalance;
