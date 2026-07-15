import type { Hat } from "@hatsprotocol/sdk-v1-subgraph";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { type FC, useMemo } from "react";
import { useNavigate } from "react-router";
import type { HatsDetailSchama } from "types/hats";
import { ipfs2https } from "utils/ipfs";

import { Card } from "~/components/ui/card";
import { Icon } from "~/components/ui/icon";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import { Typography } from "~/components/ui/typography";
import { cn } from "~/lib/utils";

interface QuestCreatePickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Workspace tree id used to build the target URL. */
  treeId: string;
  /** Viewer's wallet address (lowercased). Becomes the `wearer` URL segment
   *  of the quest-new route — quests spend the viewer's own role share. */
  viewerAddress?: string;
  /** Role-branch hats for the workspace. The picker shows only those the
   *  viewer wears, since a quest is created against one of their own duties. */
  dutyHats: Hat[];
}

// Hat detail (name / image) fetched lazily per row. Shares the
// `["hats-detail", url]` cache key with `HatsListItemParser` so the names are
// dedup'd across the workspace.
const useHatDetail = (detailsUri?: string) => {
  const httpsUri = useMemo(() => ipfs2https(detailsUri), [detailsUri]);
  const { data } = useQuery({
    queryKey: ["hats-detail", httpsUri],
    queryFn: async (): Promise<HatsDetailSchama | undefined> => {
      if (!httpsUri) return;
      const { data } = await axios.get<HatsDetailSchama>(httpsUri);
      return data;
    },
    enabled: !!httpsUri,
    staleTime: 1000 * 60 * 60,
  });
  return data;
};

// Bottom-sheet duty picker — opens from the クエスト tab's 作成 CTA. Lists the
// viewer's worn duties; tapping one navigates to that duty's existing
// `/<tree>/<hat>/<wearer>/quest/new` flow.
const QuestCreatePickerSheet: FC<QuestCreatePickerSheetProps> = ({
  open,
  onOpenChange,
  treeId,
  viewerAddress,
  dutyHats,
}) => {
  const navigate = useNavigate();

  const myDuties = useMemo(() => {
    if (!viewerAddress) return [];
    const me = viewerAddress.toLowerCase();
    return dutyHats.filter((h) =>
      (h.wearers ?? []).some((w) => w.id?.toLowerCase() === me),
    );
  }, [dutyHats, viewerAddress]);

  const onPick = (hatId: string) => {
    if (!viewerAddress) return;
    onOpenChange(false);
    navigate(`/${treeId}/${hatId}/${viewerAddress}/quest/new`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[80dvh] md:right-auto md:left-1/2 md:w-full md:max-w-md md:-translate-x-1/2"
      >
        <SheetHeader>
          <SheetTitle>クエストを作成する当番を選択</SheetTitle>
        </SheetHeader>
        <div className="overflow-y-auto px-5 pb-2">
          {myDuties.length === 0 ? (
            <Card className="my-2 py-8 text-center">
              <Typography variant="bodySm" tone="secondary">
                あなたが担当している当番がありません
              </Typography>
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              {myDuties.map((h) => (
                <DutyPickerRow
                  key={h.id}
                  hat={h}
                  onClick={() => onPick(h.id)}
                />
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

interface DutyPickerRowProps {
  hat: Hat;
  onClick: () => void;
}

const DutyPickerRow: FC<DutyPickerRowProps> = ({ hat, onClick }) => {
  const detail = useHatDetail(hat.details);
  const imageUrl = ipfs2https(hat.imageUri);
  const name = detail?.data?.name ?? "当番";
  return (
    <button type="button" onClick={onClick} className="block w-full text-left">
      <Card className="flex flex-row items-center gap-3 px-3.5 py-3 transition-colors hover:bg-bg">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-[#F2EAD9]",
          )}
        >
          {imageUrl ? (
            <img src={imageUrl} alt="" className="size-full object-cover" />
          ) : (
            <Icon name="duty" size={20} className="text-[#7A5A2E]" />
          )}
        </div>
        <Typography
          as="div"
          variant="bodySm"
          weight="bold"
          truncate
          className="min-w-0 flex-1"
        >
          {name}
        </Typography>
        <Icon
          name="chevron-right"
          size={16}
          className="shrink-0 text-text-secondary"
        />
      </Card>
    </button>
  );
};

export { QuestCreatePickerSheet };
export type { QuestCreatePickerSheetProps };
