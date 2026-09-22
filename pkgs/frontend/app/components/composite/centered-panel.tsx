import type * as React from "react";

import { cn } from "~/lib/utils";

const fillClass = {
  /** Fills the viewport below the app header — for full-page step screens. */
  screen: "min-h-[calc(100dvh-12rem)]",
  /** Fills its flex parent — for panels inside a sheet or dialog. */
  panel: "min-h-[280px] flex-1",
} as const;

interface CenteredPanelProps extends React.ComponentProps<"div"> {
  fill?: keyof typeof fillClass;
}

// Toban CenteredPanel — the centred column used by terminal step screens
// ("sending…", "done"). Extracted from the two copies that had drifted apart
// in `$treeId_.thankstoken.send.tsx` and `AssistCreditSendSheet.tsx` (#548).
function CenteredPanel({
  fill = "screen",
  className,
  ...rest
}: CenteredPanelProps) {
  return (
    <div
      data-slot="centered-panel"
      className={cn(
        "flex flex-col items-center justify-center px-6 text-center",
        fillClass[fill],
        className,
      )}
      {...rest}
    />
  );
}

export { CenteredPanel };
export type { CenteredPanelProps };
