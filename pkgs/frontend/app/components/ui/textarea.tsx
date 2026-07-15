import type * as React from "react";

import { cn } from "~/lib/utils";

interface TextareaProps extends React.ComponentProps<"textarea"> {
  icon?: React.ReactNode;
}

const baseTextareaClass =
  "field-sizing-content flex min-h-24 w-full rounded-sm border border-input bg-surface px-3.5 py-3 text-[15px] outline-none transition-[color,box-shadow] placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-invalid:border-destructive aria-invalid:ring-destructive/20";

function Textarea({ className, icon, ...props }: TextareaProps) {
  if (icon) {
    return (
      <div
        data-slot="textarea-group"
        className={cn(
          "flex min-h-24 w-full items-start gap-2 rounded-sm border border-input bg-surface px-3.5 py-3 transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/40 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[18px] [&_svg:not([class*='text-'])]:text-text-secondary",
          className,
        )}
      >
        <span className="pt-0.5">{icon}</span>
        <textarea
          data-slot="textarea"
          className="field-sizing-content min-h-[1.5rem] w-full flex-1 resize-none border-0 bg-transparent p-0 text-[15px] outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          {...props}
        />
      </div>
    );
  }

  return (
    <textarea
      data-slot="textarea"
      className={cn(baseTextareaClass, className)}
      {...props}
    />
  );
}

export { Textarea };
export type { TextareaProps };
