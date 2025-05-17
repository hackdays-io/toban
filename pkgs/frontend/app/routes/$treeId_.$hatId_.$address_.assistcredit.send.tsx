import { Box, Grid } from "@chakra-ui/react";
import type { Hat } from "@hatsprotocol/sdk-v1-subgraph";
import { useNavigate, useParams } from "@remix-run/react";
import {
  useActiveWalletIdentity,
  useAddressesByNames,
  useNamesByAddresses,
} from "hooks/useENS";
import {
  useBalanceOfFractionTokens,
  useTransferFractionToken,
} from "hooks/useFractionToken";
import { useGetHat, useTreeInfo } from "hooks/useHats";
import type { NameData } from "namestone-sdk";
import { type FC, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { abbreviateAddress } from "utils/wallet";
import type { Address } from "viem";
import { PageHeader } from "~/components/PageHeader";
import AmountSelector from "~/components/assistcredit/AmountSelector";
import SendConfirmation from "~/components/assistcredit/SendConfirmation";
import UserList from "~/components/assistcredit/UserList";
import { HatsListItemParser } from "~/components/common/HatsListItemParser";
import RoleWithBalance from "~/components/roles/RoleWithBalance";

/**
 * AssistCreditSend Component
 * @returns
 */
const AssistCreditSend: FC = () => {
  const navigate = useNavigate();

  const { treeId, hatId, address } = useParams();
  const me = useActiveWalletIdentity();

  const { data } = useBalanceOfFractionTokens({
    where: {
      workspaceId: treeId,
      hatId: BigInt(hatId ?? "").toString(),
      wearer: address?.toLowerCase(),
      owner: me.identity?.address?.toLowerCase(),
    },
  });

  const balanceOfToken = useMemo(
    () => data?.balanceOfFractionTokens.at(0)?.balance,
    [data],
  );

  const { hat }: { hat?: Hat } = useGetHat(hatId ?? "");
  const isWearer = useMemo(() => {
    if (!hat?.wearers) return false;
    return hat.wearers.some(
      (w) => w.id.toLowerCase() === me.identity?.address?.toLowerCase(),
    );
  }, [hat, me]);

  // 送信先取得
  const tree = useTreeInfo(Number(treeId));
  const [searchText, setSearchText] = useState<string>("");

  const members = useMemo(() => {
    if (!tree || !tree.hats) return [];
    const wearerAddresses = tree.hats
      .filter((h) => h.levelAtLocalTree && h.levelAtLocalTree >= 2)
      .flatMap((h) => h.wearers)
      .filter((w) => typeof w !== "undefined")
      .map((w) => w.id.toLowerCase());
    return Array.from(new Set(wearerAddresses));
  }, [tree]);

  const { names: defaultNames } = useNamesByAddresses(members);
  const { names, fetchNames } = useNamesByAddresses();
  const { addresses, fetchAddresses } = useAddressesByNames();

  const isSearchAddress = useMemo(() => {
    return searchText.startsWith("0x") && searchText.length === 42;
  }, [searchText]);

  useEffect(() => {
    if (isSearchAddress) {
      fetchNames([searchText]);
    } else {
      fetchAddresses([searchText]);
    }
  }, [searchText, isSearchAddress, fetchAddresses, fetchNames]);

  const users = useMemo(() => {
    return !searchText ? defaultNames : isSearchAddress ? names : addresses;
  }, [defaultNames, names, addresses, isSearchAddress, searchText]);

  // 送信先選択後
  const [receiver, setReceiver] = useState<NameData>();
  const [amount, setAmount] = useState<number>(0);
  // 画面切り替えのために使用するフラグ
  const [isSend, setIsSend] = useState(false);

  const { transferFractionToken, isLoading } = useTransferFractionToken(
    BigInt(hatId || 0),
    address as Address,
  );

  /**
   * トークンを送信する関数
   */
  const send = useCallback(async () => {
    if (!receiver || !hatId || !me || isLoading) return;

    const res = await transferFractionToken(
      receiver.address as Address,
      BigInt(amount),
    );

    if (res?.error) {
      toast.error(res.error);
      throw new Error(res.error);
    }
    res?.txHash && navigate(`/${treeId}/${hatId}/${address}`);
  }, [
    transferFractionToken,
    receiver,
    amount,
    treeId,
    hatId,
    me,
    isLoading,
    address,
    navigate,
  ]);

  return (
    <>
      <Grid
        gridTemplateRows={
          !receiver
            ? "auto auto auto 1fr"
            : isSend
              ? "auto 1fr"
              : "auto auto 1fr auto"
        }
        minH="calc(100vh - 100px)"
      >
        <PageHeader
          title={
            receiver
              ? `${receiver.name || `${abbreviateAddress(receiver.address)}に送信`}`
              : `${["144", "175"].includes(treeId || "") ? "ケアポイント" : "アシストクレジット"}を送信`
          }
          backLink={
            receiver &&
            (isSend
              ? () => {
                  setIsSend(false);
                  setAmount(10);
                }
              : () => {
                  setReceiver(undefined);
                  setAmount(10);
                })
          }
        />

        {isSend ? (
          <SendConfirmation
            amount={amount}
            me={me.identity}
            receiver={receiver}
            onSend={send}
          />
        ) : (
          <>
            <Box my={6}>
              <HatsListItemParser
                imageUri={hat?.imageUri}
                detailUri={hat?.details}
              >
                <RoleWithBalance
                  wearer={address as Address}
                  balance={balanceOfToken ? Number(balanceOfToken) : undefined}
                />
              </HatsListItemParser>
            </Box>

            {!receiver ? (
              <UserList
                searchText={searchText}
                setSearchText={setSearchText}
                users={users}
                onSelectUser={setReceiver}
              />
            ) : (
              <AmountSelector
                amount={amount}
                setAmount={setAmount}
                onNext={() => setIsSend(true)}
                isLoading={isLoading}
                me={me.identity}
                receiver={receiver}
              />
            )}
          </>
        )}
      </Grid>
    </>
  );
};

export default AssistCreditSend;
