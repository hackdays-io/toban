import { Box, Text, Image, Badge } from "@chakra-ui/react";

const RoleCard = () => {
  return (
    <Box 
      p={5} 
      shadow="md" 
      borderWidth="1px" 
      borderRadius="lg"
      maxW="sm"
      bg="yellow.100"
    >
      <Badge colorScheme="green" mb={2}>Active</Badge>
      <Image 
        borderRadius="full" 
        boxSize="100px" 
        src="/path_to_your_image.png" 
        alt="Role Image"
        mx="auto"
      />
      <Text mt={4} fontWeight="bold" fontSize="xl">Cleaning</Text>
      <Text fontSize="sm">2024/5/11 ~ 2024/7/12</Text>
      <Text mt={2}>
        Lorem Ipsum is simply dummy text of the printing and typesetting industry.
      </Text>
      <Box mt={4}>
        <Text fontWeight="bold" fontSize="md">Work Scope</Text>
        <ul>
          <li>Cleaning public spaces</li>
          <li>Planning cleaning challenge</li>
          <li>Responsible for cleaning</li>
        </ul>
      </Box>
    </Box>
  );
};

export default RoleCard;
