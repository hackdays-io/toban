import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAddressesByNames } from "hooks/useENS";
import { useGetHat } from "hooks/useHats";
import { useMintHatFromTimeFrameModule } from "hooks/useHatsTimeFrameModule";
import { useGetWorkspace } from "hooks/useWorkspace";
import {
  type FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import type { HatsDetailSchama } from "types/hats";
import { ipfs2https } from "utils/ipfs";
import { abbreviateAddress, isValidEthAddress } from "utils/wallet";
import type { Address } from "viem";
import { Divider } from "~/components/composite/divider";
import { FieldLabel } from "~/components/composite/field-label";
import { Row } from "~/components/composite/row";
import { ScreenHeader } from "~/components/layout/ScreenHeader";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Icon } from "~/components/ui/icon";
import { Input } from "~/components/ui/input";
import { Typography } from "~/components/ui/typography";

const SUGGESTION_LIMIT = 5;

interface Suggestion {
  address: Address;
  name?: string;
  avatarUrl?: string;
}

const useDutyDetail = (detailsUri?: string) => {
  const httpsUri = useMemo(() => ipfs2https(detailsUri), [detailsUri]);
  const { data } = useQuery({
    queryKey: ["hats-detail", httpsUri],
    enabled: !!httpsUri,
    staleTime: 1000 * 60 * 60,
    queryFn: async (): Promise<HatsDetailSchama | undefined> => {
      if (!httpsUri) return;
      const { data } = await axios.get<HatsDetailSchama>(httpsUri);
      return data;
    },
  });
  return data;
};

