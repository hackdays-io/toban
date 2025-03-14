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
  const { connectOrCreateWallet, logout } = usePrivy();
  const { wallets } = useWallets();
  const { wallet, isSmartWallet } = useActiveWallet();
  const { fetchNames } = useNamesByAddresses();

  // ToDo：Metamask、Privyアカウント、どちらともディスコネクトできないので修正する
  const disconnectWallets = useCallback(async () => {
    if (wallets.length === 0) return;
    if (isSmartWallet) {
      logout();
    } else {
      Promise.all(wallets.map((wallet) => wallet.disconnect()));
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
          <BasicButton onClick={connectOrCreateWallet}>Login</BasicButton>
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
