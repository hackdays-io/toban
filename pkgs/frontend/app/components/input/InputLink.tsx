import { Box, type BoxProps } from "@chakra-ui/react";
import { CommonInput } from "../common/CommonInput";

interface InputLinkProps extends BoxProps {
  link: string;
  setLink: (link: string) => void;
}

export const InputLink = ({ link, setLink, ...boxProps }: InputLinkProps) => {
  return (
    <Box w="100%" {...boxProps}>
      <CommonInput
        minHeight="45px"
        placeholder="Link"
        value={link}
        onChange={(e) => setLink(e.target.value)}
      />
    </Box>
  );
};
