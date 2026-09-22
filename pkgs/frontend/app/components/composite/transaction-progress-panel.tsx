import type * as React from "react";

import {
  CenteredPanel,
  type CenteredPanelProps,
} from "~/components/composite/centered-panel";
import { Heading } from "~/components/ui/heading";
import { Icon, type IconName } from "~/components/ui/icon";
import { Spinner } from "~/components/ui/spinner";
import { Typography } from "~/components/ui/typography";

interface TransactionProgressPanelProps
  extends Omit<React.ComponentProps<"div">, "title"> {
  /** What is happening right now — "サンクスを送信しています…". */
  title: React.ReactNode;
  /** Why it takes a moment — "ブロックチェーンへの書き込みを待っています". */
  description?: React.ReactNode;
  icon?: IconName;
  fill?: CenteredPanelProps["fill"];
}

// Toban TransactionProgressPanel — the "we're working on it" screen shown while
// a chain write is in flight. Replaces the hand-rolled `SendingStep` /
// `SendingPanel` copies (#548); reach for this instead of building another.
//
// A spinner ring orbits a static icon plate: the ring says "your action is
// being processed", the icon says which action. The plate used to `animate-pulse`
// instead, but `animate-pulse` is this app's skeleton idiom (`ui/skeleton`,
// the member-list placeholders) — it read as "content still loading".
function TransactionProgressPanel({
  title,
  description,
  icon = "send",
  fill = "screen",
  className,
  ...rest
}: TransactionProgressPanelProps) {
  return (
    <CenteredPanel
      data-slot="transaction-progress-panel"
      fill={fill}
      // Matches the live-region convention used by `AccountMenu` / `login`:
      // `aria-live` alone, since `CenteredPanel` renders a <div>.
      aria-live="polite"
      aria-atomic="true"
      className={className}
      {...rest}
    >
      <div className="relative mb-6 flex size-[76px] items-center justify-center">
        <Spinner className="absolute inset-0 size-[76px] border-[3px] border-primary/20 border-t-primary" />
        <div className="flex size-16 items-center justify-center rounded-full bg-primary-soft">
          <Icon name={icon} size={28} className="text-primary" />
        </div>
      </div>
      <Heading variant={fill === "screen" ? "h4" : "h5"} level={2}>
        {title}
      </Heading>
      {description && (
        <Typography as="div" variant="bodySm" tone="secondary" className="mt-2">
          {description}
        </Typography>
      )}
    </CenteredPanel>
  );
}

export { TransactionProgressPanel };
export type { TransactionProgressPanelProps };
