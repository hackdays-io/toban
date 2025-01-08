import { Box, Button, VStack } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import type { HatsDetailsAttributes } from "types/hats";
import { InputDescription } from "../input/InputDescription";
import { InputLink } from "../input/InputLink";
import { InputName } from "../input/InputName";
import {
  DialogActionTrigger,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "../ui/dialog";

const BUTTON_TEXT_MAP = {
  add: "Add",
  edit: "Save",
} as const;

const DIALOG_TITLE_MAP = {
  responsibility: {
    add: "Add a responsibility",
    edit: "Edit responsibility",
  },
  authority: {
    add: "Add an authority",
    edit: "Edit authority",
  },
} as const;

type RoleAttribute = HatsDetailsAttributes[number];

interface BaseRoleAttributeDialogProps {
  attribute?: RoleAttribute;
  type: "responsibility" | "authority";
  mode: "add" | "edit";
  TriggerButton: React.ReactNode;
  onClick: (name: string, description: string, link: string) => void;
  onClickDelete?: () => void;
}

export const BaseRoleAttributeDialog = ({
  attribute,
  type,
  mode,
  TriggerButton,
  onClick,
  onClickDelete,
}: BaseRoleAttributeDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(attribute?.label ?? "");
  const [description, setDescription] = useState(attribute?.description ?? "");
  const [link, setLink] = useState(attribute?.link ?? "");

  const resetFormValues = () => {
    setName("");
    setDescription("");
    setLink("");
  };

  const setAttribute = (attribute: RoleAttribute) => {
    setName(attribute.label);
    setDescription(attribute.description ?? "");
    setLink(attribute.link ?? "");
  };

  useEffect(() => {
    if (mode === "edit" && attribute) {
      setAttribute(attribute);
    }
  }, [attribute, mode]);

  return (
    <>
      <DialogRoot
        key={isOpen ? "open" : "closed"}
        open={isOpen}
        onOpenChange={(details) => {
          setIsOpen(details.open);
          if (!details.open) {
            resetFormValues();
          } else {
            if (mode === "edit" && attribute) {
              setAttribute(attribute);
            }
          }
        }}
      >
        {TriggerButton}
        <DialogContent backgroundColor="#fffdf8" borderRadius="xl">
          <DialogHeader>
            <DialogTitle fontWeight="medium">
              {DIALOG_TITLE_MAP[type][mode]}
            </DialogTitle>
            <DialogBody p={0} mt={8}>
              <Box>
                <InputName name={name} setName={setName} mt={0} />
                <InputDescription
                  description={description}
                  setDescription={setDescription}
                  mt={6}
                />
                <InputLink link={link} setLink={setLink} mt={6} />
              </Box>
            </DialogBody>
          </DialogHeader>
          <DialogFooter my={8}>
            <VStack gap={4} align="stretch" w="full">
              <DialogActionTrigger asChild>
                <Button
                  size="lg"
                  h="40px"
                  maxHeight="64px"
                  minHeight="48px"
                  backgroundColor="yellow.400"
                  color="gray.800"
                  borderRadius="12px"
                  disabled={!name}
                  onClick={() => {
                    onClick(name, description, link);
                    resetFormValues();
                  }}
                >
                  {BUTTON_TEXT_MAP[mode as keyof typeof BUTTON_TEXT_MAP] ??
                    mode}
                </Button>
              </DialogActionTrigger>
              {mode === "edit" && onClickDelete && (
                <DialogActionTrigger asChild>
                  <Button
                    size="lg"
                    h="40px"
                    maxHeight="64px"
                    minHeight="48px"
                    color="gray.800"
                    borderRadius="12px"
                    bg="orange.500"
                    _hover={{ bg: "orange.600" }}
                    onClick={() => {
                      onClickDelete();
                      resetFormValues();
                    }}
                  >
                    Delete
                  </Button>
                </DialogActionTrigger>
              )}
            </VStack>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </>
  );
};
