import { Box, HStack, VStack, Text, Heading } from "@chakra-ui/react";
import { Link, useParams } from "@remix-run/react";
import { useNamesByAddresses } from "hooks/useENS";
import { useHoldersWithBalance } from "hooks/useFractionToken";
import { useTreeInfo } from "hooks/useHats";
import { FC, useMemo } from "react";
import { ipfs2https } from "utils/ipfs";
import { abbreviateAddress } from "utils/wallet";
import { HatsListItemParser } from "~/components/common/HatsListItemParser";
import { UserIcon } from "~/components/icon/UserIcon";
import {
  HolderDetail,
  RoleNameWithWearer,
} from "~/components/roles/HolderDetail";
import { StickyNav } from "~/components/StickyNav";

const RoleHolderDetails: FC = () => {
  const { treeId, hatId, address } = useParams();

  const tree = useTreeInfo(Number(treeId));

  const hat = useMemo(() => {
    if (!tree || !tree.hats) return;
    return tree.hats.find((h) => h.id === hatId);
  }, [tree, hatId]);

  // wearerの名前とアイコンを取得
  const addresses = useMemo(() => (address ? [address] : undefined), [address]);
  const { names: wearerNames } = useNamesByAddresses(addresses);
  const { wearerName, wearerIcon } = useMemo(
    () =>
      wearerNames.flat().length > 0
        ? {
            wearerName: wearerNames.flat()[0].name,
            wearerIcon: wearerNames.flat()[0].text_records?.avatar,
          }
        : {},
    [wearerNames]
  );

  // holderをbalanceとともに取得
  const holdersWithBalance = useHoldersWithBalance({ wearer: address, hatId });
  const holders = useMemo(
    () => holdersWithBalance.map(({ holder }) => holder),
    [holdersWithBalance]
  );
  const { names: holderNames } = useNamesByAddresses(holders);
  const holderDetail = useMemo(
    () =>
      holderNames.flat().map((n) => ({
        ...n,
        balance: holdersWithBalance.find(
          ({ holder }) => holder.toLowerCase() === n.address.toLowerCase()
        )?.balance,
      })),
    [holdersWithBalance, holderNames]
  );

  if (!hat) return;

  return (
    <Box>
      <HatsListItemParser imageUri={hat.imageUri} detailUri={hat.details}>
        <RoleNameWithWearer
          treeId={treeId}
          hatId={hatId}
          wearerId={address}
          wearerName={wearerName}
          wearerIcon={wearerIcon}
        />
        <HolderDetail />
      </HatsListItemParser>

      <HStack paddingTop={4} justifyContent="space-between">
        <Heading size="2xl">Assist Credit Holders</Heading>
        <Link to={`/${treeId}/${hatId}/${address}/assistcredit/send`}>
          <Box
            marginRight={4}
            paddingX={2}
            paddingY={1}
            rounded="md"
            bgColor="yellow.400"
          >
            Send
          </Box>
        </Link>
      </HStack>

      <VStack width="full" alignItems="start" gap={3} paddingY={4}>
        {holderDetail.map((h, idx) => (
          <HStack key={idx} width="full">
            <UserIcon
              userImageUrl={ipfs2https(h.text_records?.avatar)}
              size={10}
            />
            <Text lineBreak="anywhere" flexGrow={1}>
              {h.name
                ? `${h.name} (${abbreviateAddress(h.address)})`
                : abbreviateAddress(h.address)}
            </Text>
            {h.balance !== undefined && (
              <Text>{Number(h.balance).toLocaleString()}</Text>
            )}
          </HStack>
        ))}
      </VStack>

      <StickyNav />
    </Box>
  );
};

export default RoleHolderDetails;
