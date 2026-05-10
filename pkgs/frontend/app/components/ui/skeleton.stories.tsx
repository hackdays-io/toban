import type { Story } from "@ladle/react";
import { Skeleton } from "./skeleton";

export default {
  title: "UI / Skeleton",
};

export const Default: Story = () => (
  <div className="w-80 space-y-3">
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-4 w-2/3" />
    <Skeleton className="h-4 w-1/2" />
  </div>
);

export const Card: Story = () => (
  <div className="flex w-80 items-center gap-3 rounded-md border bg-surface p-4 shadow-1">
    <Skeleton className="size-12 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  </div>
);
