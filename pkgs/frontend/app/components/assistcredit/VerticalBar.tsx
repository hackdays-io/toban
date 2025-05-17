import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from "chart.js";
import { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import {
  OrderDirection,
  TransferFractionToken_OrderBy,
} from "../../../gql/graphql";
import { useGetTransferFractionTokens } from "../../../hooks/useFractionToken";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

export const VerticalBar = ({ treeId }: { treeId: string }) => {
  const { data: gqlData } = useGetTransferFractionTokens({
    where: {
      workspaceId: treeId,
    },
    orderBy: TransferFractionToken_OrderBy.BlockTimestamp,
    orderDirection: OrderDirection.Asc,
    first: 100,
  });

  const { labels, amounts } = useMemo(() => {
    if (!gqlData?.transferFractionTokens) {
      return { labels: [], amounts: [] };
    }

    const dailyAmounts = gqlData.transferFractionTokens.reduce(
      (acc: { [key: string]: number }, tx) => {
        const date = new Date(
          Number(tx.blockTimestamp) * 1000,
        ).toLocaleDateString("ja-JP");

        acc[date] = (acc[date] || 0) + Number(tx.amount);
        return acc;
      },
      {},
    );

    return {
      labels: Object.keys(dailyAmounts),
      amounts: Object.values(dailyAmounts),
    };
  }, [gqlData]);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: `${["144", "175"].includes(treeId || "") ? "ケアポイント" : "アシストクレジット"}の日次流通量`,
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
