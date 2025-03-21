import { Chart as ChartJS, Tooltip, Legend } from "chart.js";
import { TreemapController, TreemapElement } from "chartjs-chart-treemap";
import { BalanceOfFractionToken_OrderBy, OrderDirection } from "gql/graphql";
import { useNamesByAddresses } from "hooks/useENS";
import { useBalanceOfFractionTokens } from "hooks/useFractionToken";
import { useMemo } from "react";
import { Chart } from "react-chartjs-2";
import { abbreviateAddress } from "utils/wallet";

ChartJS.register(TreemapController, TreemapElement, Tooltip, Legend);

export const Treemap = ({ treeId }: { treeId: string }) => {
  const { data: gqlData } = useBalanceOfFractionTokens({
    where: {
      workspaceId: treeId,
    },
    orderBy: BalanceOfFractionToken_OrderBy.Owner,
    orderDirection: OrderDirection.Desc,
  });

  // Extract unique owners from gqlData
  const addresses = useMemo(
    () =>
      Array.from(
        new Set(
          gqlData?.balanceOfFractionTokens?.map((item) => item.owner) || [],
        ),
      ),
    [gqlData?.balanceOfFractionTokens],
  );

  const { names } = useNamesByAddresses(addresses);

  // Process the gqlData to aggregate balances by owner
  const processedData = (() => {
    if (!gqlData?.balanceOfFractionTokens) return [];

    const ownerBalances: Record<string, number> = {};

    for (const item of gqlData.balanceOfFractionTokens) {
      const owner =
        names?.find(
          (nameData) =>
            nameData?.[0]?.address?.toLowerCase() === item.owner?.toLowerCase(),
        )?.[0]?.name || abbreviateAddress(item.owner);
      const balance = Number.parseInt(item.balance, 10);

      if (ownerBalances[owner]) {
        ownerBalances[owner] += balance;
      } else {
        ownerBalances[owner] = balance;
      }
    }

    return Object.entries(ownerBalances).map(([owner, balance]) => ({
      owner,
      balance,
    }));
  })();

  const data = {
    datasets: [
      {
        label: "Token Holdings",
        tree: processedData,
        key: "balance",
        backgroundColor: "skyblue",
        borderColor: "white",
        borderWidth: 2,
        spacing: 1,
        labels: {
          display: true,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter: (ctx: any) => {
            if (ctx.type !== "data") return "";
            return ctx.raw._data.owner;
          },
        },
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      tooltip: {
        enabled: true,
        position: "nearest" as const,
      },
    },
  };

  // @ts-expect-error chartjs-chart-treemap has incomplete type definitions
  return <Chart type="treemap" data={data} options={options} />;
};
