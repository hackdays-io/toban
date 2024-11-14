import type { MetaFunction } from "@remix-run/node";
import Input from "~/components/Input";
import { useState } from "react";
import Textarea from "~/components/Textarea";

export const meta: MetaFunction = () => {
	return [
		{ title: "New Remix App" },
		{ name: "description", content: "Welcome to Remix!" },
	];
};

export default function Index() {
	const [inputValue, setInputValue] = useState("foo");
	const [textareaValue, setTextareaValue] = useState("bar");

	return (
		<>
			<button className="btn rounded">
				<span className="loading loading-spinner" />
			</button>
			<Input
				value={inputValue}
				onChange={(e) => setInputValue(e.target.value)}
			/>
			<Textarea
				value={textareaValue}
				onChange={(e) => setTextareaValue(e.target.value)}
			/>
		</>
	);
}
