import {DefaultHatsDetailsSchema} from "@/types/hats";
import {VStack, Box, Text, Grid} from "@chakra-ui/react";
import Link from "next/link";
import {MyroleItem} from "./MyroleItem";
import {useParams} from "next/navigation";

interface HatListProps {
  items: {details: DefaultHatsDetailsSchema; imageURI: string; hatId: BigInt}[];
}

const HatList: React.FC<HatListProps> = ({items}) => {
  const {hatId} = useParams();
  return (
    <VStack align="start" spacing={4} mt={8}>
      <Text fontSize="2xl" fontWeight="bold">
        Your Roles
      </Text>
      <Grid templateColumns="repeat(4, 1fr)" gap={6}>
        {items.map((item) => (
          <Link href={`/${hatId}/${item.hatId.toString()}/mine`}>
            <MyroleItem details={item.details} imageUri={item.imageURI} />
          </Link>
        ))}
      </Grid>
    </VStack>
  );
};

export default HatList;
