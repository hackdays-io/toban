import { Textarea, type TextareaProps } from "@chakra-ui/react";

interface CommonTextAreaProps extends Omit<TextareaProps, "value"> {
  minHeight?: TextareaProps["minHeight"];
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export const CommonTextArea = ({
  minHeight,
  value,
  placeholder,
  onChange,
}: CommonTextAreaProps) => {
  return (
    <Textarea
      value={value}
      placeholder={placeholder}
      width="100%"
      minHeight={minHeight}
      onChange={onChange}
      borderColor="gray.800"
      borderRadius="xl"
      backgroundColor="white"
    />
  );
};
