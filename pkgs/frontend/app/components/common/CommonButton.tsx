import { Button, type ButtonProps } from "~/components/ui/button";

interface CommonButtonProps extends Omit<ButtonProps, "width"> {
  children: React.ReactNode;
  width?: "full" | number;
  backgroundColor?: string;
  color?: string;
}

export const CommonButton = ({
  children,
  width = "full",
  size = "md",
  backgroundColor = "yellow.400",
  color = "gray.800",
  ...props
}: CommonButtonProps) => {
  return (
    <Button
      w={width === "full" ? "100%" : width}
      size={size}
      backgroundColor={backgroundColor}
      color={color}
      borderRadius="12px"
      {...props}
    >
      {children}
    </Button>
  );
};

export default CommonButton;
