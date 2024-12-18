import { Input, InputProps } from "@chakra-ui/react";

interface CommonInputProps extends Omit<InputProps, "value"> {
  value: string | number;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const CommonInput = ({
  value,
  placeholder,
  onChange,
  ...props
}: CommonInputProps) => {
  return (
    <Input
      placeholder={placeholder}
      width="100%"
      borderColor="gray.800"
      backgroundColor="white"
      {...props}
      value={value}
      onChange={onChange}
    />
  );
};
