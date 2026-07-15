import type * as React from "react";

import { cn } from "~/lib/utils";

interface AuthLayoutProps extends React.ComponentProps<"div"> {
  /** Hero/marketing content. Mobile: rendered above the panel. Desktop: left column. */
  hero: React.ReactNode;
  /** Optional footer slot rendered below the panel (e.g. terms / language switch). */
  footer?: React.ReactNode;
}

// Toban AuthLayout — responsive shell for the auth screens (login, signup,
// landing). Sits OUTSIDE the AppShell (no Sidebar / BottomNav) so the brand
// gets the full viewport.
//
// Mobile (< md): single centred column — hero stacked above the children
// panel.
// Desktop (>= md): two columns — hero copy on the left, children panel
// on the right inside a centred max-w container.
function AuthLayout({
  hero,
  footer,
  className,
  children,
  ...rest
}: AuthLayoutProps) {
  return (
    <div
      data-slot="auth-layout"
      className={cn("flex min-h-dvh flex-col bg-bg", className)}
      {...rest}
    >
      <div className="flex flex-1 items-center justify-center px-4 py-10 md:px-8 md:py-16">
        <div
          className={cn(
            "w-full max-w-md",
            "md:grid md:max-w-5xl md:grid-cols-2 md:items-center md:gap-12 lg:gap-16",
          )}
        >
          <div className="mb-8 flex justify-center md:mb-0 md:justify-start">
            {hero}
          </div>
          <div className="flex justify-center md:justify-end">{children}</div>
        </div>
      </div>
      {footer && (
        <div className="px-4 pb-6 text-center text-xs text-text-secondary md:px-8">
          {footer}
        </div>
      )}
    </div>
  );
}

export { AuthLayout };
export type { AuthLayoutProps };
