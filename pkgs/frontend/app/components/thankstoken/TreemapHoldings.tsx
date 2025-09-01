import type { TooltipItem } from "chart.js";
import { Chart as ChartJS, Legend, Tooltip } from "chart.js";
import { TreemapController, TreemapElement } from "chartjs-chart-treemap";
import { BalanceOfThanksToken_OrderBy, OrderDirection } from "gql/graphql";
import { useNamesByAddresses } from "hooks/useENS";
import { useGetBalanceOfThanksTokens } from "hooks/useThanksToken";
import { useMemo } from "react";
import { Chart } from "react-chartjs-2";
import { abbreviateAddress } from "utils/wallet";
import { formatEther, zeroAddress } from "viem";

ChartJS.register(TreemapController, TreemapElement, Tooltip, Legend);

type FormatterContext = {
  type: string;
  raw: {
    _data?: {
      owner: string;
      balance: number;
    };
  };
};

interface TreemapTooltipItem extends TooltipItem<"treemap"> {
  raw: {
    _data?: {
      owner: string;
      balance: number;
    };
  };
}

export const TreemapHoldings = ({ treeId }: { treeId: string }) => {
  const { data: gqlData } = useGetBalanceOfThanksTokens({
    where: {
      workspaceId: treeId,
    },
    orderBy: BalanceOfThanksToken_OrderBy.Owner,
    orderDirection: OrderDirection.Desc,
    first: 500,
  });

  const addresses = useMemo(
    () =>
      Array.from(
        new Set(
          gqlData?.balanceOfThanksTokens?.map((item) =>
            item.owner?.toLowerCase(),
          ) || [],
        ),
      ).filter((addr) => {
        return addr !== zeroAddress;
      }),
    [gqlData?.balanceOfThanksTokens],
  );

  const { names } = useNamesByAddresses(addresses);

  const processedData = useMemo(() => {
    const ownerBalances: Record<string, number> = {};

    for (const item of gqlData?.balanceOfThanksTokens || []) {
      if (item.owner === zeroAddress) continue;

      const ownerLabel =
        names?.find(
          (nameData) =>
            nameData?.[0]?.address?.toLowerCase() === item.owner?.toLowerCase(),
        )?.[0]?.name || abbreviateAddress(item.owner);
      const balanceNumber = Number(formatEther(BigInt(item.balance || "0")));

      ownerBalances[ownerLabel] =
        (ownerBalances[ownerLabel] || 0) + balanceNumber;
    }

    return Object.entries(ownerBalances).map(([owner, balance]) => ({
      owner,
      balance,
    }));
  }, [gqlData, names]);

  const data = useMemo(() => {
    return {
      datasets: [
        {
          tree: processedData,
          key: "balance",
          backgroundColor: "#A0D8EF",
          borderColor: "white",
          borderWidth: 2,
          spacing: 1,
          labels: {
            display: true,
            formatter: (ctx: FormatterContext) => {
              if (ctx.type !== "data") return "";
              return ctx.raw._data?.owner || "";
            },
          },
        },
      ],
    };
  }, [processedData]);

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "保有しているサンクストークンの量",
      },
      tooltip: {
        enabled: true,
        position: "nearest" as const,
        callbacks: {
          title: (items: TreemapTooltipItem[]) => {
            if (!items?.length || !items[0]?.raw?._data) return "";
            return items[0].raw._data.owner || "";
          },
          label: (item: TreemapTooltipItem) => {
            if (!item?.raw?._data) return "";
            return `合計: ${item.raw._data.balance?.toLocaleString() || 0}`;
          },
        },
      },
    },
  };

  // @ts-expect-error chartjs-chart-treemap has incomplete type definitions
  return <Chart type="treemap" data={data} options={options} />;
};

export default TreemapHoldings;
