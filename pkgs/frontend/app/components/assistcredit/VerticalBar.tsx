import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import {
  OrderDirection,
  TransferFractionToken_OrderBy,
} from "../../../gql/graphql";
import { useGetTransferFractionTokens } from "../../../hooks/useFractionToken";
import { Bar } from "react-chartjs-2";
import { useMemo } from "react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

export const VerticalBar = ({ treeId }: { treeId: string }) => {
  const { data: txOriginalData } = useGetTransferFractionTokens({
    where: {
      workspaceId: treeId,
    },
    orderBy: TransferFractionToken_OrderBy.BlockTimestamp,
    orderDirection: OrderDirection.Desc,
    first: 100,
  });

  const { labels, amounts } = useMemo(() => {
    if (!txOriginalData?.transferFractionTokens) {
      return { labels: [], amounts: [] };
    }

    const dailyAmounts = txOriginalData.transferFractionTokens.reduce(
      (acc: { [key: string]: number }, tx) => {
        const date = new Date(
          Number(tx.blockTimestamp) * 1000,
        ).toLocaleDateString("ja-JP");

        acc[date] = (acc[date] || 0) + Number(tx.amount);
        return acc;
      },
      {},
    );

    const sortedDates = Object.keys(dailyAmounts).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime(),
    );

    return {
      labels: sortedDates,
      amounts: sortedDates.map((date) => dailyAmounts[date]),
    };
  }, [txOriginalData]);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "アシストクレジットの日次流通量",
      },
    },
  };

  const data = {
    labels,
    datasets: [
      {
        label: "流通量",
        data: amounts,
        backgroundColor: "rgba(255, 99, 132, 0.5)",
      },
    ],
  };

  return <Bar options={options} data={data} />;
};
