import { Button } from "@chakra-ui/react";
import { DialogTrigger } from "../ui/dialog";
import { BaseRoleAttributeDialog } from "./BaseRoleAttributeDialog";
import { HatsDetailsAttributes } from "types/hats";

const PlusButton = () => {
  return (
    <DialogTrigger asChild>
      <Button
        aria-label="add"
        width="full"
        bg="blue.500"
        mt={4}
        color="gray.50"
      >
        +
      </Button>
    </DialogTrigger>
  );
};

interface AddRoleAttributeDialogProps {
  type: "responsibility" | "authority";
  attributes: HatsDetailsAttributes;
  setAttributes: (attributes: HatsDetailsAttributes) => void;
}

export const AddRoleAttributeDialog = ({
  type,
  attributes,
  setAttributes,
}: AddRoleAttributeDialogProps) => {
  const onClick = (name: string, description: string, link: string) => {
    setAttributes([...attributes, { label: name, description, link }]);
  };

  return (
    <>
      <BaseRoleAttributeDialog
        type={type}
        mode="add"
        TriggerButton={<PlusButton />}
        onClick={onClick}
      />
    </>
  );
};
