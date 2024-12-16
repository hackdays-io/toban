import { Input, InputProps } from "@chakra-ui/react";

interface CommonInputProps extends Omit<InputProps, "value"> {
  minHeight?: string;
  value: string | number;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const CommonInput = ({
  minHeight,
  value,
  placeholder,
  onChange,
}: CommonInputProps) => {
  return (
    <Input
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
