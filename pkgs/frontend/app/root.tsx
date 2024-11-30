import { withEmotionCache } from "@emotion/react";
import {
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from "@remix-run/react";
import { ThemeProvider } from "next-themes";
import { ChakraProvider } from "./components/chakra-provider";
import { useInjectStyles } from "./emotion/emotion-client";
import { PrivyProvider } from "@privy-io/react-auth";

interface LayoutProps extends React.PropsWithChildren {}

export const Layout = withEmotionCache((props: LayoutProps, cache) => {
	const { children } = props;

	useInjectStyles(cache);

	return (
		<html lang="en">
			<head suppressHydrationWarning>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
				<meta
					name="emotion-insertion-point"
					content="emotion-insertion-point"
				/>
			</head>
			<body>
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
});

export default function App() {
	return (
		<PrivyProvider
			appId={import.meta.env.VITE_PRIVY_APP_ID}
			config={{
				embeddedWallets: {
					createOnLogin: "users-without-wallets",
				},
			}}
		>
			<ChakraProvider>
				<ThemeProvider disableTransitionOnChange attribute="class">
					<Outlet />
				</ThemeProvider>
			</ChakraProvider>
		</PrivyProvider>
	);
}
