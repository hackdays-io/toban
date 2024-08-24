import { Pie } from "react-chartjs-2";
import { Box } from "@chakra-ui/react";

const ShareChart = () => {
  const data = {
    labels: ["Vitalik.eth", "halsk.eth", "0x876...aaa"],
    datasets: [
      {
        data: [65.57, 24.43, 10],
        backgroundColor: ["#63b3ed", "#f56565", "#68d391"],
      },
    ],
  };

  return (
    <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg" maxW="sm">
      <Pie data={data} />
    </Box>
  );
};

export default ShareChart;
