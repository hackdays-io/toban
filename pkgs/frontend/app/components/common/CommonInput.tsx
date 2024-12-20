import { Input, InputProps } from "@chakra-ui/react";
import { FC } from "react";

interface CommonInputProps extends Omit<InputProps, "value"> {
  minHeight?: string;
  value: string | number;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const CommonInput: FC<CommonInputProps> = ({
  minHeight,
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
      borderRadius="xl"
      backgroundColor="white"
      {...props}
      value={value}
      onChange={onChange}
    />
  );
};
