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
  ...rest
}) => {
  return (
    <Input
      value={value}
      placeholder={placeholder}
      width="100%"
      minHeight={minHeight}
      onChange={onChange}
      {...rest}
      borderColor="gray.800"
      borderRadius="xl"
      backgroundColor="white"
    />
  );
};
