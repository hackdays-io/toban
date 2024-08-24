"use client"; // クライアントコンポーネントとして指定

import React, {useEffect, useState} from "react";
import {
  Box,
  Button,
  Container,
  Flex,
  FormLabel,
  Heading,
  Image,
  Input,
  Spacer,
  Stack,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import {useRouter} from "next/navigation";
import {useChainId} from "wagmi";
import {ConnectButton} from "@rainbow-me/rainbowkit";
import {useHatMint, useTopHatMint} from "@/hooks";
import useHatterHatMint from "@/hooks/useHatterHatMint";
import {delay, removeTrailingN} from "@/lib/utils";
import Toaster from "@/components/Toaster";
import {Controller, useForm} from "react-hook-form";
import {uploadFileToIpfs} from "@/lib/ipfs";
import {toast} from "react-toastify";
import {useUploadHatDetail} from "@/hooks/useHatDetail";
import {useWaitForIndexGraphAPI} from "@/hooks/useHatRead";

type FormData = {
  name: string;
  description: string;
};

export default function Home() {
  const router = useRouter();

  const navigateTo = (path: string) => {
    router.push(path);
  };

  const chainId = useChainId();

  const [detailsURI, setDetailsURI] = useState<string>("");
  const [imageURI, setImageURI] = useState<string>("");
  const [topHatId, setTopHatId] = useState<bigint>(BigInt(0));
  const [hatterHatId, setHatterHatId] = useState<bigint>(BigInt(0));

  const [file, setFile] = useState<any>();

  const {uploadHatDetail} = useUploadHatDetail();

  const resTopHatMint = useTopHatMint({
    chainId,
    details: detailsURI,
    imageURI,
  });

  const resHatterHatMint = useHatterHatMint({
    chainId,
    hatId: topHatId,
  });

  const resHatMint = useHatMint({
    chainId,
    hatId: hatterHatId,
  });

  const {waitForIndexGraphAPI} = useWaitForIndexGraphAPI();

  useEffect(() => {
    const fetch = async () => {
      if (!detailsURI) return;
      const bigbang1 = await resTopHatMint.writeAsync();
      setTopHatId(bigbang1);
    };
    fetch();
  }, [detailsURI]);

  useEffect(() => {
    const fetch = async () => {
      const bigbang2 = await resHatterHatMint.writeAsync();
      setHatterHatId(bigbang2);
      console.log(`😺 HatterHat minted successfully!, hatId = ${bigbang2}`);
    };
    fetch();
  }, [topHatId]);

  useEffect(() => {
    const fetch = async () => {
      const bigbang3 = await resHatMint.writeAsync();
      console.log(`😺 HatterHat minted successfully!, amount = ${bigbang3}`);

      if (Number(bigbang3) === 1) {
        await waitForIndexGraphAPI(topHatId.toString());
        navigateTo(`/${topHatId}`);
      }
    };
    fetch();
  }, [hatterHatId]);

  const {control, handleSubmit, watch} = useForm<FormData>({
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const submit = async (data: FormData) => {
    try {
      const details = await uploadHatDetail(data.name, data.description);
      setDetailsURI(details.ipfs);
    } catch (error) {
      console.error("Failed to mint TopHat:", error);
    }
  };

  const handleFileChange = (event: any) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
  };

  useEffect(() => {
    const uploadToIpfs = async () => {
      if (!file) return;
      try {
        // IPFSにファイルを呼び出すためのメソッドを呼び出す。
        const {cid} = await uploadFileToIpfs(file);

        setImageURI(`ipfs://${cid}`);

        toast.success("🦄 file upload Success!", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
        });
      } catch (err: any) {
        console.error("error:", err);
        toast.error("file upload Failed....", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
        });
      }
    };
    uploadToIpfs();
  }, [file]);

  return (
    <Box bg="#FFFCF4" minH="100vh" position="relative" overflowX="hidden">
      {/* Background Design */}
      <Image
        src="/wave.png"
        alt="Wave Design"
        position="absolute"
        top="0"
        right="0"
        height="100%"
        objectFit="cover"
        zIndex="0"
      />

      {/* Header */}
      <Box as="header" width="100%" position="relative" height="200px">
        <Flex
          position="absolute"
          top="0"
          left="0"
          right="0"
          p="4"
          alignItems="center"
          bg="rgba(0, 0, 0, 0.5)"
        >
          <Heading size="md" color="white">
            Main Page
          </Heading>
          <Spacer />
          <ConnectButton />
        </Flex>
      </Box>

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

      <Container textAlign="center" zIndex="2" mt="100px" pb="100px">
        <form onSubmit={handleSubmit(submit)}>
          <Stack spacing={4} width="full">
            <Box>
              <FormLabel>Image</FormLabel>
              <Input
                type="file"
                onChange={handleFileChange}
                border="none"
                px={0}
                borderRadius={0}
              />
            </Box>

            <Box>
              <FormLabel>Project Name</FormLabel>
              <Controller
                control={control}
                name="name"
                render={({field}) => {
                  return (
                    <Input
                      value={field.value}
                      onChange={field.onChange}
                      variant="outline"
                      bg="white"
                    />
                  );
                }}
              />
            </Box>

            <Box>
              <FormLabel>Project Description</FormLabel>

              <Controller
                control={control}
                name="description"
                render={({field}) => {
                  return (
                    <Textarea
                      value={field.value}
                      onChange={field.onChange}
                      variant="outline"
                      bg="white"
                    />
                  );
                }}
              />
            </Box>

            <Button width="full" bg="yellow.400" size="lg" type="submit">
              Create New Project
            </Button>
          </Stack>
        </form>

        <Button
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
        </Button>
      </Container>
      <Toaster />
    </Box>
  );
}
