import { Box, Input, Text } from "@chakra-ui/react";
import { HiOutlinePlus } from "react-icons/hi2";
import { CommonIcon } from "../common/CommonIcon";

const EmptyImage = () => {
  return (
    <Box
      borderRadius="3xl"
      border="1px solid"
      borderColor="#1e1e1e"
      bg="#e9ecef"
      p={5}
      w={200}
      h={200}
    >
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        w="33%"
        mx="auto"
        mt={9}
        mb={1}
      >
        <HiOutlinePlus size="full" />
      </Box>
      <Text textAlign="center">画像を選択</Text>
    </Box>
  );
};

export const InputImage = ({
  imageFile,
  setImageFile,
  previousImageUrl,
}: {
  imageFile: File | string | undefined | null;
  setImageFile: (file: File | null) => void;
  previousImageUrl?: string;
}) => {
  const imageUrl = imageFile
    ? typeof imageFile === "string"
      ? imageFile
      : URL.createObjectURL(imageFile)
    : previousImageUrl
      ? previousImageUrl
      : undefined;

  return (
    <Box as="label" cursor="pointer">
      <Input
        type="file"
        accept="image/*"
        display="none"
        data-testid="file-input"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file?.type?.startsWith("image/")) {
            setImageFile(file);
          } else {
            alert("画像ファイルを選択してください");
          }
        }}
      />
      <CommonIcon
        imageUrl={imageUrl}
        fallbackIconComponent={<EmptyImage />}
        size={200}
        borderRadius="3xl"
      />
    </Box>
  );
};
