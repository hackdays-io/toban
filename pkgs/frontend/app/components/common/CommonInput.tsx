import { Input, type InputProps } from "@chakra-ui/react";
import type { FC } from "react";

interface CommonInputProps extends Omit<InputProps, "value"> {
  minHeight?: InputProps["minHeight"];
  value: string | number;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
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
      minHeight={minHeight}
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
