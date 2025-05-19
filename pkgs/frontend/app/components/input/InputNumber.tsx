import { Box, type BoxProps } from "@chakra-ui/react";
import { CommonInput } from "../common/CommonInput";

export const InputNumber = ({
  number,
  setNumber,
  ...boxProps
}: {
  number: number | undefined;
  setNumber: (number: number | undefined) => void;
  placeholder?: string;
} & BoxProps) => {
  return (
    <Box w="100%" {...boxProps}>
      <CommonInput
        minHeight="45px"
        value={number}
        onChange={(e) => {
          const value = e.target.value;
          if (value === undefined) {
            setNumber(undefined);
          } else {
            // Try to parse as an integer
            const intVal = Number.parseInt(value, 10);

            // Check if it's a positive integer and the parsed value matches the input string
            // (to prevent things like "1.2" being parsed as 1, or "1abc" as 1)
            if (
              !Number.isNaN(intVal) &&
              intVal.toString() === value &&
              intVal > 0
            ) {
              setNumber(intVal);
            } else if (value === "") {
              // This case is already handled by the outer if, but kept for clarity during refactor
              setNumber("");
            }
            // If not a valid positive integer string (e.g., "abc", "1.2", "-5", "0"),
            // do nothing, effectively rejecting the invalid input.
            // This allows the user to type, but only valid positive integers will update the state.
          }
        }}
        type="number"
        w="100%"
      />
    </Box>
  );
};
