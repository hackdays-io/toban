import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
	return [
		{ title: "New Remix App" },
		{ name: "description", content: "Welcome to Remix!" },
	];
};

export default function Index() {
	return (
		<>
			<button className="btn rounded">
				<span className="loading loading-spinner" />
			</button>
		</>
	);
}
