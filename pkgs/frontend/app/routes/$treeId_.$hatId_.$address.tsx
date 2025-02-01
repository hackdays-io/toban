import { Box, HStack, Heading, Spinner, Text, VStack } from "@chakra-ui/react";
import { Link, useNavigate, useParams } from "@remix-run/react";
import { useNamesByAddresses } from "hooks/useENS";
import { useBalanceOfFractionTokens } from "hooks/useFractionToken";
import { useHats, useTreeInfo } from "hooks/useHats";
import {
  useActiveState,
  useDeactivate,
  useReactivate,
  useRenounceHatFromTimeFrameModule,
} from "hooks/useHatsTimeFrameModule";
import { useActiveWallet } from "hooks/useWallet";
import { useGetWorkspace } from "hooks/useWorkspace";
import { type FC, useMemo, useState } from "react";
import { ipfs2https } from "utils/ipfs";
import { abbreviateAddress } from "utils/wallet";
import type { Address } from "viem";
import { BasicButton } from "~/components/BasicButton";
import { StickyNav } from "~/components/StickyNav";
import { HatsListItemParser } from "~/components/common/HatsListItemParser";
import { UserIcon } from "~/components/icon/UserIcon";
import {
  ActiveState,
  HatDetail,
  RoleNameWithWearer,
} from "~/components/roles/HolderDetail";

const RoleHolderDetails: FC = () => {
  const { treeId, hatId, address } = useParams();

  const { wallet } = useActiveWallet();
  const me = wallet?.account?.address;

  const tree = useTreeInfo(Number(treeId));

  const hat = useMemo(() => {
    if (!tree || !tree.hats) return;
    return tree.hats.find((h) => h.id === hatId);
  }, [tree, hatId]);

  // HatsTimeFrameModuleのアドレスを取得
  const { data } = useGetWorkspace(treeId);
  const hatsTimeFrameModuleAuthorities = useMemo(() => {
    return data?.workspace?.hatsTimeFrameModule?.authorities?.filter(
      (a) => a.authorised === true,
    );
  }, [data]);
  const hatsTimeFrameModuleAddress = useMemo(
    () => data?.workspace?.hatsTimeFrameModule?.id,
    [data],
  );

  // ログインユーザーがこのhatの権限を持っているかどうか
  const isAuthorised = useMemo(() => {
    if (!me) return false;

    return hatsTimeFrameModuleAuthorities?.some(
      (a) => a.address.toLowerCase() === me.toLowerCase(),
    );
  }, [me, hatsTimeFrameModuleAuthorities]);

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
    [wearerNames],
  );

  // holderをbalanceとともに取得
  const { data: balanceOfFractionTokens } = useBalanceOfFractionTokens({
    where: {
      wearer: address?.toLowerCase(),
      hatId: BigInt(hatId || 0).toString(10),
    },
  });
  const holders = useMemo(
    () => balanceOfFractionTokens?.balanceOfFractionTokens.map((d) => d.owner),
    [balanceOfFractionTokens],
  );
  const { names: holderNames } = useNamesByAddresses(holders);
  const holderDetail = useMemo(
    () =>
      holderNames.flat().map((n) => ({
        ...n,
        balance: balanceOfFractionTokens?.balanceOfFractionTokens.find(
          ({ owner }) => owner.toLowerCase() === n.address.toLowerCase(),
        )?.balance,
      })),
    [balanceOfFractionTokens, holderNames],
  );

  // HatsTimeFrameModule関連の情報をボタンクリックの後再取得できるようにカウンターを設置
  const [count, setCount] = useState(0);
  const { isActive, woreTime, wearingElapsedTime } = useActiveState(
    hatsTimeFrameModuleAddress,
    hatId,
    address,
    count,
  );

  // reactivate, deactivate, renounce
  const { reactivate, isLoading: isReactivating } = useReactivate(
    hatsTimeFrameModuleAddress,
  );
  const { deactivate, isLoading: isDeactivating } = useDeactivate(
    hatsTimeFrameModuleAddress,
  );
  const { renounceHat, isLoading: isRenouncing } =
    useRenounceHatFromTimeFrameModule(hatsTimeFrameModuleAddress as Address);

  const navigate = useNavigate();

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
        <Heading size="lg">アシストクレジット</Heading>
        <Link to={`/${treeId}/${hatId}/${address}/assistcredit/send`}>
          <BasicButton minH={5} size="xs" bgColor="yellow.400">
            誰かに送る
          </BasicButton>
        </Link>
      </HStack>

      <VStack width="full" alignItems="start" gap={3} paddingY={4}>
        {holderDetail.length === 0 ? (
          <Text fontStyle="italic" color="gray.400">
            No holders
          </Text>
        ) : (
          holderDetail.map((h) => (
            <HStack key={`${h.name}h`} width="full">
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
              bgColor="red.200"
              onClick={async () => {
                await deactivate(hatId, address);
                setCount(count + 1);
              }}
              disabled={isDeactivating}
              loading={isDeactivating}
            >
              一時休止
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
          {/* 現時点では表示されても実際にrevokeできるのはwearerのみ */}
          <BasicButton
            marginY={4}
            bgColor="red.400"
            color="white"
            onClick={async () => {
              try {
                await renounceHat(BigInt(hatId || 0), address as Address);
              } catch (error) {
                console.error(error);
                return;
              }
              navigate(`/${treeId}/${hatId}`);
            }}
            disabled={isRenouncing}
            loading={isRenouncing}
          >
            役割を剥奪
          </BasicButton>
        </>
      )}

      <StickyNav />
    </Box>
  );
};

export default RoleHolderDetails;
