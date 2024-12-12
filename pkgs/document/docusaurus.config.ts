import type * as Preset from "@docusaurus/preset-classic";
import type { Config } from "@docusaurus/types";
import { themes as prismThemes } from "prism-react-renderer";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
	title: "Toban",
	tagline: "Toban",
	favicon: "img/toban-logo.svg",

	// Set the production url of your site here
	url: "https://hackdays-io.github.io",
	// Set the /<baseUrl>/ pathname under which your site is served
	// For GitHub pages deployment, it is often '/<projectName>/'
	baseUrl: "/toban",

	// GitHub pages deployment config.
	// If you aren't using GitHub pages, you don't need these.
	organizationName: "hackdays-io", // Usually your GitHub org/user name.
	projectName: "toban", // Usually your repo name.

	onBrokenLinks: "throw",
	onBrokenMarkdownLinks: "warn",

	// Even if you don't use internationalization, you can use this field to set
	// useful metadata like html lang. For example, if your site is Chinese, you
	// may want to replace "en" with "zh-Hans".
	i18n: {
		defaultLocale: "en",
		locales: ["en", "ja"],
	},

	presets: [
		[
			"classic",
			{
				docs: {
					sidebarPath: "./sidebars.ts",
					// Please change this to your repo.
					// Remove this to remove the "edit this page" links.
					editUrl: "https://github.com/hackdays-io/toban",
					remarkPlugins: [remarkMath],
					rehypePlugins: [rehypeKatex],
				},
				theme: {
					customCss: "./src/css/custom.css",
				},
			} satisfies Preset.Options,
		],
	],
	stylesheets: [
		{
			href: "https://cdn.jsdelivr.net/npm/katex@0.13.24/dist/katex.min.css",
			type: "text/css",
			integrity:
				"sha384-odtC+0UGzzFL/6PNoE8rX/SPcQDXBJ+uRepguP4QkPCm2LBxH3FA3y+fKSiJ+AmM",
			crossorigin: "anonymous",
		},
	],
	themeConfig: {
		// Replace with your project's social card
		image: "img/toban-logo.svg",
		navbar: {
			title: "Toban",
			logo: {
				alt: "Toban Logo",
				src: "img/toban-logo.svg",
			},
			items: [
				{
					to: "/docs/welcome",
					label: "Docs",
					position: "left",
				},
				{
					href: "https://github.com/hackdays-io/toban",
					label: "GitHub",
					position: "right",
				},
			],
		},
		footer: {
			style: "dark",
			links: [
				{
					title: "Docs",
					items: [
						{
							label: "Docs",
							to: "/docs/welcome",
						},
					],
				},
				{
					title: "Community",
					items: [
						{
							label: "X",
							href: "https://x.com/0xtoban",
						},
					],
				},
				{
					title: "More",
					items: [
						{
							label: "GitHub",
							href: "https://github.com/hackdays-io/toban",
						},
					],
				},
			],
			copyright: `Copyright © ${new Date().getFullYear()} Toban, Inc. Built with Docusaurus.`,
		},
		prism: {
			theme: prismThemes.github,
			darkTheme: prismThemes.dracula,
		},
	} satisfies Preset.ThemeConfig,
};

export default config;
