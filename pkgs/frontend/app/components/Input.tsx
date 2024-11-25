import {
	Input as ChakraInput,
	InputProps as ChakraInputProps,
} from "@chakra-ui/react";

interface InputProps extends Omit<ChakraInputProps, "value"> {
	value: string | number;
	onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Input = ({ value, onChange }: InputProps) => {
	return <ChakraInput value={value} onChange={onChange} />;
};
