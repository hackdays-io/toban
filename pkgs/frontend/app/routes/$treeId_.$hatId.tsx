import { Box, HStack, Heading, Text, VStack } from "@chakra-ui/react";
import { hatIdHexToDecimal, treeIdToTopHatId } from "@hatsprotocol/sdk-v1-core";
import { Link, useNavigate, useParams } from "@remix-run/react";
import { useNamesByAddresses } from "hooks/useENS";
import { useGetBalanceOfFractionTokens } from "hooks/useFractionToken";
import { useGetHatById } from "hooks/useHats";
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

  const { hat } = useGetHatById(hatId || "");

  const wearerIds = useMemo(
    () => (hat ? hat.wearers.map((w) => w.id) : []),
    [hat],
  );

  // wearer
  const { names: wearerNames } = useNamesByAddresses(wearerIds);

  const { data: balanceOfFractionTokensData } = useGetBalanceOfFractionTokens({
    where: {
      hatId: String(hatIdHexToDecimal(hatId || "")),
    },
  });
  const assistantMembers = useMemo(
    () =>
      balanceOfFractionTokensData
        ? balanceOfFractionTokensData.balanceOfFractionTokens
            .filter((h) => !wearerIds.includes(h.owner))
            .map((h) => h.owner)
        : [],
    [balanceOfFractionTokensData, wearerIds],
  );
  const { names: holderNames } = useNamesByAddresses(assistantMembers);

  // 各wearerのWearingElapsedTimeを取得
  const { data } = useGetWorkspace({ workspaceId: treeId || "" });
  const hatsTimeFrameModuleAddress = useMemo(
    () => data?.workspace?.hatsTimeFrameModule,
    [data],
  );
  const timeList = useWearingElapsedTime(
    hatsTimeFrameModuleAddress as Address,
    hatId,
    wearerIds,
  );

  const { hat: topHat } = useGetHatById(
    String(treeIdToTopHatId(Number(treeId))),
  );
  const isAuthorized = useMemo(
    () => topHat?.wearers?.some((w) => w.id === me?.toLowerCase()),
    [me, topHat],
  );

  const navigate = useNavigate();

  return hat ? (
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
  ) : (
    <Box minHeight="50vh" alignContent="center" justifyItems="center">
      <Text width="fit" fontSize="lg" fontWeight="bold" color="gray.400">
        ロールが見つかりませんでした
      </Text>
    </Box>
  );
};

export default RoleDetails;
