import { Box, Text } from "@chakra-ui/react";
import type { FC } from "react";
import { ContentContainer } from "~/components/ContentContainer";

const MemberProfile: FC = () => {
  return (
    <>
      <Box mt={5} w="100%">
        <Text fontSize="lg">メンバープロフィール</Text>
        <ContentContainer>
          <Box>contents</Box>
        </ContentContainer>
      </Box>
    </>
  );
};

export default MemberProfile;
