import { Box, Grid, GridItem, Icon, IconButton } from "@chakra-ui/react";
import { Link, useParams } from "@remix-run/react";
import type { FC } from "react";
import { GoHomeFill } from "react-icons/go";
import { MdCallSplit } from "react-icons/md";
import { RiTeamFill } from "react-icons/ri";

export const StickyNav: FC = () => {
  const { treeId } = useParams();
  return (
    <>
      <Box w="100%" h="80px" />
      <Box
        position="fixed"
        bottom={0}
        left={0}
        bg="offwhite.400"
        color="blue.500"
        width="100%"
        zIndex={100}
      >
        <Grid
          gridTemplateColumns="1fr 1fr 1fr"
          maxW="430px"
          width="100%"
          m="0 auto"
          borderTop="3px solid"
          borderColor="blackAlpha.200"
          py={2}
          bg="#fffdf8"
        >
          <GridItem textAlign="center">
            <Link to={`/${treeId}`}>
              <IconButton backgroundColor="transparent" color="blue.500">
                <Icon fontSize={30}>
                  <GoHomeFill />
                </Icon>
              </IconButton>
              <Box fontWeight="bold" fontSize="sm">
                Home
              </Box>
            </Link>
          </GridItem>

          <GridItem textAlign="center">
            <Link to={`/${treeId}/member`}>
              <IconButton backgroundColor="transparent" color="blue.500">
                <Icon fontSize={30}>
                  <RiTeamFill />
                </Icon>
              </IconButton>
              <Box fontWeight="bold" fontSize="sm">
                Member
              </Box>
            </Link>
          </GridItem>

          <GridItem textAlign="center">
            <Link to={`/${treeId}/splits`}>
              <IconButton backgroundColor="transparent" color="blue.500">
                <Icon fontSize={30}>
                  <MdCallSplit size="30px" />
                </Icon>
              </IconButton>
              <Box fontWeight="bold" fontSize="sm">
                Splits
              </Box>
            </Link>
          </GridItem>
        </Grid>
      </Box>
    </>
  );
};
