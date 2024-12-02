import { Input, InputProps } from "@chakra-ui/react";

interface CommonInputProps extends Omit<InputProps, "value"> {
  value: string | number;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const CommonInput = ({ value, onChange }: CommonInputProps) => {
  return <Input value={value} onChange={onChange} />;
};
