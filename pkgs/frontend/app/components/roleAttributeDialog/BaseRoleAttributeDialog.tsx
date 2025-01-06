import { Box, VStack } from "@chakra-ui/react";
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogActionTrigger,
} from "../ui/dialog";
import { InputName } from "../InputName";
import { BasicButton } from "../BasicButton";
import { InputDescription } from "../InputDescription";
import { InputLink } from "../InputLink";
import { useEffect, useState } from "react";
import { HatsDetailsAttributes } from "types/hats";

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

  useEffect(() => {
    if (mode === "edit" && attribute) {
      setName(attribute.label);
      setDescription(attribute.description ?? "");
      setLink(attribute.link ?? "");
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
                <BasicButton
                  onClick={() => {
                    onClick(name, description, link);
                    resetFormValues();
                  }}
                  disabled={!name}
                >
                  {BUTTON_TEXT_MAP[mode as keyof typeof BUTTON_TEXT_MAP] ??
                    mode}
                </BasicButton>
              </DialogActionTrigger>
              {mode === "edit" && onClickDelete && (
                <DialogActionTrigger asChild>
                  <BasicButton
                    onClick={() => {
                      onClickDelete();
                      resetFormValues();
                    }}
                    bg="orange.500"
                  >
                    Delete
                  </BasicButton>
                </DialogActionTrigger>
              )}
            </VStack>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </>
  );
};
