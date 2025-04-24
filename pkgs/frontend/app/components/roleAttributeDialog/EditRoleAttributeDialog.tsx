import { Button } from "@chakra-ui/react";
import { GrEdit } from "react-icons/gr";
import type { HatsDetailsAttributes } from "types/hats";
import { DialogTrigger } from "../ui/dialog";
import { BaseRoleAttributeDialog } from "./BaseRoleAttributeDialog";

const PencilButton = () => {
  return (
    <DialogTrigger asChild height="100%">
      <Button
        aria-label="edit"
        variant="ghost"
        height="100%"
        _hover={{ bg: "transparent" }}
        bg="transparent"
      >
        <GrEdit />
      </Button>
    </DialogTrigger>
  );
};

interface EditRoleAttributeDialogProps {
  type: "responsibility" | "authority";
  attributes: HatsDetailsAttributes;
  setAttributes: (
    index: number,
    attributes: HatsDetailsAttributes[number],
  ) => void;
  deleteAttributes: (index: number) => void;
  attributeIndex: number;
}

export const EditRoleAttributeDialog = ({
  type,
  attributes,
  setAttributes,
  deleteAttributes,
  attributeIndex,
}: EditRoleAttributeDialogProps) => {
  const onClick = (name: string, description: string, link: string) => {
    setAttributes(attributeIndex, { label: name, description, link });
  };

  const onClickDelete = () => {
    deleteAttributes(attributeIndex);
  };

  return (
    <>
      <BaseRoleAttributeDialog
        attribute={attributes[attributeIndex]}
        type={type}
        mode="edit"
        TriggerButton={<PencilButton />}
        onClick={onClick}
        onClickDelete={onClickDelete}
      />
    </>
  );
};
