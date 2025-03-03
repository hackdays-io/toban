import {
  Box,
  HStack,
  Heading,
  Icon,
  List,
  Text,
  VStack,
} from "@chakra-ui/react";
import dayjs from "dayjs";
import { type FC, useMemo } from "react";
import { FaChevronLeft, FaLink } from "react-icons/fa6";
import { Link } from "react-router";
import type { HatsDetailSchama } from "types/hats";
import { ipfs2https } from "utils/ipfs";
import { abbreviateAddress } from "utils/wallet";
import { PageHeader } from "../PageHeader";
import { RoleIcon } from "../icon/RoleIcon";
import { UserIcon } from "../icon/UserIcon";

interface HolderDetailProps {
  detail?: HatsDetailSchama;
  imageUri?: string;
  treeId?: string;
  hatId?: string;
  wearerId?: string;
  wearerName?: string;
  wearerIcon?: string;
  isActive?: boolean;
  woreTime?: number;
  wearingElapsedTime?: number;
}

export const RoleName: FC<HolderDetailProps> = ({ detail, treeId }) => (
  <PageHeader
    title={
      detail?.data.name ? (
        detail.data.name
      ) : (
        <Box as="span" fontStyle="italic" color="gray.400">
          No name
        </Box>
      )
    }
  />
);

export const RoleNameWithWearer: FC<HolderDetailProps> = ({
  detail,
  wearerId,
  wearerName,
  wearerIcon,
}) => (
  <PageHeader
    title={
      detail?.data.name ? (
        <HStack>
          <Box fontWeight="bold" fontSize="lg" mr={3}>
            {detail.data.name}
          </Box>
          <UserIcon userImageUrl={ipfs2https(wearerIcon)} size={5} />
          {wearerName ? wearerName : abbreviateAddress(wearerId || "")}
        </HStack>
      ) : (
        <Box as="span" fontStyle="italic" color="gray.400">
          No name
        </Box>
      )
    }
  />
);

export const ActiveState: FC<HolderDetailProps> = ({
  isActive,
  woreTime,
  wearingElapsedTime,
}) => {
  const formattedWoreTime = useMemo(() => {
    if (!woreTime) return;
    return dayjs.unix(woreTime).format("YYYY/MM/DD");
  }, [woreTime]);

  const formattedWearingElapsedTime = useMemo(() => {
    if (!wearingElapsedTime) return;
    return Math.floor(wearingElapsedTime / 86400);
  }, [wearingElapsedTime]);

  return (
    <HStack mt={4} mb={6}>
      {isActive ? (
        <Box
          width="fit"
          paddingX={4}
          paddingY={2}
          rounded="md"
          bgColor="blue.400"
          fontWeight="medium"
          fontSize="sm"
        >
          Active
        </Box>
      ) : (
        <Box
          width="fit"
          paddingX={4}
          paddingY={2}
          rounded="md"
          bgColor="gray.200"
          fontWeight="medium"
          fontSize="sm"
        >
          Inactive
        </Box>
      )}
      <Box fontSize="sm">
        {isActive && (
          <Text>
            Activated on{" "}
            <Text as="span" fontWeight="medium">
              {formattedWoreTime}
            </Text>
          </Text>
        )}
        <Text>
          Active in{" "}
          <Text as="span" fontWeight="medium">
            {formattedWearingElapsedTime} days
          </Text>
        </Text>
      </Box>
    </HStack>
  );
};

export const HatDetail: FC<HolderDetailProps> = ({ detail, imageUri }) => (
  <Box>
    <HStack alignItems="start" my={4} columnGap={4}>
      <Box>
        <RoleIcon roleImageUrl={imageUri} size={20} />
      </Box>
      <VStack gap={4} alignItems="start">
        <Box>
          <Heading fontSize="lg">説明</Heading>

          <Text fontSize="sm" color="gray.600">
            {detail?.data.description ? (
              detail.data.description
            ) : (
              <Text as="span" fontStyle="italic" color="gray.400" fontSize="md">
                No responsibilities
              </Text>
            )}
          </Text>
        </Box>

        <Box>
          <Heading fontSize="lg">役割</Heading>
          {(detail?.data.responsabilities?.length ?? 0) > 0 ? (
            <List.Root pl={5} listStyle="disc">
              {detail?.data.responsabilities?.map((r) => (
                <List.Item key={r.label}>
                  <Text fontWeight="bold">{r.label}</Text>
                  <Text fontSize="sm">{r.description}</Text>
                  {r.link && (
                    <Box fontSize="sm" as="span" color="blue.500">
                      <Link target="_blank" to={r.link}>
                        リンク
                      </Link>
                    </Box>
                  )}
                </List.Item>
              ))}
            </List.Root>
          ) : (
            <Text fontStyle="italic" color="gray.400" fontSize="md">
              No responsibilities
            </Text>
          )}
        </Box>

        <Box>
          <Heading fontSize="lg">権限</Heading>
          {(detail?.data.authorities?.length ?? 0) > 0 ? (
            <List.Root pl={5} listStyle="disc">
              {detail?.data.authorities?.map((a) => (
                <List.Item key={a.label}>
                  <Text fontWeight="bold">{a.label}</Text>
                  <Text fontSize="sm">{a.description}</Text>
                  {a.link && (
                    <Box fontSize="sm" as="span" color="blue.500">
                      <Link target="_blank" to={a.link}>
                        リンク
                      </Link>
                    </Box>
                  )}
                </List.Item>
              ))}
            </List.Root>
          ) : (
            <Text fontStyle="italic" color="gray.400" fontSize="md">
              No authorities
            </Text>
          )}
        </Box>
      </VStack>
    </HStack>
  </Box>
);
