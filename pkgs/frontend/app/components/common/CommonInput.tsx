import { Input, InputProps } from "@chakra-ui/react";

interface CommonInputProps extends Omit<InputProps, "value"> {
  value: string | number;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const CommonInput = ({
  value,
  placeholder,
  onChange,
}: CommonInputProps) => {
  return (
    <Input
      value={value}
      placeholder={placeholder}
      width="100%"
      onChange={onChange}
      borderColor="gray.800"
    />
  );
};
