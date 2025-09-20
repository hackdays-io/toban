import { Box, HStack, List, Text } from "@chakra-ui/react";
import type { NameData } from "namestone-sdk";
import { ipfs2https } from "utils/ipfs";
import { CommonInput } from "~/components/common/CommonInput";
import { QrAddressReader } from "~/components/common/QrAddressReader";
import { UserIcon } from "~/components/icon/UserIcon";
import { Field } from "~/components/ui/field";

interface UserListProps {
  searchText: string;
  setSearchText: (text: string) => void;
  users?: NameData[][];
  onSelectUser: (user: NameData) => void;
}

const UserList = ({
  searchText,
  setSearchText,
  users,
  onSelectUser,
}: UserListProps) => {
  return (
    <>
      <Field label="ユーザー名 or ウォレットアドレスで検索">
        <Box display="flex" alignItems="center" gap={2} width="100%">
          <CommonInput
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
            }}
            placeholder="ユーザー名 or ウォレットアドレス"
          />
          <QrAddressReader
            onReadValidAddress={(address: string) => {
              setSearchText(address);
            }}
          />
        </Box>
      </Field>

      <List.Root listStyle="none" my={10} gap={4}>
        {users?.flat().map((user) => (
          <List.Item key={`${user.name}`} onClick={() => onSelectUser(user)}>
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
  );
};

export default UserList;
