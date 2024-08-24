import {Box, Grid, Text} from "@chakra-ui/react";
import Image from "next/image";
import {FC, useMemo} from "react";

type Props = {
  details: any;
  imageUri: string;
};

export const MyroleItem: FC<Props> = ({details, imageUri}) => {
  const pinataImageUri = useMemo(() => {
    return imageUri?.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
  }, [imageUri]);

  return (
    <Box textAlign="center">
      <Box as="span" fontSize="2xl" mb={2}>
        <Image
          style={{borderRadius: "5px"}}
          src={pinataImageUri}
          width={100}
          height={100}
          alt="role"
        />
      </Box>
      <Text mt={2} fontSize="xs">
        {details?.parsedData.data?.name}
      </Text>
    </Box>
  );
};
