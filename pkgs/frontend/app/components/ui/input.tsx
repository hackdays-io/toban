import type * as React from "react";

import { cn } from "~/lib/utils";

const baseInputClass =
  "h-12 w-full min-w-0 rounded-sm border border-input bg-surface px-3.5 text-[15px] outline-none transition-[color,box-shadow] selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-invalid:border-destructive aria-invalid:ring-destructive/20";

interface InputProps extends React.ComponentProps<"input"> {
  icon?: React.ReactNode;
}

function Input({ className, type, icon, ...props }: InputProps) {
  if (icon) {
    return (
      <div
        data-slot="input-group"
        className={cn(
          "flex h-12 w-full items-center gap-2 rounded-sm border border-input bg-surface px-3.5 transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/40 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[18px] [&_svg:not([class*='text-'])]:text-text-secondary",
          className,
        )}
      >
        {icon}
        <input
          type={type}
          data-slot="input"
          className="h-full w-full min-w-0 flex-1 border-0 bg-transparent p-0 text-[15px] outline-none placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
          {...props}
        />
      </div>
    );
  }

  return (
    <input
      type={type}
      data-slot="input"
      className={cn(baseInputClass, className)}
      {...props}
    />
  );
}

export { Input };
export type { InputProps };
