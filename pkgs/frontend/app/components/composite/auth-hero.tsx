import type * as React from "react";

import { cn } from "~/lib/utils";

interface AuthHeroProps extends Omit<React.ComponentProps<"div">, "title"> {
  /** Primary marketing copy. */
  title: React.ReactNode;
  /** Optional supporting paragraph beneath the title. */
  description?: React.ReactNode;
  /** Layout — `centered` stacks copy in the middle (mobile/auth landing),
   *  `start` left-aligns it (desktop split layout). */
  align?: "centered" | "start";
}

// Toban AuthHero — marketing copy panel used on the auth screens
// (`login`, `signup`, landing `_index`). Renders a headline + supporting copy.
function AuthHero({
  title,
  description,
  align = "centered",
  className,
  children,
  ...rest
}: AuthHeroProps) {
  const isCentered = align === "centered";
  return (
    <div
      data-slot="auth-hero"
      data-align={align}
      className={cn(
        "flex flex-col gap-3",
        isCentered ? "items-center text-center" : "items-start text-left",
        className,
      )}
      {...rest}
    >
      <h1
        className={cn(
          "font-extrabold leading-tight text-text-primary",
          "text-[26px] sm:text-3xl md:text-4xl",
        )}
      >
        {title}
      </h1>
      {description && (
        <p className="max-w-md text-sm leading-relaxed text-text-secondary md:text-[15px]">
          {description}
        </p>
      )}
      {children}
    </div>
  );
}

export { AuthHero };
export type { AuthHeroProps };
