import type { MetaFunction } from "@remix-run/node";
import Input from "~/components/Input";
import { useState } from "react";

export const meta: MetaFunction = () => {
	return [
		{ title: "New Remix App" },
		{ name: "description", content: "Welcome to Remix!" },
	];
};

export default function Index() {
	const [inputValue, setInputValue] = useState("foo");

	return (
		<>
			<button className="btn rounded">
				<span className="loading loading-spinner" />
			</button>
			<Input
				value={inputValue}
				onChange={(e) => setInputValue(e.target.value)}
			/>
		</>
	);
}
