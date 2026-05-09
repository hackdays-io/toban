import { type ReactNode, useCallback } from "react";
import { FaChevronLeft } from "react-icons/fa6";
import { useNavigate } from "react-router";
import { Box, HStack, IconButton } from "~/components/chakra-shim";

interface Props {
  title: string | ReactNode;
  backLink?: string | (() => void);
}

export const PageHeader: React.FC<Props> = ({ title, backLink }) => {
  const navigate = useNavigate();

  const handleBack = useCallback(() => {
    if (backLink && typeof backLink === "string") {
      navigate(backLink);
    } else if (backLink && typeof backLink === "function") {
      backLink();
    } else {
      navigate(-1);
    }
  }, [backLink, navigate]);

  return (
    <HStack>
      <IconButton
        size="sm"
        onClick={handleBack}
        bgColor="transparent"
        color="black"
      >
        <FaChevronLeft />
      </IconButton>
      <Box>{title}</Box>
    </HStack>
  );
};
