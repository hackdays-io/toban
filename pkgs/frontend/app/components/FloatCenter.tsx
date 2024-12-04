import { Float } from "@chakra-ui/react";

interface FloatCenterProps extends React.ComponentProps<typeof Float> {
  children: React.ReactNode;
}

export const FloatCenter = ({ children, ...props }: FloatCenterProps) => {
  return (
    <Float
      placement="middle-center"
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
