import { Box, HStack, Heading, Text, VStack } from "@chakra-ui/react";
import { Link, useNavigate, useParams } from "@remix-run/react";
import { useNamesByAddresses } from "hooks/useENS";
import { useBalanceOfFractionTokens } from "hooks/useFractionToken";
import { useTreeInfo } from "hooks/useHats";
import { useWearingElapsedTime } from "hooks/useHatsTimeFrameModule";
import { useActiveWallet } from "hooks/useWallet";
import { useGetWorkspace } from "hooks/useWorkspace";
import { type FC, useMemo } from "react";
import { ipfs2https } from "utils/ipfs";
import { abbreviateAddress } from "utils/wallet";
import type { Address } from "viem";
import { BasicButton } from "~/components/BasicButton";
import { StickyNav } from "~/components/StickyNav";
import { HatsListItemParser } from "~/components/common/HatsListItemParser";
import { UserIcon } from "~/components/icon/UserIcon";
import { HatDetail, RoleName } from "~/components/roles/HolderDetail";

const RoleDetails: FC = () => {
  const { treeId, hatId } = useParams();

  const { wallet } = useActiveWallet();
  const me = wallet?.account?.address;

  const tree = useTreeInfo(Number(treeId));

  const hat = useMemo(() => {
    if (!tree || !tree.hats) return;
    return tree.hats.find((h) => h.id === hatId);
  }, [tree, hatId]);

  const wearers = useMemo(() => hat?.wearers, [hat]);
  const wearerIds = useMemo(
    () => wearers?.map(({ id }) => id.toLowerCase()) || [],
    [wearers],
  );

  // wearer
  const { names: wearerNames } = useNamesByAddresses(wearerIds);

  const { data: balanceOfFractionTokens } = useBalanceOfFractionTokens({
    where: {
      hatId: BigInt(hatId || 0).toString(10),
    },
  });
  const assistantMembers = useMemo(() => {
    return Array.from(
      new Set(
        balanceOfFractionTokens?.balanceOfFractionTokens
          .filter((h) => !wearerIds.includes(h.owner.toLowerCase()))
          .map((h) => h.owner.toLowerCase()),
      ),
    );
  }, [balanceOfFractionTokens, wearerIds]);
  const { names: holderNames } = useNamesByAddresses(assistantMembers);

  // 各wearerのWearingElapsedTimeを取得
  const { data } = useGetWorkspace(treeId);
  const hatsTimeFrameModuleAddress = useMemo(
    () => data?.workspace?.hatsTimeFrameModule?.id,
    [data],
  );
  const timeList = useWearingElapsedTime(
    hatsTimeFrameModuleAddress as Address,
    hatId,
    wearerIds,
  );

  const isAuthorized = useMemo(() => {
    if (!me) return false;

    const topHat = tree?.hats?.find((h) => h.levelAtLocalTree === 0);

    return (
      wearerIds.includes(me.toLowerCase()) ||
      topHat?.wearers?.some((w) => w.id.toLowerCase() === me.toLowerCase())
    );
  }, [me, wearerIds, tree]);

  const navigate = useNavigate();

  if (!hat) return;

  return (
    <Box>
      <HatsListItemParser imageUri={hat.imageUri} detailUri={hat.details}>
        <RoleName treeId={treeId} />

        {isAuthorized && (
          <Link to={`/${treeId}/${hatId}/edit`}>
            <BasicButton
              fontWeight="bold"
              minH={2}
              size="xs"
              bgColor="blue.300"
              w="auto"
            >
              編集
            </BasicButton>
          </Link>
        )}
        <HatDetail />
      </HatsListItemParser>

      <HStack justifyContent="space-between">
        <Heading size="lg">貢献メンバー</Heading>

        <Link to={`/${treeId}/${hatId}/assign`}>
          <BasicButton
            fontWeight="bold"
            minH={5}
            size="xs"
            bgColor="yellow.400"
          >
            当番をわたす
          </BasicButton>
        </Link>
      </HStack>

      <VStack width="full" alignItems="start" gap={3} paddingY={4}>
        {wearerNames.flat().map((n) => (
          <HStack
            key={`${n.name}w`}
            width="full"
            onClick={() => navigate(`/${treeId}/${hatId}/${n.address}`)}
          >
            <UserIcon
              userImageUrl={ipfs2https(n.text_records?.avatar)}
              size={10}
            />
            <VStack flexGrow={1} alignItems="start" gapY={1}>
              <Text lineBreak="anywhere" flexGrow={1}>
                {n.name
                  ? `${n.name} (${abbreviateAddress(n.address)})`
                  : abbreviateAddress(n.address)}
              </Text>
              <Text fontWeight="medium">
                {Math.floor(
                  (timeList.find(
                    ({ wearer }) =>
                      wearer.toLowerCase() === n.address.toLowerCase(),
                  )?.time || 0) / 86400,
                )}{" "}
                days
              </Text>
            </VStack>
            <Box
              fontSize="xs"
              paddingX={2}
              paddingY={1}
              rounded="md"
              bgColor="yellow.200"
            >
              当番リード
            </Box>
          </HStack>
        ))}

        {holderNames.flat().map((n) => (
          <HStack key={`${n.name}h`} width="full">
            <UserIcon
              userImageUrl={ipfs2https(n.text_records?.avatar)}
              size={10}
            />
            <Text lineBreak="anywhere" flexGrow={1}>
              {n.name
                ? `${n.name} (${abbreviateAddress(n.address)})`
                : abbreviateAddress(n.address)}
            </Text>
            <Box
              fontSize="xs"
              paddingX={2}
              paddingY={1}
              rounded="md"
              bgColor="blue.200"
            >
              サポーター
            </Box>
          </HStack>
        ))}
      </VStack>

      <StickyNav />
    </Box>
  );
};

export default RoleDetails;
