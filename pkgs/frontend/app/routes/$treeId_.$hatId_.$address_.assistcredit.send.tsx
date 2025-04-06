import { Box, Flex, Grid, HStack, List, Text } from "@chakra-ui/react";
import { Slider } from "@chakra-ui/react/slider";
import { useNavigate, useParams } from "@remix-run/react";
import {
  useActiveWalletIdentity,
  useAddressesByNames,
  useNamesByAddresses,
} from "hooks/useENS";
import {
  useBalanceOfFractionToken,
  useTransferFractionToken,
} from "hooks/useFractionToken";
import { useGetHat, useTreeInfo } from "hooks/useHats";
import type { NameData } from "namestone-sdk";
import { type FC, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { ipfs2https } from "utils/ipfs";
import { abbreviateAddress } from "utils/wallet";
import type { Address } from "viem";
import { BasicButton } from "~/components/BasicButton";
import { PageHeader } from "~/components/PageHeader";
import { CommonInput } from "~/components/common/CommonInput";
import { HatsListItemParser } from "~/components/common/HatsListItemParser";
import { UserIcon } from "~/components/icon/UserIcon";
import RoleWithBalance from "~/components/roles/RoleWithBalance";
import { Field } from "~/components/ui/field";

/**
 * AssistCreditSend Component
 * @returns
 */
const AssistCreditSend: FC = () => {
  const navigate = useNavigate();

  const { treeId, hatId, address } = useParams();
  const me = useActiveWalletIdentity();

  const balanceOfToken = useBalanceOfFractionToken(
    me.identity?.address as Address,
    address as Address,
    BigInt(hatId ?? ""),
  );

  const { hat } = useGetHat(hatId ?? "");

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

  const { transferFractionToken, isLoading } = useTransferFractionToken(
    BigInt(hatId || 0),
    address as Address,
  );

  /**
   * トークンを送信する関数
   */
  const send = useCallback(async () => {
    if (!receiver || !hatId || !me || isLoading) return;

    try {
      // トークンを送信するメソッド
      const res = await transferFractionToken(
        receiver.address as Address,
        BigInt(amount),
      );
      console.log("transferFractionToken res: ", res);
      res?.error && toast.error(res.error);
      res?.txHash && navigate(`/${treeId}/${hatId}/${address}`);
    } catch (error) {
      console.error(error);
    }
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
          !receiver ? "auto auto auto 1fr" : "auto auto 1fr auto"
        }
        minH="calc(100vh - 100px)"
      >
        <PageHeader
          title={
            receiver
              ? `${receiver.name || `${abbreviateAddress(receiver.address)}に送信`}`
              : "アシストクレジット送信"
          }
          backLink={
            receiver &&
            (() => {
              setReceiver(undefined);
              setAmount(0);
            })
          }
        />

        <Box my={6}>
          <HatsListItemParser imageUri={hat?.imageUri} detailUri={hat?.details}>
            <RoleWithBalance
              wearer={address as Address}
              balance={balanceOfToken ? Number(balanceOfToken) : undefined}
            />
          </HatsListItemParser>
        </Box>

        {!receiver ? (
          <>
            <Field label="ユーザー名 or ウォレットアドレスで検索">
              <CommonInput
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                }}
                placeholder="ユーザー名 or ウォレットアドレス"
              />
            </Field>

            <List.Root listStyle="none" my={10} gap={4}>
              {users?.flat().map((user) => (
                <List.Item
                  key={`${user.name}u`}
                  onClick={() => setReceiver(user)}
                >
                  <HStack>
                    <UserIcon
                      userImageUrl={ipfs2https(user.text_records?.avatar)}
                      size={10}
                    />
                    <Text lineBreak="anywhere">
                      {user.name
                        ? `${user.name} (${user.address.slice(0, 6)}...${user.address.slice(-4)})`
                        : user.address}
                    </Text>
                  </HStack>
                </List.Item>
              ))}
            </List.Root>
          </>
        ) : (
          <>
            <Field label="送信量" alignItems="center" justifyContent="center">
              <Text fontSize="60px" fontWeight="bold" textAlign="center" mb={2}>
                {amount}
              </Text>
              <Box width="100%" px={4} mb={4}>
                <Slider.Root
                  thumbAlignment="contain"
                  thumbSize={{ width: 16, height: 16 }}
                  defaultValue={[10]}
                  step={7}
                >
                  <Slider.Control>
                    <Slider.Track>
                      <Slider.Range />
                    </Slider.Track>
                    <Slider.Thumb index={0}>
                      <Slider.DraggingIndicator
                        layerStyle="fill.solid"
                        top="6"
                        rounded="sm"
                        px="1.5"
                      >
                        <Slider.ValueText />
                      </Slider.DraggingIndicator>
                    </Slider.Thumb>
                  </Slider.Control>
                </Slider.Root>

                <Flex justifyContent="space-between" width="100%">
                  <Text fontSize="sm">100</Text>
                  <Text fontSize="sm">200</Text>
                  <Text fontSize="sm">300</Text>
                  <Text fontSize="sm">500</Text>
                  <Text fontSize="sm">800</Text>
                  <Text fontSize="sm">1300</Text>
                  <Text fontSize="sm">2000</Text>
                </Flex>

                <Flex justifyContent="space-between" width="100%" mt={1}>
                  <Text>🍤</Text>
                  <Text>🍱</Text>
                  <Text>🍫</Text>
                  <Text>🍪</Text>
                  <Text>🧁</Text>
                  <Text>🍰</Text>
                  <Text>🎂</Text>
                </Flex>
              </Box>
            </Field>

            <Flex width="100%" flexDirection="column" alignItems="center">
              <BasicButton
                colorScheme="yellow"
                width={100}
                loading={isLoading}
                onClick={send}
                mb={5}
              >
                Next
              </BasicButton>
            </Flex>
          </>
        )}
      </Grid>
    </>
  );
};

export default AssistCreditSend;
