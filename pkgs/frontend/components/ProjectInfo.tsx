import {Box, Flex, Text, Icon, VStack} from "@chakra-ui/react";
import Link from "next/link";
import {useParams} from "next/navigation";
import {FaUserFriends} from "react-icons/fa";
import {IoMdArrowRoundForward} from "react-icons/io";

interface ProjectInfoProps {
  members: number;
  splitters: number;
  projectName?: string;
  projectDescription?: string;
}

const ProjectInfo: React.FC<ProjectInfoProps> = ({
  members,
  splitters,
  projectName,
  projectDescription,
}) => {
  const {hatId} = useParams();

  return (
    <VStack align="start" spacing={4}>
      <Text fontSize="2xl" fontWeight="bold">
        {projectName}
      </Text>
      <Text>{projectDescription}</Text>
      <Flex align="center">
        <Icon as={FaUserFriends} w={6} h={6} mr={2} />
        <Text>{members} members</Text>
      </Flex>
      <Flex align="center">
        <Icon as={IoMdArrowRoundForward} w={6} h={6} mr={2} />
        <Link href={`/${hatId}/createsplit`}>
          <Text>{splitters} Splitter</Text>
        </Link>
      </Flex>
    </VStack>
  );
};

export default ProjectInfo;
