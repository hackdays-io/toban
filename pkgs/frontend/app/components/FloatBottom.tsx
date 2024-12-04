import { Float } from "@chakra-ui/react";

interface FloatBottomProps extends React.ComponentProps<typeof Float> {
  children: React.ReactNode;
}

export const FloatBottom = ({ children, ...props }: FloatBottomProps) => {
  return (
    <Float
      placement="bottom-center"
      mb="4vh"
      width="100%"
      display="flex"
      flexDirection="column"
      alignItems="center"
      {...props}
    >
      {children}
    </Float>
  );
};
