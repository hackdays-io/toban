import { Textarea, TextareaProps } from "@chakra-ui/react";

interface CommonTextAreaProps extends Omit<TextareaProps, "value"> {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export const CommonTextArea = ({ value, onChange }: CommonTextAreaProps) => {
  return <Textarea value={value} onChange={onChange} />;
};
