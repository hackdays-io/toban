import type { Story } from "@ladle/react";
import { DonutChart } from "./donut-chart";

export default {
  title: "Composite / DonutChart",
};

const sample = [
  { key: "atsu", percent: 24 },
  { key: "ryoma", percent: 21 },
  { key: "yumaito", percent: 18 },
  { key: "takerun", percent: 14 },
  { key: "koichi", percent: 11 },
  { key: "eri", percent: 7 },
  { key: "sg", percent: 5 },
];

export const Small: Story = () => <DonutChart slices={sample} size={72} />;

export const Large: Story = () => (
  <DonutChart
    slices={sample}
    size={130}
    center={
      <>
        <span className="text-2xl font-extrabold leading-none">100</span>
        <span className="mt-0.5 text-[10px] font-bold text-text-secondary">
          %
        </span>
      </>
    }
  />
);

export const Partial: Story = () => (
  <DonutChart
    slices={[
      { key: "ryu", percent: 35 },
      { key: "sg", percent: 25 },
    ]}
    size={120}
  />
);
