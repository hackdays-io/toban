import type * as React from "react";

import { useDetailScrollReset } from "hooks/useScrollToTop";
import { cn } from "~/lib/utils";

interface MasterDetailLayoutProps extends React.ComponentProps<"div"> {
  /** The 320 px master list panel (left). */
  master: React.ReactNode;
  /** The flexible detail panel (right). */
  detail: React.ReactNode;
  /** When this changes, the detail pane scrolls back to the top. */
  detailScrollKey?: string | number;
}

// Toban desktop MasterDetailLayout — fixed-width master + fluid detail.
// Mirrors `docs/design/handoff/project/desktop.jsx:354-426`. Designed to
// sit *under* the 72 px TopBar, so it claims the rest of the viewport.
function MasterDetailLayout({
  master,
  detail,
  detailScrollKey,
  className,
  ...rest
}: MasterDetailLayoutProps) {
  const detailRef = useDetailScrollReset(detailScrollKey ?? "static");

  return (
    <div
      data-slot="master-detail"
      className={cn(
        "grid h-[calc(100dvh-72px)] grid-cols-[320px_1fr]",
        className,
      )}
      {...rest}
    >
      <aside className="overflow-auto border-r bg-bg">{master}</aside>
      <section ref={detailRef} className="overflow-auto p-7">
        {detail}
      </section>
    </div>
  );
}

export { MasterDetailLayout };
export type { MasterDetailLayoutProps };
