import dayjs from "dayjs";
import { useScheduledDistributorsByWorkspace } from "hooks/useScheduledDistributor";
import { chainId as currentChainId } from "hooks/useViem";
import type { FC } from "react";
import { Link, useParams } from "react-router";
import { abbreviateAddress } from "utils/wallet";
import { formatUnits } from "viem";
import { Breadcrumb } from "~/components/composite/breadcrumb";
import { EmptyState } from "~/components/composite/empty-state";
import { SectionLabel } from "~/components/composite/section-label";
import { PageContainer } from "~/components/layout/PageContainer";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Heading } from "~/components/ui/heading";
import { Icon } from "~/components/ui/icon";
import { Typography } from "~/components/ui/typography";
import { findTokenPreset } from "~/lib/tokens";

const STATUS_LABEL: Record<string, string> = {
  Pending: "予約中",
  Executed: "実行済み",
  Reclaimed: "回収済み",
};

const formatBalance = (raw: string, address: string) => {
  const preset = findTokenPreset(currentChainId, address);
  try {
    const human = formatUnits(BigInt(raw), preset?.decimals ?? 18);
    return preset
      ? `${human} ${preset.symbol}`
      : `${human} (${abbreviateAddress(address as `0x${string}`)})`;
  } catch {
    return raw;
  }
};

const ScheduledIndex: FC = () => {
  const { treeId } = useParams();
  const { data, loading } = useScheduledDistributorsByWorkspace(treeId);
  const rows = data?.scheduledDistributors ?? [];

  return (
    <PageContainer className="pt-4 pb-8 md:pt-6">
      <Breadcrumb
        className="mb-3 px-1"
        items={[{ label: "ホーム", to: `/${treeId}` }, { label: "予約分配" }]}
      />
      <div className="flex items-start justify-between gap-3 px-1">
        <div>
          <Heading variant="h2" level={1}>
            予約分配
          </Heading>
          <Typography variant="bodySm" tone="secondary" className="mt-1">
            規定日に自動で報酬を分配する予約ルール。
          </Typography>
        </div>
        <Button asChild variant="primary" size="sm">
          <Link to={`/${treeId}/scheduled/new`}>
            <Icon name="plus" size={16} />
            予約を作成
          </Link>
        </Button>
      </div>

      <SectionLabel className="mt-5 px-1">一覧</SectionLabel>
      {loading && rows.length === 0 ? (
        <Card className="mx-1 mt-2 py-8 text-center">
          <Typography variant="bodySm" tone="secondary">
            読み込み中…
          </Typography>
        </Card>
      ) : rows.length === 0 ? (
        <Card className="mx-1 mt-2">
          <EmptyState
            title="予約はまだありません"
            body="日付と原資をコミットして、自動分配のリズムを作りましょう。"
            action={
              <Button asChild variant="primary">
                <Link to={`/${treeId}/scheduled/new`}>
                  <Icon name="plus" size={16} />
                  予約を作成
                </Link>
              </Button>
            }
          />
        </Card>
      ) : (
        <ul className="mt-2 flex flex-col gap-3 px-1">
          {rows.map((row) => (
            <li key={row.id}>
              <Link to={`/${treeId}/scheduled/${row.id}`}>
                <Card className="flex-row items-start gap-3 px-4 py-4 transition-colors hover:bg-bg">
                  <div className="min-w-0 flex-1">
                    <Typography
                      as="div"
                      variant="bodySm"
                      weight="bold"
                      truncate
                    >
                      {abbreviateAddress(row.id)}
                    </Typography>
                    <Typography
                      as="div"
                      variant="caption"
                      tone="secondary"
                      className="mt-0.5"
                    >
                      {STATUS_LABEL[row.status] ?? row.status} ・ 締切{" "}
                      {dayjs(Number(row.scheduledDate) * 1000).format(
                        "YYYY/MM/DD HH:mm",
                      )}
                    </Typography>
                    {row.tokenBalances.length > 0 && (
                      <Typography
                        as="div"
                        variant="micro"
                        tone="secondary"
                        className="mt-1"
                      >
                        原資:{" "}
                        {row.tokenBalances
                          .map((b) => formatBalance(b.totalDeposited, b.token))
                          .join(" / ")}
                      </Typography>
                    )}
                  </div>
                  <Icon
                    name="chevron-right"
                    size={18}
                    className="shrink-0 text-text-secondary"
                  />
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
};

export default ScheduledIndex;
