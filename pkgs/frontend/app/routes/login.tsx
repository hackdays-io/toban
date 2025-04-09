import { Box, Flex, Grid, Text } from "@chakra-ui/react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useNavigate } from "@remix-run/react";
import { useNamesByAddresses } from "hooks/useENS";
import { useActiveWallet } from "hooks/useWallet";
import { type FC, useCallback, useEffect } from "react";
import { BasicButton } from "~/components/BasicButton";
import { CommonIcon } from "~/components/common/CommonIcon";

const Login: FC = () => {
  const navigate = useNavigate();
  const { ready, authenticated, connectOrCreateWallet, logout } = usePrivy();
  const { wallets } = useWallets();
  const { wallet, isSmartWallet } = useActiveWallet();
  const { fetchNames } = useNamesByAddresses();

  // ToDo：Metamask、Privyアカウント、どちらともディスコネクトできないので修正する
  // Privy 経由で取得されたウォレット（例：スマートウォレット）には有効でも、
  // MetaMask などの外部ウォレットでは「接続の解除」はユーザー操作に委ねられているため、無効になる。
  // login.tsx:34 MetaMask does not support programmatic disconnect.

  const disconnectWallets = useCallback(async () => {
    console.log("wallets", wallets);
    console.log("isSmartWallet", isSmartWallet);
    console.log("ready", ready);
    console.log("authenticated", authenticated);

    // if (!authenticated) {
    //   console.warn("Already logged out or not authenticated. Skipping logout.");
    //   return;
    // }

    if (wallets.length === 0) return;

    try {
      if (isSmartWallet) {
        await logout();
      } else {
        await logout();
        await Promise.all(wallets.map((wallet) => wallet.disconnect()));
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, [wallets, isSmartWallet, logout]);

  useEffect(() => {
    const afterLogin = async () => {
      if (!wallet) return;

      const address = wallet.account?.address;
      if (!address) return;
      const names = await fetchNames([address]);

      if (names?.[0].length === 0) {
        navigate("/signup");
      } else {
        navigate("/workspace");
      }
    };

    afterLogin();
  }, [wallet, navigate, fetchNames]);

  return (
    <Grid gridTemplateRows="1fr auto" h="calc(100vh - 72px)">
      <Flex justifyContent="center" alignItems="center" flexWrap="wrap">
        <Box>
          <Box width="160px">
            <CommonIcon size="full" imageUrl="/images/toban-logo.svg" />
          </Box>
          <Text textAlign="center" color="gray.800" mt={5} w="100%">
            Toban -当番-
          </Text>
        </Box>
      </Flex>
      <Box mb={5}>
        {wallets.length === 0 ? (
          <BasicButton data-testid="login" onClick={connectOrCreateWallet}>
            Login
          </BasicButton>
        ) : !isSmartWallet ? (
          <BasicButton onClick={disconnectWallets}>Logout</BasicButton>
        ) : (
          <BasicButton onClick={logout}>Logout</BasicButton>
        )}
      </Box>
    </Grid>
  );
};

export default Login;
