import { useState, useEffect } from "react";
import { Box, Text } from "@chakra-ui/react";
import { WorkspaceIcon } from "./icon/WorkspaceIcon";
import { UserIcon } from "./icon/UserIcon";
import { useLocation } from "@remix-run/react";

const NO_HEADER_PATHS: string[] = ["/login", "/signup"]; // 適宜ヘッダーが不要なページのパスを追加
const WORKSPACES_PATHS: string[] = ["/workspaces"]; // 適宜ヘッダーが不要なページのパスを追加
const HEADER_SIZE: number = 12; // 偶数のnumberだとアイコンが対応しているため望ましい

const headerTextStyle = {
  color: "gray.800",
  my: "auto",
  wordBreak: "break-word",
  flex: "1",
};

enum HeaderType {
  NonHeader = "NonHeader",
  UserIconOnly = "UserIconOnly",
  WorkspaceAndUserIcons = "WorkspaceAndUserIcons",
}

export const Header = () => {
  const [headerType, setHeaderType] = useState<HeaderType>(
    HeaderType.NonHeader
  );

  const { pathname } = useLocation();

  // ToDo: ページのパスや hooks で柔軟にロジックを実装する（切り替えてテストできます）
  const isWalletConnected = true;
  const isUserTobanEnsFound = true;
  const isWorkspaceSelected = true;

  // ToDo: ユーザーやワークスペースごとの各種データを取得するロジックを実装する
  const userImageUrl: string | undefined = undefined;
  const workspaceName: string | undefined = "Workspace Name";
  const workspaceImageUrl: string | undefined = undefined;

  useEffect(() => {
    const determineHeaderType = () => {
      if (
        !NO_HEADER_PATHS.includes(pathname) &&
        isWalletConnected &&
        isUserTobanEnsFound
      ) {
        return !WORKSPACES_PATHS.includes(pathname) ||
          (isWorkspaceSelected && workspaceName)
          ? HeaderType.WorkspaceAndUserIcons
          : HeaderType.UserIconOnly;
      }
      return HeaderType.NonHeader;
    };

    setHeaderType(determineHeaderType());
  }, [
    pathname,
    isWalletConnected,
    isUserTobanEnsFound,
    isWorkspaceSelected,
    workspaceName,
  ]);

  return (
    <Box
      height={HEADER_SIZE}
      display="flex"
      justifyContent="space-between"
      width="100%"
      alignItems="center"
      mb={6}
    >
      {headerType !== HeaderType.NonHeader && (
        <>
          <Box display="flex" height={HEADER_SIZE} flex="1">
            {headerType === HeaderType.UserIconOnly && (
              <Text {...headerTextStyle} fontSize="xl">
                Workspaces
              </Text>
            )}
            {headerType === HeaderType.WorkspaceAndUserIcons && (
              <>
                <WorkspaceIcon
                  workspaceImageUrl={workspaceImageUrl}
                  size={HEADER_SIZE}
                />
                <Text {...headerTextStyle} ml={4}>
                  {workspaceName}
                </Text>
              </>
            )}
          </Box>
          <UserIcon userImageUrl={userImageUrl} size={HEADER_SIZE - 2} />
        </>
      )}
    </Box>
  );
};
