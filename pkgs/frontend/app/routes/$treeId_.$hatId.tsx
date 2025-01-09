import { Box, Heading, HStack, Text, VStack } from "@chakra-ui/react";
import { useNavigate, useParams } from "@remix-run/react";
import { useNamesByAddresses } from "hooks/useENS";
import { useHoldersWithoutWearers } from "hooks/useFractionToken";
import { useTreeInfo } from "hooks/useHats";
import { useWearingElapsedTime } from "hooks/useHatsTimeFrameModule";
import { useGetWorkspace } from "hooks/useWorkspace";
import { FC, useMemo } from "react";
import { ipfs2https } from "utils/ipfs";
import { abbreviateAddress } from "utils/wallet";
import { BasicButton } from "~/components/BasicButton";
import { HatsListItemParser } from "~/components/common/HatsListItemParser";
import { UserIcon } from "~/components/icon/UserIcon";
import { HatDetail, RoleName } from "~/components/roles/HolderDetail";
import { StickyNav } from "~/components/StickyNav";

const RoleDetails: FC = () => {
  const { treeId, hatId } = useParams();

  const tree = useTreeInfo(Number(treeId));

  const hat = useMemo(() => {
    if (!tree || !tree.hats) return;
    return tree.hats.find((h) => h.id === hatId);
  }, [tree, hatId]);

  const wearers = useMemo(() => hat?.wearers, [hat]);
  const wearerIds = useMemo(
    () => wearers?.map(({ id }) => id) || [],
    [wearers]
  );

  // wearer
  const { names: wearerNames } = useNamesByAddresses(wearerIds);

  // wearerを除くholder
  const holdersWithoutWearers = useHoldersWithoutWearers({
    hatId,
    wearers: wearerIds,
  });
  const { names: holderNames } = useNamesByAddresses(holdersWithoutWearers);

  // 各wearerのWearingElapsedTimeを取得
  const { data } = useGetWorkspace(treeId);
  const hatsTimeFrameModuleAddress = useMemo(
    () => data?.workspace?.hatsTimeFrameModule,
    [data]
  );
  const timeList = useWearingElapsedTime(
    hatsTimeFrameModuleAddress,
    hatId,
    wearerIds
  );

  const navigate = useNavigate();

  if (!hat) return;

  return (
    <Box>
      <HatsListItemParser imageUri={hat.imageUri} detailUri={hat.details}>
        <RoleName treeId={treeId} />
        <HatDetail />
      </HatsListItemParser>

      <Heading>Members</Heading>
      <VStack width="full" alignItems="start" gap={3} paddingY={4}>
        {wearerNames.flat().map((n, idx) => (
          <HStack
            key={idx + "w"}
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
                      wearer.toLowerCase() === n.address.toLowerCase()
                  )?.time || 0) / 86400
                )}
                days
              </Text>
            </VStack>
            <Box paddingX={2} paddingY={1} rounded="md" bgColor="yellow.400">
              Role Holder
            </Box>
          </HStack>
        ))}
        {holderNames.flat().map((n, idx) => (
          <HStack key={idx + "h"} width="full">
            <UserIcon
              userImageUrl={ipfs2https(n.text_records?.avatar)}
              size={10}
            />
            <Text lineBreak="anywhere" flexGrow={1}>
              {n.name
                ? `${n.name} (${abbreviateAddress(n.address)})`
                : abbreviateAddress(n.address)}
            </Text>
            <Box paddingX={2} paddingY={1} rounded="md" bgColor="blue.400">
              Assist
            </Box>
          </HStack>
        ))}
      </VStack>

      <BasicButton
        marginY={4}
        onClick={() => navigate(`/${treeId}/${hatId}/assign`)}
      >
        Assign Member
      </BasicButton>

      <StickyNav />
    </Box>
  );
};

export default RoleDetails;
