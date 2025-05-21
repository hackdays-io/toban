import { type BoxProps, NumberInput } from "@chakra-ui/react";

export const InputNumber = ({
  number,
  setNumber,
  defaultValue,
  ...boxProps
}: {
  number: number | undefined;
  setNumber: (value: number | undefined) => void;
  defaultValue?: number;
} & BoxProps) => {
  return (
    <NumberInput.Root
      w="100%"
      {...boxProps}
      value={String(number)}
      onValueChange={(e) => setNumber(Number(e.value))}
      defaultValue={String(defaultValue)}
      min={1}
      formatOptions={{}}
      allowMouseWheel
      borderColor="gray.800"
      borderRadius="3xl"
      backgroundColor="white"
      inputMode="numeric"
    >
      <NumberInput.Input
        minHeight="45px"
        textAlign="right"
        paddingRight="2.5rem"
      />
      <NumberInput.Control>
        <NumberInput.IncrementTrigger />
        <NumberInput.DecrementTrigger />
      </NumberInput.Control>
    </NumberInput.Root>
  );
};
