import { usePrivy, useWallets } from "@privy-io/react-auth";
import { FC, useCallback } from "react";
import CommonButton from "~/components/CommonButton";

const Login: FC = () => {
	const { connectOrCreateWallet, user, logout } = usePrivy();
	const { wallets } = useWallets();

	const disconnectWallets = useCallback(async () => {
		await Promise.all(wallets.map((wallet) => wallet.disconnect()));
	}, [wallets]);

	return (
		<>
			<CommonButton onClick={connectOrCreateWallet} bgColor="red.300">
				login
			</CommonButton>

			{wallets.length > 0 && (
				<CommonButton onClick={disconnectWallets} bgColor="red.300">
					disconnect
				</CommonButton>
			)}
			{user ? (
				<CommonButton onClick={logout} bgColor="red.300">
					logout
				</CommonButton>
			) : (
				<></>
			)}
		</>
	);
};

export default Login;
