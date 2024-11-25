import {
	Textarea as ChakraTextarea,
	TextareaProps as ChakraTextareaProps,
} from "@chakra-ui/react";

interface TextAreaProps extends Omit<ChakraTextareaProps, "value"> {
	value: string;
	onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export const TextArea = ({ value, onChange }: TextAreaProps) => {
	return <ChakraTextarea value={value} onChange={onChange} />;
};
