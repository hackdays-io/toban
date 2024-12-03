import { Button, ButtonProps } from "~/components/ui/button";

interface CommonButtonProps extends Omit<ButtonProps, "width"> {
  children: React.ReactNode;
  width?: "full" | number;
  size?: "sm" | "md" | "lg";
  backgroundColor?: string;
  color?: string;
}

export const CommonButton = ({
  children,
  width = "full",
  size = "md",
  backgroundColor,
  color,
  ...props
}: CommonButtonProps) => {
  return (
    <Button
      w={width === "full" ? "100%" : width}
      size={size}
      backgroundColor={backgroundColor}
      color={color}
      {...props}
    >
      {children}
    </Button>
  );
};

export default CommonButton;
