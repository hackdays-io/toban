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
      // Toban Toast — dark pill matching `primitives.jsx:303-315`. Type-
      // specific toasts (success / error / warning) keep Sonner's coloured
      // accent so users can still tell them apart at a glance.
      style={
        {
          "--normal-bg": "var(--color-text-primary)",
          "--normal-text": "#ffffff",
          "--normal-border": "transparent",
          "--border-radius": "9999px",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
