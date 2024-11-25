import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";

/**
 * Top Page Component
 * @returns
 */
export default function Home(): JSX.Element {
	const { siteConfig } = useDocusaurusContext();
	return (
		<Layout
			title={`${siteConfig.title} Whitepaper`}
			description="This is a Toban Whitepaper"
		>
			<main>
				<img src="img/banner.png" />
			</main>
		</Layout>
	);
}
