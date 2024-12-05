import { useState, useEffect, useMemo } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { WorkspaceIcon } from "./icon/WorkspaceIcon";
import { UserIcon } from "./icon/UserIcon";
import { useLocation, useNavigate } from "@remix-run/react";
import { useActiveWalletIdentity } from "hooks/useENS";
import { ipfs2https } from "utils/ipfs";
import { MenuContent, MenuItem, MenuRoot, MenuTrigger } from "./ui/menu";
import { useActiveWallet } from "hooks/useWallet";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import CommonButton from "./common/CommonButton";

const NO_HEADER_PATHS: string[] = ["/login", "/signup"]; // 適宜ヘッダーが不要なページのパスを追加
const WORKSPACES_PATHS: string[] = ["/workspaces"]; // 適宜ワークスペースが未選択な状態のページのパスを追加
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

  const navigate = useNavigate();
  const { pathname } = useLocation();

  // ToDo: ページのパスや hooks で柔軟にロジックを実装する（切り替えてテストできます）
  const isWalletConnected = true;
  const isUserTobanEnsFound = true;
  const isWorkspaceSelected = true;

  // ToDo: ユーザーやワークスペースごとの各種データを取得するロジックを実装する
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

  const { isSmartWallet } = useActiveWallet();
  const { logout } = usePrivy();
  const { wallets } = useWallets();
  const { identity } = useActiveWalletIdentity();

  const userImageUrl = useMemo(() => {
    const avatar = identity?.text_records?.["avatar"];
    return avatar ? ipfs2https(avatar) : undefined;
  }, [identity]);

  const handleLogout = () => {
    if (isSmartWallet) {
      logout();
    } else {
      if (wallets.find((w) => w.connectorType === "injected")) {
        alert("ウォレット拡張機能から切断してください。");
      } else {
        Promise.all(wallets.map((wallet) => wallet.disconnect()));
      }
    }
  };

  return headerType !== HeaderType.NonHeader ? (
    <Flex justifyContent="space-between" w="100%">
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
      {identity ? (
        <MenuRoot closeOnSelect={false}>
          <MenuTrigger asChild>
            <button>
              <UserIcon userImageUrl={userImageUrl} size={HEADER_SIZE - 2} />
            </button>
          </MenuTrigger>
          <MenuContent>
            <MenuItem value="logout" onClick={handleLogout}>
              Logout
            </MenuItem>
          </MenuContent>
        </MenuRoot>
      ) : (
        <CommonButton
          onClick={() => {
            navigate("/login");
          }}
          w="auto"
        >
          Login
        </CommonButton>
      )}
    </Flex>
  ) : (
    <></>
  );
};
