import { AddIcon } from '@chakra-ui/icons';
import { Box, Grid, IconButton, Text } from '@chakra-ui/react';
import Link from 'next/link';

interface RoleListProps {
  roles: { name: string; icon: JSX.Element; href: string }[];
}

const RoleList: React.FC<RoleListProps> = ({ roles }: any) => {
  return (
    <Box mt={8}>
      <Grid templateColumns="repeat(4, 1fr)" gap={6}>
        {roles.map((role: any) => (
          <Link key={role.name} href={role.href}>
            <Box textAlign="center">
              <Box as="span" fontSize="2xl" mb={2}>
                {role.icon}
              </Box>
              <Text>{role.name}</Text>
            </Box>
          </Link>
        ))}
        <IconButton aria-label="Roleを追加" icon={<AddIcon />} />
      </Grid>
    </Box>
  );
};

export default RoleList;
