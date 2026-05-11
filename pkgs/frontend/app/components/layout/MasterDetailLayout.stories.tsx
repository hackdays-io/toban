import type { Story } from "@ladle/react";
import { useState } from "react";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Card, CardContent } from "~/components/ui/card";
import { Heading } from "~/components/ui/heading";
import { Typography } from "~/components/ui/typography";
import { MasterDetailLayout } from "./MasterDetailLayout";

const duties = [
  { id: "trash", name: "ゴミ出し", assignee: "ひらやま" },
  { id: "cleanup", name: "共有部清掃", assignee: "homma" },
  { id: "stock", name: "備品補充", assignee: undefined },
];

export default {
  title: "Layout / MasterDetailLayout",
};

export const Default: Story = () => {
  const [selected, setSelected] = useState<string>("trash");
  const duty = duties.find((d) => d.id === selected);
  return (
    <div className="overflow-hidden rounded-md border">
      <MasterDetailLayout
        master={
          <div className="flex flex-col gap-1.5 p-3">
            {duties.map((d) => {
              const active = d.id === selected;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelected(d.id)}
                  className={`flex items-center gap-3 rounded-sm px-3 py-3 text-left transition-colors ${
                    active
                      ? "bg-surface shadow-1"
                      : "bg-transparent hover:bg-surface/50"
                  }`}
                >
                  <Avatar size="sm">
                    <AvatarFallback seed={d.name} />
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <Typography
                      as="div"
                      variant="bodySm"
                      weight="bold"
                      truncate
                    >
                      {d.name}
                    </Typography>
                    <Typography as="div" variant="micro" tone="secondary">
                      {d.assignee ?? "担当者を募集中"}
                    </Typography>
                  </div>
                </button>
              );
            })}
          </div>
        }
        detail={
          <div className="space-y-4">
            <Heading variant="h2" level={2}>
              {duty?.name}
            </Heading>
            <Card>
              <CardContent>
                <Typography variant="bodySm" tone="secondary">
                  詳細パネルにはここで担当者・分配・メンバー一覧などを並べます。
                </Typography>
              </CardContent>
            </Card>
          </div>
        }
      />
    </div>
  );
};
