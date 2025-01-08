import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";

/**
 * Top Page Component
 * @returns
 */
export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout title={`${siteConfig.title}`} description="This is a Toban Docs">
      <main>
        <article>
          <img src="img/banner.png" />
        </article>
      </main>
    </Layout>
  );
}
