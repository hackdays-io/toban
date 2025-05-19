import { NumberInput, type BoxProps } from "@chakra-ui/react";

type ValueChangeDetails = { value: number; valueAsString: string };

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
      value={number}
      onValueChange={(e: ValueChangeDetails) => setNumber(e.value)}
      defaultValue={defaultValue}
      min={1}
      precision={0}
      formatOptions={{}}
      allowMouseWheel
      borderColor="gray.800"
      borderRadius="3xl"
      backgroundColor="white"
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
