import { VStack, Box, Text } from '@chakra-ui/react';
import Link from 'next/link';

interface HatListProps {
  hats: { name: string; href: string }[];
}

const HatList: React.FC<HatListProps> = ({ hats }) => {
  return (
    <VStack align="start" spacing={4} mt={8}>
      <Text fontSize="2xl" fontWeight="bold">
        Your Hats
      </Text>
      {hats.map((hat) => (
        <Link key={hat.name} href={hat.href}>
          <Box>{hat.name}</Box>
        </Link>
      ))}
    </VStack>
  );
};

export default HatList;
