import type { Story } from "@ladle/react";
import { AccountMenu } from "./AccountMenu";

// AccountMenu integrates Privy + ENS hooks at runtime, so the Ladle previews
// only render the trigger affordance. Behavioural verification (logout fork,
// profile / send navigation) lives in the Cypress E2E suite.
export default {
  title: "Layout / AccountMenu",
};

export const Compact: Story = () => (
  <div className="flex w-[420px] items-center justify-end border-b bg-bg p-3">
    <AccountMenu variant="compact" />
  </div>
);

export const Inline: Story = () => (
  <div className="w-[260px] border-r bg-bg p-3">
    <AccountMenu variant="inline" />
  </div>
);
