import { useTheme } from "next-themes";
import {
  LuCircleCheck,
  LuInfo,
  LuLoaderCircle,
  LuOctagonX,
  LuTriangleAlert,
} from "react-icons/lu";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <LuCircleCheck className="size-4" />,
        info: <LuInfo className="size-4" />,
        warning: <LuTriangleAlert className="size-4" />,
        error: <LuOctagonX className="size-4" />,
        loading: <LuLoaderCircle className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
