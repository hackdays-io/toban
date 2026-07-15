import type * as React from "react";
import { useTranslation } from "react-i18next";
import { LuTriangleAlert, LuWifiOff } from "react-icons/lu";
import { Link, useNavigate } from "react-router";

import { Button } from "~/components/ui/button";
import { Heading } from "~/components/ui/heading";
import { Typography } from "~/components/ui/typography";
import { cn } from "~/lib/utils";

// Shared frame for the error / offline / 404 fallback screens. Lives outside
// `AppShell` on purpose — the root `ErrorBoundary` mounts above the shell,
// and these screens must render even when the wallet / Apollo tree never
// initialized. Vertically centred inside the viewport with a comfortable
// max-width so the copy reads on both phone and desktop.
function ErrorLayout({
  className,
  children,
  ...rest
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="error-layout"
      className={cn(
        "flex min-h-dvh w-full items-center justify-center bg-bg px-4 py-12",
        className,
      )}
      {...rest}
    >
      <div className="flex w-full max-w-md flex-col items-center text-center">
        {children}
      </div>
    </div>
  );
}

interface DevDetailProps {
  label: string;
  value: string;
}

// Dev-only block for surfacing error data / stack traces. The wrapper is
// always rendered so callers can keep the JSX flat; production builds collapse
// to nothing because `import.meta.env.DEV` is statically false.
function DevDetail({ label, value }: DevDetailProps) {
  if (!import.meta.env.DEV) return null;
  return (
    <details className="mt-8 w-full rounded-lg border border-border bg-surface text-left">
      <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-text-secondary">
        {label}
      </summary>
      <pre className="max-h-64 overflow-auto rounded-b-lg bg-[#1F1B14] px-3 py-3 font-mono text-[11px] leading-relaxed text-[#F5E4B8]">
        {value}
      </pre>
    </details>
  );
}

function NotFoundScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <ErrorLayout>
      <div
        aria-hidden
        className="text-[96px] font-black leading-none text-text-secondary"
      >
        404
      </div>
      <Heading variant="h3" level={1} className="mt-4">
        {t("errors.notFound.title")}
      </Heading>
      <Typography variant="bodySm" tone="secondary" className="mt-2">
        {t("errors.notFound.body")}
      </Typography>
      <div className="mt-6 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:justify-center">
        <Button asChild>
          <Link to="/">{t("errors.notFound.home")}</Link>
        </Button>
        <Button variant="ghost" onClick={() => navigate(-1)} type="button">
          {t("errors.notFound.back")}
        </Button>
      </div>
    </ErrorLayout>
  );
}

interface RouteErrorScreenProps {
  status: number;
  statusText?: string;
  /** `error.data` payload from a thrown Response. */
  data?: unknown;
}

function RouteErrorScreen({ status, statusText, data }: RouteErrorScreenProps) {
  const { t } = useTranslation();

  const detail =
    typeof data === "string" ? data : data ? JSON.stringify(data, null, 2) : "";

  return (
    <ErrorLayout>
      <div className="flex size-14 items-center justify-center rounded-full bg-[#FBE5E2] text-danger">
        <LuTriangleAlert size={26} />
      </div>
      <Heading variant="h3" level={1} className="mt-4">
        {t("errors.routeError.title")}
      </Heading>
      <Typography variant="bodySm" tone="secondary" className="mt-2">
        {status}
        {statusText ? ` ${statusText}` : ""}
      </Typography>
      <div className="mt-6 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:justify-center">
        <Button onClick={() => window.location.reload()} type="button">
          {t("errors.routeError.reload")}
        </Button>
        <Button asChild variant="ghost">
          <Link to="/">{t("errors.routeError.home")}</Link>
        </Button>
      </div>
      {detail ? (
        <DevDetail label={t("errors.devDetails")} value={detail} />
      ) : null}
    </ErrorLayout>
  );
}

interface UnhandledErrorScreenProps {
  error: unknown;
}

function UnhandledErrorScreen({ error }: UnhandledErrorScreenProps) {
  const { t } = useTranslation();

  // TODO: forward `error` to Sentry / equivalent once observability lands.

  let detail = "";
  if (error instanceof Error) {
    detail = error.stack ?? `${error.name}: ${error.message}`;
  } else if (typeof error === "string") {
    detail = error;
  } else if (error) {
    try {
      detail = JSON.stringify(error, null, 2);
    } catch {
      detail = String(error);
    }
  }

  return (
    <ErrorLayout>
      <div className="flex size-14 items-center justify-center rounded-full bg-[#FBE5E2] text-danger">
        <LuTriangleAlert size={26} />
      </div>
      <Heading variant="h3" level={1} className="mt-4">
        {t("errors.unhandled.title")}
      </Heading>
      <Typography variant="bodySm" tone="secondary" className="mt-2">
        {t("errors.unhandled.body")}
      </Typography>
      <div className="mt-6 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:justify-center">
        <Button onClick={() => window.location.reload()} type="button">
          {t("errors.routeError.reload")}
        </Button>
        <Button asChild variant="ghost">
          <Link to="/">{t("errors.routeError.home")}</Link>
        </Button>
      </div>
      {detail ? (
        <DevDetail label={t("errors.devStack")} value={detail} />
      ) : null}
    </ErrorLayout>
  );
}

interface OfflineScreenProps {
  /** Override the default `window.location.reload()` retry behaviour. */
  onRetry?: () => void;
}

function OfflineScreen({ onRetry }: OfflineScreenProps = {}) {
  const { t } = useTranslation();

  return (
    <ErrorLayout>
      <div className="flex size-14 items-center justify-center rounded-full bg-primary-soft text-[#A07310]">
        <LuWifiOff size={26} />
      </div>
      <Heading variant="h3" level={1} className="mt-4">
        {t("errors.offline.title")}
      </Heading>
      <Typography variant="bodySm" tone="secondary" className="mt-2">
        {t("errors.offline.body")}
      </Typography>
      <div className="mt-6">
        <Button
          onClick={onRetry ?? (() => window.location.reload())}
          type="button"
        >
          {t("errors.offline.retry")}
        </Button>
      </div>
    </ErrorLayout>
  );
}

export {
  ErrorLayout,
  NotFoundScreen,
  OfflineScreen,
  RouteErrorScreen,
  UnhandledErrorScreen,
};
export type {
  OfflineScreenProps,
  RouteErrorScreenProps,
  UnhandledErrorScreenProps,
};
