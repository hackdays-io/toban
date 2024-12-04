import CommonButton from "./common/CommonButton";

interface BottomMainButtonProps
  extends React.ComponentProps<typeof CommonButton> {
  children: React.ReactNode;
  onClick: () => void;
}

export const BottomMainButton = ({
  children,
  onClick,
}: BottomMainButtonProps) => {
  return (
    <CommonButton
      size="lg"
      height="6vh"
      maxHeight="64px"
      minHeight="48px"
      onClick={onClick}
    >
      {children}
    </CommonButton>
  );
};
