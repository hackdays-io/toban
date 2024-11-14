import { ChangeEvent } from "react";

interface InputProps {
	value: string | number;
	onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export default function Input({ value, onChange }: InputProps) {
	return (
		<input
			className="input input-bordered w-full"
			value={value}
			onChange={onChange}
		/>
	);
}
