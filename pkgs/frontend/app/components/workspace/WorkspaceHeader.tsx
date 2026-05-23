import type { FC } from "react";
import { Link } from "react-router";

import { Button } from "~/components/ui/button";
import { Heading } from "~/components/ui/heading";
import { Icon } from "~/components/ui/icon";
import { Typography } from "~/components/ui/typography";

interface WorkspaceHeaderProps {
  title: string;
  subtitle?: string;
  /** Label of the trailing primary CTA. Hidden when `showCta` is false. */
  ctaLabel?: string;
  /** Click handler for the CTA. Mutually exclusive with `ctaTo` — when both are
   *  set, `ctaTo` wins and the button renders as a `<Link>`. */
  onCtaClick?: () => void;
  /** Navigation target for the CTA. Right-click / middle-click / cmd-click
   *  behave like a normal link this way (the `<button>` variant doesn't). */
  ctaTo?: string;
  showCta?: boolean;
}

// Shared page header for the workspace list routes (当番 / クエスト / 分配).
// Owns the title, subtitle, and optional CTA so each list page renders
// identical chrome.
const WorkspaceHeader: FC<WorkspaceHeaderProps> = ({
  title,
  subtitle,
  ctaLabel,
  onCtaClick,
  ctaTo,
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
      <Cta label={ctaLabel} to={ctaTo} onClick={onCtaClick} />
    )}
  </header>
);

interface CtaProps {
  label: string;
  to?: string;
  onClick?: () => void;
}

const Cta: FC<CtaProps> = ({ label, to, onClick }) => {
  if (to) {
    return (
      <Button asChild size="sm" variant="primary" className="shrink-0">
        <Link to={to}>
          <Icon name="plus" size={14} />
          {label}
        </Link>
      </Button>
    );
  }
  return (
    <Button size="sm" variant="primary" onClick={onClick} className="shrink-0">
      <Icon name="plus" size={14} />
      {label}
    </Button>
  );
};

export { WorkspaceHeader };
export type { WorkspaceHeaderProps };
