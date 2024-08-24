"use client";

import Toaster from "@/components/Toaster";
import {
  Box,
  Button,
  Container,
  Heading,
  Image,
  Stack,
  Text,
  FormLabel,
  Input,
  Textarea,
} from "@chakra-ui/react";
import {useRouter} from "next/navigation"; // useRouter をインポート
import Header from "@/components/Header";
import {Controller, useForm} from "react-hook-form";

type FormData = {
  name: string;
  description: string;
};

export default function Home() {
  const router = useRouter(); // useRouter フックを使用

  const {control, handleSubmit} = useForm<FormData>({
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const submit = async (data: FormData) => {
    try {
      console.log("Submitted Data:", data);
    } catch (error) {
      console.error("Failed to submit form:", error);
    }
  };

  const navigateTo = (path: string) => {
    router.push(path); // ページ遷移用の navigateTo 関数を定義
  };

  return (
    <Box bg="#FFFCF4" minH="100vh" position="relative" overflowX="hidden">
      {/* Background Design */}
      <Image
        src="/wave.png"
        alt="Wave Design"
        position="absolute"
        top="0"
        right="0"
        width="60%"
        height="100%"
        objectFit="cover"
        zIndex="0"
      />

      {/* Header */}
      <Header />

      {/* Main Content */}
      <Box textAlign="left" mt="10" zIndex="2" ml="10%">
        <Image
          src="/toban_logo_color_middle.png"
          alt="Toban Logo Middle"
          height="100px"
          width="auto"
          objectFit="contain"
          mb="4"
        />
        <Heading size="lg" color="#333" mb={2} zIndex={1} position="relative">
          いちばん簡単な貢献の記録と報酬の分配
        </Heading>
        <Text fontSize="md" color="#555" mb={10}>
          Simplest way to contribution recording and rewards distribution
        </Text>
      </Box>

      <Box position="relative" zIndex="1" mt="50px">
        <Image
          src="/obi.png"
          alt="Background Design"
          width="100%"
          height="auto"
          objectFit="contain"
          zIndex="1"
        />
      </Box>

      <Container textAlign="center" zIndex="2" mt="50px" pb="100px">
        <form onSubmit={handleSubmit(submit)}>
          <Stack spacing={4} width="full">
            <Box>
              <FormLabel>Image</FormLabel>
              <Controller
                control={control}
                name="name"
                render={({field}) => (
                  <Input
                    value={field.value}
                    onChange={field.onChange}
                    variant="outline"
                    bg="white"
                  />
                )}
              />
            </Box>

            <Box>
              <FormLabel>Project Name</FormLabel>
              <Controller
                control={control}
                name="description"
                render={({field}) => (
                  <Textarea
                    value={field.value}
                    onChange={field.onChange}
                    variant="outline"
                    bg="white"
                  />
                )}
              />
            </Box>

            <Button
              mt={10}
              width="full"
              bg="yellow.400"
              size="lg"
              type="submit"
            >
              Create New Project
            </Button>
          </Stack>
        </form>

        {/* ページ遷移用のボタン */}
        {/* <Button
          width="full"
          bg="black"
          color="white"
          size="lg"
          onClick={() => navigateTo("/ProjectTop")}
        >
          ProjectTop
        </Button>
        <Button
          width="full"
          bg="yellow.400"
          color="black"
          size="lg"
          onClick={() => navigateTo("/CreateRole")}
        >
          CreateRole
        </Button>
        <Button
          width="full"
          bg="blue.400"
          color="white"
          size="lg"
          onClick={() => navigateTo("/NewRoleGranted")}
        >
          NewRoleGranted
        </Button>
        <Button
          width="full"
          bg="orange.400"
          color="black"
          size="lg"
          onClick={() => navigateTo("/SendToken")}
        >
          SendToken
        </Button>
        <Button
          width="full"
          bg="green.400"
          color="black"
          size="lg"
          onClick={() => navigateTo("/SplitterCreation")}
        >
          SplitterCreation
        </Button> */}
      </Container>
      <Toaster />
    </Box>
  );
}
