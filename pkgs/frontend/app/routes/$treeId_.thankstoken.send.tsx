import { Box, Grid, Text } from "@chakra-ui/react";
import { useNavigate, useParams } from "@remix-run/react";
import {
  useActiveWalletIdentity,
  useAddressesByNames,
  useNamesByAddresses,
} from "hooks/useENS";
import { useTreeInfo } from "hooks/useHats";
import { useThanksToken } from "hooks/useThanksToken";
import type { NameData } from "namestone-sdk";
import { type FC, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { type Address, formatEther, parseEther } from "viem";
import { BasicButton } from "~/components/BasicButton";
import { PageHeader } from "~/components/PageHeader";
import AmountSelector from "~/components/assistcredit/AmountSelector";
import SendConfirmation from "~/components/assistcredit/SendConfirmation";
import UserList from "~/components/assistcredit/UserList";

const ThanksTokenSend: FC = () => {
  const { treeId } = useParams();
  const { mintableAmount, mintThanksToken, batchMintThanksToken, isLoading } =
    useThanksToken(treeId as string);
  const me = useActiveWalletIdentity();
  const navigate = useNavigate();

  const [selectedUsers, setSelectedUsers] = useState<NameData[]>([]);
  const [amount, setAmount] = useState<number>(0);

  const [isSend, setIsSend] = useState(false);
  const [showAmountSelector, setShowAmountSelector] = useState(false);

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
    return (
      !searchText ? defaultNames : isSearchAddress ? names : addresses
    ).filter((u) =>
      u.some(
        (ua) => ua.address.toLowerCase() !== me.identity?.address.toLowerCase(),
      ),
    );
  }, [defaultNames, names, addresses, isSearchAddress, searchText, me]);

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

  const send = useCallback(async () => {
    if (selectedUsers.length === 0 || isLoading) return;

    try {
      if (selectedUsers.length === 1) {
        const res = await mintThanksToken(
          selectedUsers[0].address as Address,
          parseEther(amount.toString()),
        );
        if (res?.error) throw new Error(res.error);
      } else {
        const res = await batchMintThanksToken(
          selectedUsers.map((user) => user.address as Address),
          Array(selectedUsers.length).fill(parseEther(amount.toString())),
        );
        if (res?.error) throw new Error(res.error);
      }
      toast.success("送信が完了しました");
      navigate(`/${treeId}`);
    } catch (error) {
      console.error("Send error:", error);
      toast.error("送信に失敗しました");
      setIsSend(false);
    }
  }, [
    mintThanksToken,
    batchMintThanksToken,
    selectedUsers,
    amount,
    isLoading,
    treeId,
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
            : `${["144", "175", "780"].includes(treeId || "") ? "ケアポイント" : "サンクストークン"}を送信`
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
          <Text mt={2} mb={5}>
            送信可能量:{" "}
            {Math.ceil(
              Number(formatEther(mintableAmount || 0n)),
            ).toLocaleString()}
          </Text>
          {showAmountSelector ? (
            <AmountSelector
              amount={amount}
              setAmount={setAmount}
              onNext={() => setIsSend(true)}
              isLoading={isLoading}
              me={me.identity}
              receivers={selectedUsers}
              max={500}
              step={20}
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
            送付量を選択 ({selectedUsers.length}人)
          </BasicButton>
        </Box>
      )}
    </Grid>
  );
};

export default ThanksTokenSend;
