import type { Story } from "@ladle/react";
import { Spinner } from "./spinner";

export default {
  title: "UI / Spinner",
};

export const Sizes: Story = () => (
  <div className="flex items-center gap-6 p-6">
    <Spinner size="sm" />
    <Spinner size="md" />
    <Spinner size="lg" />
  </div>
);
