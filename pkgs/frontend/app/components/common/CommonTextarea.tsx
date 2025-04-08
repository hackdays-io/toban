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
  ...props
}: CommonTextAreaProps) => {
  return (
    <Textarea
      placeholder={placeholder}
      width="100%"
      minHeight={minHeight}
      borderColor="gray.800"
      borderRadius="xl"
      backgroundColor="white"
      {...props}
      value={value}
      onChange={onChange}
    />
  );
};
