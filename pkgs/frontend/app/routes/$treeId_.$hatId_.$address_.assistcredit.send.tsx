import { Box, Grid } from "@chakra-ui/react";
import type { Hat } from "@hatsprotocol/sdk-v1-subgraph";
import { useNavigate, useParams } from "@remix-run/react";
import {
  useActiveWalletIdentity,
  useAddressesByNames,
  useNamesByAddresses,
} from "hooks/useENS";
import {
  useGetBalanceOfFractionTokens,
  useTransferFractionToken,
} from "hooks/useFractionToken";
import { useGetHat, useTreeInfo } from "hooks/useHats";
import type { NameData } from "namestone-sdk";
import { type FC, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import type { Address } from "viem";
import { BasicButton } from "~/components/BasicButton";
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

  const { data } = useGetBalanceOfFractionTokens({
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
  const [selectedUsers, setSelectedUsers] = useState<NameData[]>([]);
  const [amount, setAmount] = useState<number>(0);
  // 画面切り替えのために使用するフラグ
  const [isSend, setIsSend] = useState(false);
  const [showAmountSelector, setShowAmountSelector] = useState(false);

  const { transferFractionToken, batchTransferFractionToken, isLoading } =
    useTransferFractionToken(
      treeId as string,
      BigInt(hatId || 0),
      address as Address,
    );

  const toggleUser = useCallback((user: NameData) => {
    setSelectedUsers((prev) => {
      const isSelected = prev.some(
        (u) => u.address.toLowerCase() === user.address.toLowerCase(),
      );
      if (isSelected) {
        return prev.filter(
          (u) => u.address.toLowerCase() !== user.address.toLowerCase(),
        );
      }
      return [...prev, user];
    });
  }, []);

  /**
   * トークンを送信する関数
   */
  const send = useCallback(async () => {
    if (selectedUsers.length === 0 || !hatId || !me || isLoading || !amount)
      return;

    try {
      if (selectedUsers.length === 1) {
        const res = await transferFractionToken(
          selectedUsers[0].address as Address,
          BigInt(amount),
        );
        if (res?.error) throw new Error(res.error);
      } else {
        const tos = selectedUsers.map((u) => u.address as Address);
        const amounts = selectedUsers.map(() => BigInt(amount));
        const res = await batchTransferFractionToken(tos, amounts);
        if (res?.error) throw new Error(res.error);
      }
      toast.success("送信が完了しました");
      navigate(`/${treeId}/${hatId}/${address}`);
    } catch (error) {
      console.error("Batch send error:", error);
      toast.error("送信に失敗しました");
      setIsSend(false);
    }
  }, [
    transferFractionToken,
    batchTransferFractionToken,
    selectedUsers,
    amount,
    treeId,
    hatId,
    me,
    isLoading,
    address,
    navigate,
  ]);

  return (
    <Grid
      gridTemplateRows={
        isSend
          ? "auto 1fr"
          : showAmountSelector
            ? "auto auto 1fr auto"
            : "auto auto auto 1fr"
      }
      minH="calc(100vh - 100px)"
      position="relative"
    >
      <PageHeader
        title={
          selectedUsers.length > 0
            ? `${selectedUsers.length}人に送信`
            : `${["144", "175", "780"].includes(treeId || "") ? "ケアポイント" : "ロールシェア"}を送信`
        }
        backLink={
          selectedUsers.length > 0 || showAmountSelector
            ? isSend
              ? () => {
                  setIsSend(false);
                  setAmount(10);
                }
              : showAmountSelector
                ? () => {
                    setShowAmountSelector(false);
                    setAmount(10);
                  }
                : () => {
                    setSelectedUsers([]);
                    setAmount(10);
                  }
            : undefined
        }
      />

      {isSend ? (
        <SendConfirmation
          amount={amount}
          me={me.identity}
          receivers={selectedUsers}
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

          {showAmountSelector ? (
            <AmountSelector
              amount={amount}
              setAmount={setAmount}
              onNext={() => setIsSend(true)}
              isLoading={isLoading}
              me={me.identity}
              receivers={selectedUsers}
            />
          ) : (
            <UserList
              searchText={searchText}
              setSearchText={setSearchText}
              users={users}
              selectedUsers={selectedUsers}
              onToggleUser={toggleUser}
              multiSelect={true}
            />
          )}
        </>
      )}

      {/* Floating Select Amount Button */}
      {selectedUsers.length > 0 && !showAmountSelector && !isSend && (
        <Box
          position="fixed"
          bottom="20px"
          left="50%"
          transform="translateX(-50%)"
          zIndex={1000}
        >
          <BasicButton
            colorScheme="yellow"
            size="lg"
            onClick={() => setShowAmountSelector(true)}
            px={8}
            py={4}
            borderRadius="full"
            boxShadow="lg"
          >
            金額を選択 ({selectedUsers.length}人)
          </BasicButton>
        </Box>
      )}
    </Grid>
  );
};

export default AssistCreditSend;
