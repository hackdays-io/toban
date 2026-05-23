import type { FC } from "react";

import { Button } from "~/components/ui/button";
import { Heading } from "~/components/ui/heading";
import { Icon } from "~/components/ui/icon";
import { Typography } from "~/components/ui/typography";

interface WorkspaceHeaderProps {
  title: string;
  subtitle?: string;
  /** Renders a primary CTA in the trailing slot. Hidden when omitted. */
  ctaLabel?: string;
  onCtaClick?: () => void;
  showCta?: boolean;
}

// Shared page header for the workspace duty / quest routes. Owns the title,
// subtitle, and optional "作成" CTA so both routes render identical chrome.
const WorkspaceHeader: FC<WorkspaceHeaderProps> = ({
  title,
  subtitle,
  ctaLabel,
  onCtaClick,
  showCta = false,
}) => (
  <header className="flex items-start justify-between gap-3 px-1">
    <div className="min-w-0 flex-1">
      <Heading variant="h2" level={1}>
        {title}
      </Heading>
      {subtitle && (
        <Typography variant="bodySm" tone="secondary" className="mt-0.5">
          {subtitle}
        </Typography>
      )}
    </div>
    {showCta && ctaLabel && (
      <Button
        size="sm"
        variant="primary"
        onClick={onCtaClick}
        className="shrink-0"
      >
        <Icon name="plus" size={14} />
        {ctaLabel}
      </Button>
    )}
  </header>
);

export { WorkspaceHeader };
export type { WorkspaceHeaderProps };
