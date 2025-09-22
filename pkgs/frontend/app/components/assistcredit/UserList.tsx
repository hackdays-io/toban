import { Box, HStack, List, Text } from "@chakra-ui/react";
import type { NameData } from "namestone-sdk";
import { ipfs2https } from "utils/ipfs";
import { CommonInput } from "~/components/common/CommonInput";
import { QrAddressReader } from "~/components/common/QrAddressReader";
import { UserIcon } from "~/components/icon/UserIcon";
import { Checkbox } from "~/components/ui/checkbox";
import { Field } from "~/components/ui/field";

interface UserListProps {
  searchText: string;
  setSearchText: (text: string) => void;
  users?: NameData[][];
  onSelectUser?: (user: NameData) => void;
  selectedUsers?: NameData[];
  onToggleUser?: (user: NameData) => void;
  multiSelect?: boolean;
}

const UserList = ({
  searchText,
  setSearchText,
  users,
  onSelectUser,
  selectedUsers = [],
  onToggleUser,
  multiSelect = false,
}: UserListProps) => {
  const isUserSelected = (user: NameData) => {
    return selectedUsers.some(
      (selected) =>
        selected.address.toLowerCase() === user.address.toLowerCase(),
    );
  };

  const handleUserClick = (user: NameData) => {
    if (multiSelect && onToggleUser) {
      onToggleUser(user);
    } else if (onSelectUser) {
      onSelectUser(user);
    }
  };

  // Merge selected users with current users, preventing duplicates
  const allUsers = users?.flat() || [];

  // Find selected users that are not in the current users array
  const missingSelectedUsers = selectedUsers.filter(
    (selectedUser) =>
      !allUsers.some(
        (user) =>
          user.address.toLowerCase() === selectedUser.address.toLowerCase(),
      ),
  );

  // Combine all users with missing selected users
  const combinedUsers = [...missingSelectedUsers, ...allUsers];

  // Sort users to show selected ones first
  const sortedUsers = combinedUsers.sort((a, b) => {
    const aSelected = isUserSelected(a);
    const bSelected = isUserSelected(b);
    if (aSelected && !bSelected) return -1;
    if (!aSelected && bSelected) return 1;
    return 0;
  });

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

      <List.Root listStyle="none" mt={5} mb={10} gap={4}>
        {sortedUsers.map((user) => (
          <List.Item
            key={`${user.address}`}
            onClick={() => handleUserClick(user)}
            cursor="pointer"
            borderRadius="md"
          >
            <HStack>
              {multiSelect && (
                <Checkbox
                  checked={isUserSelected(user)}
                  onChange={() => handleUserClick(user)}
                  colorPalette="yellow"
                />
              )}
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
