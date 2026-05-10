import { useCallback, useEffect, useState } from "react";
import type { HatsDetailsAttributes } from "types/hats";
import { Box, Button, VStack } from "~/components/chakra-shim";
import { InputDescription } from "../input/InputDescription";
import { InputLink } from "../input/InputLink";
import { InputName } from "../input/InputName";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
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

  const setAttribute = useCallback((attribute: RoleAttribute) => {
    setName(attribute.label);
    setDescription(attribute.description ?? "");
    setLink(attribute.link ?? "");
  }, []);

  useEffect(() => {
    if (mode === "edit" && attribute) {
      setAttribute(attribute);
    }
  }, [attribute, mode, setAttribute]);

  return (
    <>
      <Dialog
        key={isOpen ? "open" : "closed"}
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            resetFormValues();
          } else {
            if (mode === "edit" && attribute) {
              setAttribute(attribute);
            }
          }
        }}
      >
        {TriggerButton}
        <DialogContent className="bg-[#fffdf8] rounded-xl">
          <DialogHeader>
            <DialogTitle className="font-medium">
              {DIALOG_TITLE_MAP[type][mode]}
            </DialogTitle>
          </DialogHeader>
          <div>
            <Box>
              <InputName name={name} setName={setName} mt={0} />
              <InputDescription
                description={description}
                setDescription={setDescription}
                mt={6}
              />
              <InputLink link={link} setLink={setLink} mt={6} />
            </Box>
          </div>
          <DialogFooter>
            <VStack gap={4} align="stretch" w="full">
              <DialogClose asChild>
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
              </DialogClose>
              {mode === "edit" && onClickDelete && (
                <DialogClose asChild>
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
                </DialogClose>
              )}
            </VStack>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
