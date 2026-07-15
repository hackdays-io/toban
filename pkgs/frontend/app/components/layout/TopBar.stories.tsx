import type { Story } from "@ladle/react";
import { useState } from "react";
import { Icon } from "~/components/ui/icon";
import { TopBar } from "./TopBar";

export default {
  title: "Layout / TopBar",
};

export const Default: Story = () => (
  <div className="rounded-md border bg-surface">
    <TopBar
      title="ホーム"
      subtitle="今週の活動"
      primaryAction={{
        label: "サンクスを送る",
        icon: <Icon name="send" size={14} />,
      }}
    />
  </div>
);

export const WithSearch: Story = () => {
  const [q, setQ] = useState("");
  return (
    <div className="rounded-md border bg-surface">
      <TopBar
        title="メンバー"
        subtitle={`検索結果 ${q ? "1" : "9"} 件`}
        searchPlaceholder="メンバーを検索"
        searchValue={q}
        onSearchChange={setQ}
        primaryAction={{
          label: "招待",
          icon: <Icon name="invite" size={14} />,
        }}
      />
    </div>
  );
};

export const WithoutCta: Story = () => (
  <div className="rounded-md border bg-surface">
    <TopBar title="設定" subtitle="ワークスペース全体の設定" />
  </div>
);
