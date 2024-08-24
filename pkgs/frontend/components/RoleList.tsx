import {AddIcon} from "@chakra-ui/icons";
import {Box, Grid, IconButton, Text} from "@chakra-ui/react";
import Image from "next/image";
import Link from "next/link";

interface RoleListProps {
  hatId: string;
  roles: {name: string; icon: JSX.Element | string; href: string}[];
}

const RoleList: React.FC<RoleListProps> = ({hatId, roles}: any) => {
  return (
    <Box mt={8}>
      <Grid templateColumns="repeat(4, 1fr)" gap={6}>
        {roles.map((role: any) => (
          <Link key={role.name} href={role.href}>
            <Box textAlign="center">
              <Box as="span" fontSize="2xl" mb={2}>
                <Image src={role.icon} width={50} height={50} alt="role" />
              </Box>
              <Text>{role.name}</Text>
            </Box>
          </Link>
        ))}
        <Link href={`/${hatId}/createrole`}>
          <IconButton aria-label="Roleを追加" icon={<AddIcon />} />
        </Link>
      </Grid>
    </Box>
  );
};

export default RoleList;
