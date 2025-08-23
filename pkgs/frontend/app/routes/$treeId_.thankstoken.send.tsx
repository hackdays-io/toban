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
import { abbreviateAddress } from "utils/wallet";
import { type Address, formatEther, parseEther } from "viem";
import { PageHeader } from "~/components/PageHeader";
import AmountSelector from "~/components/assistcredit/AmountSelector";
import SendConfirmation from "~/components/assistcredit/SendConfirmation";
import UserList from "~/components/assistcredit/UserList";

const ThanksTokenSend: FC = () => {
  const { treeId } = useParams();
  const { mintableAmount, mintThanksToken, isLoading } = useThanksToken(
    treeId as string,
  );
  const me = useActiveWalletIdentity();
  const navigate = useNavigate();

  const [receiver, setReceiver] = useState<NameData>();
  const [amount, setAmount] = useState<number>(0);

  const [isSend, setIsSend] = useState(false);

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

  const send = useCallback(async () => {
    if (!receiver || isLoading || !amount) return;

    const res = await mintThanksToken(
      receiver.address as Address,
      parseEther(amount.toString()),
    );

    if (res?.error) {
      toast.error(res.error);
      throw new Error(res.error);
    }

    res?.txHash && navigate(`/${treeId}`);
  }, [receiver, isLoading, amount, mintThanksToken, navigate, treeId]);

  return (
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
            : `${["144", "175", "780"].includes(treeId || "") ? "ケアポイント" : "サンクストークン"}を送信`
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
          <Text mt={2} mb={5}>
            送信可能量:{" "}
            {Math.ceil(
              Number(formatEther(mintableAmount || 0n)),
            ).toLocaleString()}
          </Text>
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
  );
};

export default ThanksTokenSend;
