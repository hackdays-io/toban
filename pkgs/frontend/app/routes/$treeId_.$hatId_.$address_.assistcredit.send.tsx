import {
  Box,
  Float,
  HStack,
  Input,
  List,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  useActiveWalletIdentity,
  useAddressesByNames,
  useNamesByAddresses,
} from "hooks/useENS";
import { NameData } from "namestone-sdk";
import { FC, useEffect, useMemo, useState } from "react";
import { FaArrowRight } from "react-icons/fa6";
import { ipfs2https } from "utils/ipfs";
import { BasicButton } from "~/components/BasicButton";
import { CommonInput } from "~/components/common/CommonInput";
import { RoleIcon } from "~/components/icon/RoleIcon";
import { UserIcon } from "~/components/icon/UserIcon";
import { PageHeader } from "~/components/PageHeader";
import { Field } from "~/components/ui/field";

const AssistCreditSend: FC = () => {
  const me = useActiveWalletIdentity();
  const tokenBalance = 1000;

  // 送信先取得
  const [searchText, setSearchText] = useState<string>("");

  const { names, fetchNames } = useNamesByAddresses();
  const { addresses, fetchAddresses } = useAddressesByNames();

  const isSearchAddress = useMemo(() => {
    return searchText.startsWith("0x") && searchText.length === 42;
  }, [searchText]);

  useEffect(() => {
    if (searchText.length === 0) {
      return;
    }

    if (isSearchAddress) {
      fetchNames([searchText]);
    } else {
      fetchAddresses([searchText]);
    }
  }, [searchText, isSearchAddress]);

  const users = useMemo(() => {
    return isSearchAddress ? names : addresses;
  }, [names, addresses, isSearchAddress]);

  // 送信先選択後
  const [receiver, setReceiver] = useState<NameData>();
  const [amount, setAmount] = useState<number>(0);

  return (
    <Box>
      <PageHeader
        title={
          receiver
            ? `${receiver.name || `${receiver.address.slice(0, 6)}...${receiver.address.slice(-4)}`}に送信`
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

      <HStack my={2}>
        <RoleIcon size="50px" />
        <Text>掃除当番</Text>
      </HStack>

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

          <List.Root listStyle="none" my={10} gap={3}>
            {users[0]?.map((user, index) => (
              <List.Item key={index} onClick={() => setReceiver(user)}>
                <HStack>
                  <UserIcon
                    userImageUrl={ipfs2https(user.text_records?.avatar)}
                    size={10}
                  />
                  <Text>{user.name}</Text>
                  <Text>
                    ({`${user.address.slice(0, 6)}...${user.address.slice(-4)}`}
                    )
                  </Text>
                </HStack>
              </List.Item>
            ))}
          </List.Root>
        </>
      ) : (
        <>
          <HStack
            mt="calc(50vh - 230px)"
            alignItems="center"
            justifyContent="center"
          >
            <Input
              p={2}
              pb={4}
              fontSize="60px"
              size="2xl"
              border="none"
              borderRadius="0"
              w="120px"
              type="number"
              min={0}
              max={100}
              textAlign={"right"}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
            <Text fontSize="25px">%</Text>
          </HStack>

          <Float
            placement="bottom-center"
            mb="7vh"
            width="100%"
            display="flex"
            flexDirection="column"
            alignItems="center"
          >
            <HStack columnGap={3} mb={4}>
              <Box textAlign="center">
                <UserIcon
                  size={10}
                  userImageUrl={ipfs2https(me.identity?.text_records?.avatar)}
                />
                <Text fontSize="xs">{me.identity?.name}</Text>
              </Box>
              <VStack textAlign="center">
                <Text>{(tokenBalance / 100) * amount}</Text>
                <FaArrowRight size="20px" />
              </VStack>
              <Box>
                <UserIcon
                  size={10}
                  userImageUrl={ipfs2https(receiver.text_records?.avatar)}
                />
                <Text fontSize="xs">{receiver.name}</Text>
              </Box>
            </HStack>
            <BasicButton>送信</BasicButton>
          </Float>
        </>
      )}
    </Box>
  );
};

export default AssistCreditSend;
