import { Box, Text, Float } from "@chakra-ui/react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useFetcher, useNavigate } from "@remix-run/react";
import { useNamesByAddresses } from "hooks/useENS";
import { useActiveWallet } from "hooks/useWallet";
import { FC, useCallback, useEffect } from "react";
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
  }, [wallets, isSmartWallet]);

  useEffect(() => {
    const afterLogin = async () => {
      if (!wallet) return;

      const names = await fetchNames([wallet.account?.address!]);

      if (names?.[0].length === 0) {
        navigate("/signup");
      } else {
        navigate("/workspace");
      }
    };

    afterLogin();
  }, [wallet, navigate]);

  return (
    <>
      <Float
        placement="middle-center"
        width="100%"
        display="flex"
        flexDirection="column"
        alignItems="center"
      >
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          width="160px"
        >
          <CommonIcon size="full" imageUrl="/images/toban-logo.svg" />
        </Box>
        <Text textAlign="center" color="gray.800" mt={5}>
          Toban -当番-
        </Text>
      </Float>
      <Float
        placement="bottom-center"
        mb="4vh"
        width="100%"
        display="flex"
        flexDirection="column"
        alignItems="center"
      >
        {wallets.length === 0 ? (
          <BasicButton onClick={connectOrCreateWallet}>Login</BasicButton>
        ) : !isSmartWallet ? (
          <BasicButton onClick={disconnectWallets}>Logout</BasicButton>
        ) : (
          <BasicButton onClick={logout}>Logout</BasicButton>
        )}
      </Float>
    </>
  );
};

export default Login;
