import { Box, Text } from "@chakra-ui/react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useNavigate } from "@remix-run/react";
import { FC, useCallback, useEffect } from "react";
import { BottomMainButton } from "~/components/BottomMainButton";
import { CommonIcon } from "~/components/common/CommonIcon";
import { FloatBottom } from "~/components/FloatBottom";
import { FloatCenter } from "~/components/FloatCenter";

const Login: FC = () => {
  const navigate = useNavigate();
  const { connectOrCreateWallet, user, logout } = usePrivy();
  const { wallets } = useWallets();

  const tobanEnsFound = false;

  // ToDo：Metamask、Privyアカウント、どちらともディスコネクトできないので修正する
  const disconnectWallets = useCallback(async () => {
    await Promise.all(wallets.map((wallet) => wallet.disconnect()));
  }, [wallets]);

  useEffect(() => {
    if (wallets.length > 0 && !tobanEnsFound) {
      navigate("/signup");
    }
  }, [wallets.length, tobanEnsFound, navigate]);

  return (
    <>
      <FloatCenter>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          width="67%"
        >
          <CommonIcon
            size="full"
            imageUrl="https://pbs.twimg.com/profile_images/1839947470035660800/ynSrN1xU_400x400.jpg"
          />
        </Box>
        <Text textAlign="center" color="gray.800" mt="0.5vh">
          Toban -当番-
        </Text>
      </FloatCenter>
      <FloatBottom>
        {wallets.length === 0 ? (
          <BottomMainButton onClick={connectOrCreateWallet}>
            Login
          </BottomMainButton>
        ) : !user ? (
          <BottomMainButton onClick={disconnectWallets}>
            Logout
          </BottomMainButton>
        ) : (
          <BottomMainButton onClick={logout}>Logout</BottomMainButton>
        )}
      </FloatBottom>
    </>
  );
};

export default Login;
