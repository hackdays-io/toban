import type * as React from "react";

import { cn } from "~/lib/utils";

interface AuthHeroProps extends Omit<React.ComponentProps<"div">, "title"> {
  /** Path to the brand mark (rendered as <img>). Defaults to the Toban logo. */
  logoSrc?: string;
  /** Small label above the headline (e.g. "あたたかい当番帳"). */
  eyebrow?: React.ReactNode;
  /** Primary marketing copy. */
  title: React.ReactNode;
  /** Optional supporting paragraph beneath the title. */
  description?: React.ReactNode;
  /** Layout — `centered` stacks copy in the middle (mobile/auth landing),
   *  `start` left-aligns it (desktop split layout). */
  align?: "centered" | "start";
}

// Toban AuthHero — branded marketing panel used on the auth screens
// (`login`, `signup`, landing `_index`). Pairs a circular logo plate with the
// brand eyebrow + headline + supporting copy. Mirrors the prototype hero
// (`docs/design/handoff/project/Toban Prototype.html:140-153`).
function AuthHero({
  logoSrc = "/images/toban-logo.svg",
  eyebrow,
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
        "flex flex-col gap-6",
        isCentered ? "items-center text-center" : "items-start text-left",
        className,
      )}
      {...rest}
    >
      <div
        className={cn(
          "flex size-24 items-center justify-center rounded-full bg-primary-soft p-4 shadow-1",
          isCentered ? "" : "md:size-28",
        )}
      >
        <img
          src={logoSrc}
          alt="Toban"
          className="size-full object-contain"
          draggable={false}
        />
      </div>
      <div
        className={cn(
          "flex flex-col gap-3",
          isCentered ? "items-center" : "items-start",
        )}
      >
        {eyebrow && (
          <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-bold tracking-[0.04em] text-[#7A5A2E]">
            {eyebrow}
          </span>
        )}
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
      </div>
      {children}
    </div>
  );
}

export { AuthHero };
export type { AuthHeroProps };
