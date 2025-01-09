import { Box, HStack, VStack, Text, Heading } from "@chakra-ui/react";
import { Link, useParams } from "@remix-run/react";
import { useNamesByAddresses } from "hooks/useENS";
import { useHoldersWithBalance } from "hooks/useFractionToken";
import { useTreeInfo } from "hooks/useHats";
import {
  useActiveState,
  useDeactivate,
  useReactivate,
} from "hooks/useHatsTimeFrameModule";
import { useActiveWallet } from "hooks/useWallet";
import { useGetWorkspace } from "hooks/useWorkspace";
import { FC, useMemo, useState } from "react";
import { ipfs2https } from "utils/ipfs";
import { abbreviateAddress } from "utils/wallet";
import { BasicButton } from "~/components/BasicButton";
import { HatsListItemParser } from "~/components/common/HatsListItemParser";
import { UserIcon } from "~/components/icon/UserIcon";
import {
  ActiveState,
  HatDetail,
  RoleNameWithWearer,
} from "~/components/roles/HolderDetail";
import { StickyNav } from "~/components/StickyNav";

const RoleHolderDetails: FC = () => {
  const { treeId, hatId, address } = useParams();

  const { wallet } = useActiveWallet();
  const me = wallet?.account?.address;

  const tree = useTreeInfo(Number(treeId));

  const hat = useMemo(() => {
    if (!tree || !tree.hats) return;
    return tree.hats.find((h) => h.id === hatId);
  }, [tree, hatId]);

  // ログインユーザーがこのhatの上位のhatのholderであるか
  const isAuthorised = useMemo(() => {
    if (!me || !hat?.levelAtLocalTree) return false;

    if (hat.wearers?.some((w) => w.id.toLowerCase() === me.toLowerCase()))
      return true;

    for (let i = 0; i < hat.levelAtLocalTree; i++) {
      const parentHatId = hat.id.slice(0, 10 + 4 * i) + "0".repeat(56 - 4 * i);

      if (
        tree?.hats
          ?.find((h) => h.id === parentHatId)
          ?.wearers?.some((w) => w.id.toLowerCase() === me.toLowerCase())
      )
        return true;
    }

    return false;
  }, [me, tree, hat]);

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

  // HatsTimeFrameModuleのアドレスを取得
  const { data } = useGetWorkspace(treeId);
  const hatsTimeFrameModuleAddress = useMemo(
    () => data?.workspace?.hatsTimeFrameModule,
    [data]
  );

  const [count, setCount] = useState(0);
  const { isActive, woreTime, wearingElapsedTime } = useActiveState(
    hatsTimeFrameModuleAddress,
    hatId,
    address,
    count
  );

  const { reactivate, isLoading: isReactivating } = useReactivate(
    hatsTimeFrameModuleAddress
  );
  const { deactivate, isLoading: isDeactivating } = useDeactivate(
    hatsTimeFrameModuleAddress
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
        <ActiveState
          isActive={isActive}
          woreTime={woreTime}
          wearingElapsedTime={wearingElapsedTime}
        />
        <HatDetail />
      </HatsListItemParser>

      <HStack paddingTop={8} justifyContent="space-between">
        <Heading size="2xl">Assist Credit Holders</Heading>
        <Link to={`/${treeId}/${hatId}/${address}/assistcredit/send`}>
          <Box
            marginRight={4}
            paddingX={3}
            paddingY={1}
            rounded="md"
            bgColor="yellow.400"
          >
            Send
          </Box>
        </Link>
      </HStack>

      <VStack width="full" alignItems="start" gap={3} paddingY={4}>
        {holderDetail.length === 0 ? (
          <Text fontStyle="italic" color="gray.400">
            No holders
          </Text>
        ) : (
          holderDetail.map((h, idx) => (
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
          ))
        )}
      </VStack>

      {/* hatについて権限があるかどうかで表示の有無が変わるボタン */}
      {isAuthorised && (
        <>
          {isActive ? (
            <BasicButton
              marginTop={8}
              bgColor="red.400"
              onClick={async () => {
                await deactivate(hatId, address);
                setCount(count + 1);
              }}
              disabled={isDeactivating}
            >
              {isDeactivating ? "Deactivating..." : "Deactivate"}
            </BasicButton>
          ) : (
            <BasicButton
              marginTop={8}
              bgColor="blue.400"
              onClick={async () => {
                await reactivate(hatId, address);
                setCount(count + 1);
              }}
              disabled={isReactivating}
            >
              {isReactivating ? "Reactivating..." : "Reactivate"}
            </BasicButton>
          )}
          <BasicButton marginY={4} bgColor="red.600" onClick={() => {}}>
            Revoke
          </BasicButton>
        </>
      )}

      <StickyNav />
    </Box>
  );
};

export default RoleHolderDetails;
