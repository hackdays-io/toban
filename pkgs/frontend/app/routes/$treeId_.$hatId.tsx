import { Box, HStack, Heading, Text, VStack } from "@chakra-ui/react";
import { Link, useNavigate, useParams } from "@remix-run/react";
import { useNamesByAddresses } from "hooks/useENS";
import { useBalanceOfFractionTokens } from "hooks/useFractionToken";
import { useTreeInfo } from "hooks/useHats";
import { useWearingElapsedTime } from "hooks/useHatsTimeFrameModule";
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
    return balanceOfFractionTokens?.balanceOfFractionTokens
      .filter((h) => !wearerIds.includes(h.owner.toLowerCase()))
      .map((h) => h.owner.toLowerCase());
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

  const navigate = useNavigate();

  if (!hat) return;

  return (
    <Box>
      <HatsListItemParser imageUri={hat.imageUri} detailUri={hat.details}>
        <RoleName treeId={treeId} />
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
            役割をわたす
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
              役割保持者
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
              アシスト
            </Box>
          </HStack>
        ))}
      </VStack>

      <StickyNav />
    </Box>
  );
};

export default RoleDetails;
