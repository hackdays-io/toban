import { Dialog, DialogContent, DialogTrigger } from "~/components/ui/dialog";

interface CommonDialogProps {
  dialogTriggerReactNode?: React.ReactNode;
  children?: React.ReactNode;
}

export const CommonDialog = ({
  dialogTriggerReactNode,
  children,
}: CommonDialogProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>{dialogTriggerReactNode}</DialogTrigger>
      <DialogContent className="mx-3">{children}</DialogContent>
    </Dialog>
  );
};
