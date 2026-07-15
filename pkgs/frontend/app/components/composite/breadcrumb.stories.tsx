import type { Story } from "@ladle/react";
import { MemoryRouter } from "react-router";

import { Breadcrumb } from "./breadcrumb";

export default {
  title: "Composite / Breadcrumb",
};

export const Default: Story = () => (
  <MemoryRouter>
    <div className="w-96">
      <Breadcrumb
        items={[
          { label: "当番一覧", to: "/123/role" },
          { label: "皿洗い", to: "/123/0xabc" },
          { label: "担当者" },
        ]}
      />
    </div>
  </MemoryRouter>
);

export const TwoItems: Story = () => (
  <MemoryRouter>
    <div className="w-96">
      <Breadcrumb
        items={[{ label: "当番一覧", to: "/123/role" }, { label: "皿洗い" }]}
      />
    </div>
  </MemoryRouter>
);

export const CurrentOnly: Story = () => (
  <MemoryRouter>
    <div className="w-96">
      <Breadcrumb items={[{ label: "当番一覧" }]} />
    </div>
  </MemoryRouter>
);
