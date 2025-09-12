import type { TooltipItem } from "chart.js";
import { Chart as ChartJS, Legend, Tooltip } from "chart.js";
import { TreemapController, TreemapElement } from "chartjs-chart-treemap";
import { MintThanksToken_OrderBy, type OrderDirection } from "gql/graphql";
import { useNamesByAddresses } from "hooks/useENS";
import { useGetMintThanksTokens } from "hooks/useThanksToken";
import { useMemo } from "react";
import { Chart } from "react-chartjs-2";
import { abbreviateAddress } from "utils/wallet";

ChartJS.register(TreemapController, TreemapElement, Tooltip, Legend);

type FormatterContext = {
  type: string;
  raw: {
    _data?: {
      sender: string;
      sent: number;
    };
  };
};

interface TreemapTooltipItem extends TooltipItem<"treemap"> {
  raw: {
    _data?: {
      sender: string;
      sent: number;
    };
  };
}

export const TreemapSent = ({ treeId }: { treeId: string }) => {
  const { data } = useGetMintThanksTokens({
    where: { workspaceId: treeId },
    orderBy: MintThanksToken_OrderBy.BlockTimestamp,
    orderDirection: "desc" as OrderDirection,
    first: 1000,
  });

  const senders = useMemo(
    () =>
      Array.from(
        new Set(data?.mintThanksTokens?.map((t) => t.from.toLowerCase()) || []),
      ),
    [data?.mintThanksTokens],
  );

  const { names } = useNamesByAddresses(senders);

  const processedData = (() => {
    if (!data?.mintThanksTokens)
      return [] as Array<{ sender: string; sent: number }>;

    const senderTotals: Record<string, number> = {};
    for (const t of data.mintThanksTokens) {
      const label =
        names?.find(
          (n) => n?.[0]?.address?.toLowerCase() === t.from?.toLowerCase(),
        )?.[0]?.name || abbreviateAddress(t.from);

      const amountNum = Number(t.amount || 0);
      senderTotals[label] = (senderTotals[label] || 0) + amountNum;
    }

    return Object.entries(senderTotals).map(([sender, sent]) => ({
      sender,
      sent,
    }));
  })();

  const dataForChart = {
    datasets: [
      {
        tree: processedData,
        key: "sent",
        backgroundColor: "#F6AD55",
        borderColor: "white",
        borderWidth: 2,
        spacing: 1,
        labels: {
          display: true,
          formatter: (ctx: FormatterContext) => {
            if (ctx.type !== "data") return "";
            return ctx.raw._data?.sender || "";
          },
        },
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "送ったサンクストークンの量",
      },
      tooltip: {
        enabled: true,
        position: "nearest" as const,
        callbacks: {
          title: (items: TreemapTooltipItem[]) => {
            if (!items?.length || !items[0]?.raw?._data) return "";
            return items[0].raw._data.sender || "";
          },
          label: (item: TreemapTooltipItem) => {
            if (!item?.raw?._data) return "";
            return `合計: ${item.raw._data.sent?.toLocaleString() || 0}`;
          },
        },
      },
    },
  };

  // @ts-expect-error chartjs-chart-treemap has incomplete type definitions
  return <Chart type="treemap" data={dataForChart} options={options} />;
};

export default TreemapSent;
