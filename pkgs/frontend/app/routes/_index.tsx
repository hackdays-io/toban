import { Box, Container, Heading, Image } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import CommonButton from "~/components/common/CommonButton";

export default function Index() {
  return (
    <Box py={10} overflowX="hidden" mx="-4">
      <Container>
        <Image w="200px" src="/images/toban-logo-text.svg" alt="logo" />
        <Heading as="h1" fontSize="3xl" lineHeight={1.5} mt={10}>
          いちばん簡単な
          <br />
          貢献の記録と報酬の分配
        </Heading>
        <Heading as="h2" fontSize="xl" mt={5} color="gray.500">
          Simplest way of contribution recording and rewards distribution.
        </Heading>
      </Container>

      <Box mt={5} position={"relative"}>
        <Image
          position="absolute"
          mt={20}
          ml={-20}
          w="150%"
          maxW="fit-content"
          src="/images/lp/people-deco.svg"
        />
        <Image
          ml={-20}
          w="150%"
          maxW="fit-content"
          src="/images/lp/wave-deco.svg"
        />
      </Box>

      <Container mt={3}>
        <Link to="/login">
          <CommonButton size="xl" fontWeight="bold">
            はじめる
          </CommonButton>
        </Link>
      </Container>
    </Box>
  );
}
