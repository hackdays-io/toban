import { HStack, IconButton, Text } from "@chakra-ui/react";
import { useNavigate } from "@remix-run/react";
import { ReactNode, useCallback } from "react";
import { FaChevronLeft } from "react-icons/fa6";

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
  }, [backLink]);

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
      <Text>{title}</Text>
    </HStack>
  );
};
