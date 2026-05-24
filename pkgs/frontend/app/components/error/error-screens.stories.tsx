import type { Story } from "@ladle/react";
import { MemoryRouter } from "react-router";

import {
  NotFoundScreen,
  OfflineScreen,
  RouteErrorScreen,
  UnhandledErrorScreen,
} from "./error-screens";

export default {
  title: "Error / Screens",
};

const Frame = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>
    <div className="min-h-dvh">{children}</div>
  </MemoryRouter>
);

export const NotFound: Story = () => (
  <Frame>
    <NotFoundScreen />
  </Frame>
);

export const RouteError500: Story = () => (
  <Frame>
    <RouteErrorScreen status={500} statusText="Internal Server Error" />
  </Frame>
);

export const RouteError403: Story = () => (
  <Frame>
    <RouteErrorScreen
      status={403}
      statusText="Forbidden"
      data="You do not have permission to view this workspace."
    />
  </Frame>
);

export const Unhandled: Story = () => (
  <Frame>
    <UnhandledErrorScreen
      error={new Error("Cannot read properties of undefined (reading 'tree')")}
    />
  </Frame>
);

export const Offline: Story = () => (
  <Frame>
    <OfflineScreen />
  </Frame>
);
