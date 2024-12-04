import CommonButton from "./common/CommonButton";

interface BasicButtonProps extends React.ComponentProps<typeof CommonButton> {
  children: React.ReactNode;
}

export const BasicButton = ({ children, ...props }: BasicButtonProps) => {
  return (
    <CommonButton
      size="lg"
      h="40px"
      maxHeight="64px"
      minHeight="48px"
      {...props}
    >
      {children}
    </CommonButton>
  );
};
