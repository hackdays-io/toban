import {
  DialogContent,
  DialogRoot,
  DialogTrigger,
} from "~/components/ui/dialog";

interface CommonDialogProps {
  dialogTriggerReactNode?: React.ReactNode;
  children?: React.ReactNode;
}

export const CommonDialog = ({
  dialogTriggerReactNode,
  children,
}: CommonDialogProps) => {
  return (
    <DialogRoot>
      <DialogTrigger asChild>{dialogTriggerReactNode}</DialogTrigger>
      <DialogContent mx={3}>{children}</DialogContent>
    </DialogRoot>
  );
};
