import { ChangeEvent } from "react";

interface TextareaProps {
	value: string | number;
	onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
}

export default function Textarea({ value, onChange }: TextareaProps) {
	return (
		<textarea
			className="textarea textarea-bordered w-full"
			value={value}
			onChange={onChange}
		/>
	);
}
