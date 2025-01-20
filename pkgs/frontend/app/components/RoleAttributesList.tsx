import { Box, Text } from "@chakra-ui/react";
import type { FC } from "react";
import type { HatsDetailsAttributes } from "types/hats";
import { EditRoleAttributeDialog } from "~/components/roleAttributeDialog/EditRoleAttributeDialog";

export const RoleAttributesList: FC<{
  items: HatsDetailsAttributes;
  setItems: (value: HatsDetailsAttributes) => void;
}> = ({ items, setItems }) => {
  return (
    <Box w="100%" mt={2}>
      {items.map((item, index) => (
        <Box
          key={`${item.label}-${index}`}
          minHeight="45px"
          mt={2}
          width="100%"
          border="1px solid"
          borderColor="gray.800"
          borderRadius="xl"
          backgroundColor="white"
          py="auto"
          display="flex"
          alignItems="stretch"
          justifyContent="space-between"
          gap={4}
          fontWeight="normal"
        >
          <Text ml={4} display="flex" alignItems="center">
            {items[index]?.label}
          </Text>
          <Box ml="auto" display="flex" alignItems="center">
            <EditRoleAttributeDialog
              type="responsibility"
              attributes={items}
              setAttributes={setItems}
              attributeIndex={index}
            />
          </Box>
        </Box>
      ))}
    </Box>
  );
};