const AssignDuty: FC = () => {
  const { treeId, hatId } = useParams();
  const navigate = useNavigate();

  const { data: workspaceData } = useGetWorkspace({
    workspaceId: treeId || "",
  });
  const { mintHat, isLoading: isMinting } = useMintHatFromTimeFrameModule(
    workspaceData?.workspace?.hatsTimeFrameModule as Address,
  );
  const { hat } = useGetHat(hatId ?? "");
  const detail = useDutyDetail(hat?.details);
  const dutyName = detail?.data?.name ?? "当番";
  const dutyDescription = detail?.data?.description;
  const dutyImageUrl = ipfs2https(hat?.imageUri);

  // ── Form state ─────────────────────────────────────────────
  const [input, setInput] = useState("");
  const [pickedAddress, setPickedAddress] = useState<Address | undefined>();
  const [startDatetime, setStartDatetime] = useState<string>("");

  const trimmed = input.trim();
  const isAddressInput = isValidEthAddress(trimmed);

  // Debounce the Namestone resolve so we don't fire on every keystroke.
  const [debouncedQuery, setDebouncedQuery] = useState("");
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(trimmed), 250);
    return () => clearTimeout(handle);
  }, [trimmed]);

  const namestoneTerms = useMemo(() => {
    if (!debouncedQuery) return undefined;
    if (isValidEthAddress(debouncedQuery)) return undefined;
    if (debouncedQuery.startsWith("0x")) return undefined;
    return [debouncedQuery];
  }, [debouncedQuery]);
  const { addresses, isLoading: isSearching } = useAddressesByNames(
    namestoneTerms,
    false,
  );

  const suggestions = useMemo<Suggestion[]>(() => {
    if (!namestoneTerms || !addresses?.length) return [];
    return (addresses[0] ?? [])
      .filter((entry) => entry.name && entry.address)
      .slice(0, SUGGESTION_LIMIT)
      .map(
        (entry): Suggestion => ({
          address: entry.address as Address,
          name: entry.name,
          avatarUrl: ipfs2https(entry.text_records?.avatar),
        }),
      );
  }, [namestoneTerms, addresses]);

  // Once the user picks a suggestion, collapse the dropdown to that single
  // row so the others stop drawing the eye. Typing again clears `pickedAddress`
  // (see the input's onChange) and re-opens the full list.
  const visibleSuggestions = useMemo<Suggestion[]>(() => {
    if (!pickedAddress) return suggestions;
    const picked = suggestions.find(
      (s) => s.address.toLowerCase() === pickedAddress.toLowerCase(),
    );
    return picked ? [picked] : [];
  }, [suggestions, pickedAddress]);

  // Resolve the final address: explicit user picks beat exact-match Namestone
  // hits beat raw address input.
  const resolvedAddress = useMemo<Address | undefined>(() => {
    if (isAddressInput) return trimmed as Address;
    if (pickedAddress) return pickedAddress;
    const exact = suggestions.find(
      (s) => s.name?.toLowerCase() === trimmed.toLowerCase(),
    );
    return exact?.address;
  }, [isAddressInput, trimmed, pickedAddress, suggestions]);

  const handleSelectSuggestion = useCallback((s: Suggestion) => {
    if (s.name) setInput(s.name);
    setPickedAddress(s.address);
  }, []);

  // Reset scroll on mount — AppShell wraps routes in `<main overflow-y-auto>`
  // so window.scrollTo is a no-op; walk up the DOM to the scroll container.
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let node: HTMLElement | null = el;
    while (node) {
      if (node.scrollHeight > node.clientHeight) {
        node.scrollTo({ top: 0, behavior: "auto" });
        break;
      }
      node = node.parentElement;
    }
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, []);

  const handleAssign = useCallback(async () => {
    if (!hatId) return;
    if (!resolvedAddress) {
      toast.error("ユーザー名またはウォレットアドレスを入力してください。");
      return;
    }
    const time = startDatetime
      ? BigInt(Math.floor(new Date(startDatetime).getTime() / 1000))
      : BigInt(0);
    try {
      await mintHat(BigInt(hatId), resolvedAddress, time);
      // The receipt resolves the moment the block lands, but the Hats subgraph
      // still needs a beat to index the new wearer. `useTreeInfo` re-fetches on
      // mount (no Apollo cache to invalidate), so without this pause we'd
      // navigate to a detail page whose wearer list hasn't picked up the new
      // entry yet. 3s matches the duty-create flow in `$treeId_.roles_.new.tsx`.
      await new Promise((resolve) => setTimeout(resolve, 3000));
      toast.success("担当を追加しました。");
      navigate(`/${treeId}/${hatId}`);
    } catch (error) {
      // viem's UserOperationExecutionError dumps callData + paymaster blobs
      // into `error.message`; surfacing it as a toast is useless to the user.
      // Log it for debugging but show a short message.
      console.error(error);
      toast.error("エラーが起きました。");
    }
  }, [hatId, resolvedAddress, startDatetime, mintHat, navigate, treeId]);

  const goBack = () => navigate(`/${treeId}/${hatId}`);
  const showSuggestions =
    !isAddressInput && trimmed.length > 0 && visibleSuggestions.length > 0;
  const showNoMatch =
    !isAddressInput &&
    trimmed.length > 0 &&
    !isSearching &&
    suggestions.length === 0;

  return (
    <div ref={rootRef} className="flex min-h-dvh flex-col bg-bg">
      <ScreenHeader title="担当を追加" onBack={goBack} />

      {/* Duty preview card */}
      <div className="px-4 pb-4">
        <Card className="gap-0 p-4">
          <div className="flex items-start gap-3">
            <Avatar size="xl" className="size-16 shrink-0">
              {dutyImageUrl && (
                <AvatarImage src={dutyImageUrl} alt={dutyName} />
              )}
              <AvatarFallback className="bg-primary-soft text-text-primary">
                <Icon name="duty" size={24} />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <Typography as="div" variant="body" weight="bold" truncate>
                {dutyName}
              </Typography>
              {dutyDescription && (
                <Typography
                  as="div"
                  variant="caption"
                  tone="secondary"
                  className="mt-0.5 leading-snug"
                >
                  {dutyDescription}
                </Typography>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Member input */}
      <div className="flex flex-col gap-5 pb-6">
        <div className="px-5">
          <FieldLabel htmlFor="assign-member">
            ユーザー名 or ウォレットアドレス
          </FieldLabel>
          <Input
            id="assign-member"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setPickedAddress(undefined);
            }}
            placeholder="例：alice or 0x..."
            autoComplete="off"
          />

          {showSuggestions && (
            <Card className="mt-2 gap-0 overflow-hidden p-0">
              {visibleSuggestions.map((s, i) => {
                const isPicked =
                  pickedAddress?.toLowerCase() === s.address.toLowerCase();
                return (
                  <div key={s.address}>
                    <Row
                      left={
                        <Avatar>
                          {s.avatarUrl && (
                            <AvatarImage
                              src={s.avatarUrl}
                              alt={s.name ?? s.address}
                            />
                          )}
                          <AvatarFallback>
                            {(s.name ?? s.address).slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      }
                      title={s.name ?? abbreviateAddress(s.address)}
                      subtitle={abbreviateAddress(s.address)}
                      right={
                        isPicked ? (
                          <Icon
                            name="check"
                            size={16}
                            className="text-primary"
                          />
                        ) : (
                          <Icon
                            name="chevron-right"
                            size={16}
                            className="text-text-secondary"
                          />
                        )
                      }
                      onClick={() => handleSelectSuggestion(s)}
                      className={isPicked ? "bg-primary-soft/40" : undefined}
                    />
                    {i < visibleSuggestions.length - 1 && (
                      <Divider inset={64} />
                    )}
                  </div>
                );
              })}
            </Card>
          )}

          {showNoMatch && (
            <Typography
              as="div"
              variant="caption"
              tone="secondary"
              className="mt-1.5"
            >
              該当するユーザーが見つかりませんでした
            </Typography>
          )}

          {resolvedAddress && !isAddressInput && (
            <div className="mt-1.5 flex items-center justify-end gap-1">
              <Icon name="check" size={14} className="text-success" />
              <Typography variant="caption" tone="secondary">
                {abbreviateAddress(resolvedAddress)}
              </Typography>
            </div>
          )}
        </div>

        {/* Start date */}
        <div className="px-5">
          <FieldLabel htmlFor="assign-start">開始日</FieldLabel>
          <Input
            id="assign-start"
            type="datetime-local"
            value={startDatetime}
            onChange={(e) => setStartDatetime(e.target.value)}
          />
          <Typography
            as="div"
            variant="caption"
            tone="secondary"
            className="mt-1.5 leading-snug"
          >
            未指定の場合、トランザクション確定時を開始日とします。
          </Typography>
        </div>

        {/* CTA — sits directly under the date field, not pinned to the bottom */}
        <div className="flex gap-2.5 px-4 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={goBack}
            disabled={isMinting}
            className="shrink-0"
          >
            キャンセル
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleAssign}
            disabled={!resolvedAddress || isMinting}
            data-testid="assign-submit"
            className="flex-1"
          >
            <Icon name="plus" size={16} />
            {isMinting ? "送信中..." : "担当を追加"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AssignDuty;
