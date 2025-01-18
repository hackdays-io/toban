import { Box, Flex, Text } from "@chakra-ui/react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Link, useLocation, useNavigate, useParams } from "@remix-run/react";
import axios from "axios";
import { useActiveWalletIdentity } from "hooks/useENS";
import { useTreeInfo } from "hooks/useHats";
import { currentChain } from "hooks/useViem";
import { useActiveWallet } from "hooks/useWallet";
import { useEffect, useMemo, useState } from "react";
import type { HatsDetailSchama } from "types/hats";
import { ipfs2https } from "utils/ipfs";
import { abbreviateAddress } from "utils/wallet";
import type { Chain } from "viem";
import { useSwitchNetwork } from "./SwitchNetwork";
import CommonButton from "./common/CommonButton";
import { UserIcon } from "./icon/UserIcon";
import { WorkspaceIcon } from "./icon/WorkspaceIcon";
import { MenuContent, MenuItem, MenuRoot, MenuTrigger } from "./ui/menu";

const NO_HEADER_PATHS: string[] = ["/login", "/signup", "/"]; // 適宜ヘッダーが不要なページのパスを追加
const WORKSPACES_PATHS: string[] = ["/workspace", "/workspace/new"]; // 適宜ワークスペースが未選択な状態のページのパスを追加

const headerTextStyle = {
  color: "gray.800",
  wordBreak: "break-word",
};

enum HeaderType {
  NonHeader = "NonHeader",
  UserIconOnly = "UserIconOnly",
  WorkspaceAndUserIcons = "WorkspaceAndUserIcons",
}

// ネットワーク切り替えコンポーネントを作成
const NetworkSwitcher = ({
  switchToChain,
}: {
  switchToChain: (chain: Chain) => Promise<boolean>;
}) => {
  return (
    <MenuItem value="network" display="block">
      <Text fontWeight="bold" mb={2}>
        Network
      </Text>
      {/* チェーン切り替えボタンを表示 */}
      {/* {supportedChains.map((chain) => (
        <CommonButton
          key={chain.id}
          onClick={() => switchToChain(chain)}
          w="100%"
          mb={1}
          variant={chain.id === currentChain.id ? "solid" : "outline"}
        >
          {chain.name}
        </CommonButton>
      ))} */}

      {/* 現在のチェーンを表示 */}
      <CommonButton
        key={currentChain.id}
        onClick={() => switchToChain(currentChain)}
        w="100%"
        mb={1}
        variant={"solid"}
      >
        {currentChain.name}
      </CommonButton>
    </MenuItem>
  );
};

export const Header = () => {
  const [headerType, setHeaderType] = useState<HeaderType>(
    HeaderType.NonHeader,
  );

  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { treeId } = useParams();
  const treeInfo = useTreeInfo(Number(treeId));

  const [workspaceName, setWorkspaceName] = useState<string>();
  useEffect(() => {
    const fetch = async () => {
      setWorkspaceName(undefined);
      const topHat = treeInfo?.hats?.find((hat) => hat.levelAtLocalTree === 0);
      if (topHat?.details) {
        const { data } = await axios.get<HatsDetailSchama>(
          ipfs2https(topHat.details) || "",
        );
        setWorkspaceName(data.data.name);
      }
    };
    fetch();
  }, [treeInfo]);

  useEffect(() => {
    const determineHeaderType = () => {
      if (!NO_HEADER_PATHS.includes(pathname)) {
        return !WORKSPACES_PATHS.includes(pathname) || workspaceName
          ? HeaderType.WorkspaceAndUserIcons
          : HeaderType.UserIconOnly;
      }
      return HeaderType.NonHeader;
    };

    setHeaderType(determineHeaderType());
  }, [pathname, workspaceName]);

  const { isSmartWallet } = useActiveWallet();
  const { logout } = usePrivy();
  const { wallets } = useWallets();
  const { identity } = useActiveWalletIdentity();

  const userImageUrl = useMemo(() => {
    const avatar = identity?.text_records?.avatar;
    return avatar ? ipfs2https(avatar) : undefined;
  }, [identity]);

  // ログアウトハンドラー
  const handleLogout = async () => {
    try {
      if (isSmartWallet) {
        await logout();
      } else {
        if (wallets.find((w) => w.connectorType === "injected")) {
          alert("ウォレット拡張機能から切断してください。");
          return;
        }
        await Promise.all(wallets.map((wallet) => wallet.disconnect()));
        navigate("/login");
      }
    } catch (error) {
      console.error("ログアウトに失敗しました:", error);
    }
  };

  const { switchToChain } = useSwitchNetwork();

  return headerType !== HeaderType.NonHeader ? (
    <Flex justifyContent="space-between" w="100%" py={3}>
      <Box display="flex" height="48px" flex="1" alignItems="center">
        {headerType === HeaderType.UserIconOnly && (
          <Text {...headerTextStyle} fontSize="xl" fontWeight="bold">
            Workspaces
          </Text>
        )}
        {headerType === HeaderType.WorkspaceAndUserIcons && (
          <>
            <Link to="/workspace">
              <WorkspaceIcon
                workspaceImageUrl={ipfs2https(
                  treeInfo?.hats?.find((hat) => hat.levelAtLocalTree === 0)
                    ?.imageUri,
                )}
                size="40px"
              />
            </Link>
            <Text fontSize="lg" fontWeight="bold" {...headerTextStyle} ml={4}>
              {workspaceName}
            </Text>
          </>
        )}
      </Box>
      {identity ? (
        <MenuRoot closeOnSelect={false}>
          <MenuTrigger asChild>
            <button type="button">
              <UserIcon userImageUrl={userImageUrl} size="40px" />
            </button>
          </MenuTrigger>
          <MenuContent>
            <MenuItem value="name" bgColor="blue.100" display="block">
              <Text fontWeight="bold">{identity.name}</Text>
              <Text fontSize="xs">
                {identity.name}.{identity.domain}
              </Text>
              <Text fontSize="xs">{abbreviateAddress(identity.address)}</Text>
            </MenuItem>
            <NetworkSwitcher switchToChain={switchToChain} />
            <MenuItem value="logout" onClick={handleLogout}>
              Logout
            </MenuItem>
          </MenuContent>
        </MenuRoot>
      ) : (
        <MenuRoot closeOnSelect={false}>
          <MenuTrigger asChild>
            <CommonButton w="auto" my="auto">
              {currentChain.name}
            </CommonButton>
          </MenuTrigger>
          <MenuContent>
            <NetworkSwitcher switchToChain={switchToChain} />
            <MenuItem value="logout" onClick={handleLogout}>
              Logout
            </MenuItem>
          </MenuContent>
        </MenuRoot>
      )}
    </Flex>
  ) : (
    <></>
  );
};
