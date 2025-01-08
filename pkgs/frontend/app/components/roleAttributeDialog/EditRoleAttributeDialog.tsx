import { Button } from "@chakra-ui/react";
import { DialogTrigger } from "../ui/dialog";
import { BaseRoleAttributeDialog } from "./BaseRoleAttributeDialog";
import { HatsDetailsAttributes } from "types/hats";
import { GrEdit } from "react-icons/gr";

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
  setAttributes: (attributes: HatsDetailsAttributes) => void;
  attributeIndex: number;
}

export const EditRoleAttributeDialog = ({
  type,
  attributes,
  setAttributes,
  attributeIndex,
}: EditRoleAttributeDialogProps) => {
  const onClick = (name: string, description: string, link: string) => {
    const newAttributes = [
      ...attributes.slice(0, attributeIndex),
      { ...attributes[attributeIndex], label: name, description, link },
      ...attributes.slice(attributeIndex + 1),
    ];
    setAttributes(newAttributes);
  };

  const onClickDelete = () => {
    setAttributes(attributes.filter((_, index) => index !== attributeIndex));
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
