import type { GetThanksTokenMintsQuery } from "gql/graphql";
import { useNamesByAddresses } from "hooks/useENS";
import { useGetHat } from "hooks/useHats";
import { useThanksTokenActivity } from "hooks/useThanksToken";
import type { NameData } from "namestone-sdk";
import { type FC, useMemo } from "react";
import { Link } from "react-router";
import { ipfs2https } from "utils/ipfs";
import { abbreviateAddress } from "utils/wallet";
import { formatEther, hexToString } from "viem";
import { Skeleton } from "~/components/ui/skeleton";
import { UserIcon } from "../icon/UserIcon";

interface Props {
  treeId: string;
  limit?: number;
}

interface UserProps extends Props {
  userAddress: string;
  data: GetThanksTokenMintsQuery | undefined;
  txType: "sent" | "received";
}

interface ActivityItemProps {
  treeId: string;
  activity: GetThanksTokenMintsQuery["mintThanksTokens"][0];
  fromUser?: NameData;
  toUser?: NameData;
}

const collectAddresses = (pairs: { from: string; to: string }[]): string[] => {
  const set = new Set<string>();
  for (const p of pairs) {
    if (p.from) set.add(p.from);
    if (p.to) set.add(p.to);
  }
  return Array.from(set);
};

const buildNamesByAddress = (groups: NameData[][]): Map<string, NameData> => {
  const map = new Map<string, NameData>();
  for (const group of groups) {
    const entry = group[0];
    if (entry?.address) {
      map.set(entry.address.toLowerCase(), entry);
    }
  }
  return map;
};

const SKELETON_ROW_KEYS = [
  "row-a",
  "row-b",
  "row-c",
  "row-d",
  "row-e",
  "row-f",
  "row-g",
  "row-h",
  "row-i",
  "row-j",
];

const HistorySkeletonList: FC<{ rows?: number; height?: string }> = ({
  rows = 3,
  height = "56px",
}) => (
  <div className="flex w-full flex-col gap-2">
    {SKELETON_ROW_KEYS.slice(0, rows).map((k) => (
      <Skeleton key={k} className="w-full rounded-[5px]" style={{ height }} />
    ))}
  </div>
);

const ThanksTokenActivityItem: FC<ActivityItemProps> = ({
  treeId,
  activity,
  fromUser,
  toUser,
}) => {
  const message = useMemo(() => {
    return hexToString(activity.data || "0x");
  }, [activity.data]);

  return (
    <div className="relative w-full overflow-hidden rounded-[5px] border-[color:var(--color-gray-200,#e5e7eb)] bg-green-100 px-2 py-3">
      <div className="absolute top-0 left-0 h-full w-[55%] bg-green-300 opacity-50" />
      <span
        aria-hidden
        className="absolute top-0 mr-2 inline-block h-0 w-0 border-y-[30px] border-l-[60px] border-y-transparent border-l-green-300 opacity-50"
        style={{ left: "55%" }}
      />
      <div className="relative grid grid-cols-[37.5%_25%_37.5%] items-center justify-between">
        <Link to={`/${treeId}/member/${activity.from}`}>
          <div className="flex items-center gap-2">
            <UserIcon
              size="25px"
              userImageUrl={ipfs2https(fromUser?.text_records?.avatar)}
            />
            <span className="text-sm font-medium text-gray-700">
              {fromUser?.name || abbreviateAddress(activity.from)}
            </span>
          </div>
        </Link>

        <div className="text-center">
          <p className="text-lg font-semibold text-green-600">
            {Number(formatEther(BigInt(activity.amount))).toLocaleString()}{" "}
            <span className="text-xs">THX</span>
          </p>
        </div>

        <Link to={`/${treeId}/member/${activity.to}`}>
          <div className="flex items-center justify-end gap-2">
            <span className="text-sm font-medium text-gray-700">
              {toUser?.name || abbreviateAddress(activity.to)}
            </span>
            <UserIcon
              size="25px"
              userImageUrl={ipfs2https(toUser?.text_records?.avatar)}
            />
          </div>
        </Link>
      </div>
      {message && <p className="relative z-[1] text-sm">{message}</p>}
    </div>
  );
};

/**
 * ワークスペース全体のサンクストークン履歴を表示するコンポーネント
 */
export const ThanksTokenHistory: FC<Props> = ({ treeId, limit = 10 }) => {
  const { mints, isLoading: isActivityLoading } = useThanksTokenActivity(
    treeId,
    limit,
  );

  const allAddresses = useMemo(
    () => collectAddresses(mints?.mintThanksTokens ?? []),
    [mints],
  );

  const { names, isLoading: isNamesLoading } =
    useNamesByAddresses(allAddresses);
  const namesByAddress = useMemo(() => buildNamesByAddress(names), [names]);

  if (isActivityLoading || !mints) {
    return <HistorySkeletonList rows={Math.min(limit, 3)} />;
  }

  if (mints.mintThanksTokens.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        アクティビティはまだありません
      </div>
    );
  }

  if (isNamesLoading && namesByAddress.size === 0) {
    return <HistorySkeletonList rows={Math.min(limit, 3)} />;
  }

  return (
    <div className="flex w-full flex-col gap-2">
      {mints.mintThanksTokens.map((mint) => (
        <ThanksTokenActivityItem
          key={`activity_${mint.id}`}
          treeId={treeId}
          activity={mint}
          fromUser={namesByAddress.get(mint.from.toLowerCase())}
          toUser={namesByAddress.get(mint.to.toLowerCase())}
        />
      ))}
    </div>
  );
};

interface ItemProps {
  treeId: string;
  from: string;
  to: string;
  hatId: string;
  amount: number;
  timestamp: number;
  fromUser?: NameData;
  toUser?: NameData;
}

const ThanksTokenItem: FC<ItemProps> = ({
  treeId,
  from,
  to,
  amount,
  fromUser,
  toUser,
}) => {
  return (
    <div className="relative flex h-[60px] w-full overflow-hidden rounded-[5px] border-[color:var(--color-gray-200,#e5e7eb)] bg-blue-100 px-2 py-3">
      <div className="absolute top-0 left-0 h-full w-[55%] bg-blue-300 opacity-50" />
      <span
        aria-hidden
        className="absolute top-0 mr-2 inline-block h-0 w-0 border-y-[30px] border-l-[60px] border-y-transparent border-l-blue-300 opacity-50"
        style={{ left: "55%" }}
      />
      <div className="relative grid w-full grid-cols-[37.5%_25%_37.5%] items-center justify-between">
        <Link to={`/${treeId}/member/${from}`}>
          <div className="flex items-center gap-2">
            <UserIcon
              size="25px"
              userImageUrl={ipfs2https(fromUser?.text_records?.avatar)}
            />
            <span className="text-sm font-medium text-gray-700">
              {fromUser?.name || abbreviateAddress(from)}
            </span>
          </div>
        </Link>

        <div className="text-left">
          <p className="text-lg font-semibold text-blue-600">
            {amount} <span className="text-xs">THX</span>
          </p>
        </div>

        <Link to={`/${treeId}/member/${to}`}>
          <div className="flex items-center justify-end gap-2">
            <span className="text-sm font-medium text-gray-700">
              {toUser?.name || abbreviateAddress(to)}
            </span>
            <UserIcon
              size="25px"
              userImageUrl={ipfs2https(toUser?.text_records?.avatar)}
            />
          </div>
        </Link>
      </div>
    </div>
  );
};

export const UserThanksHistory: FC<UserProps> = ({ data, txType }) => {
  const allAddresses = useMemo(
    () => collectAddresses(data?.mintThanksTokens ?? []),
    [data],
  );

  const { names, isLoading: isNamesLoading } =
    useNamesByAddresses(allAddresses);
  const namesByAddress = useMemo(() => buildNamesByAddress(names), [names]);

  if (!data) {
    return <HistorySkeletonList rows={3} height="60px" />;
  }

  if (!data.mintThanksTokens || data.mintThanksTokens.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        {txType === "sent" ? "送信履歴はありません" : "受信履歴はありません"}
      </div>
    );
  }

  if (isNamesLoading && namesByAddress.size === 0) {
    return <HistorySkeletonList rows={3} height="60px" />;
  }

  return (
    <div className="flex w-full flex-col gap-2">
      {data.mintThanksTokens.map((token) => (
        <ThanksTokenItem
          treeId={token.workspaceId || ""}
          key={`${txType}_${token.id}`}
          from={token.from}
          to={token.to}
          hatId={token.id}
          amount={token.amount}
          timestamp={token.blockTimestamp}
          fromUser={namesByAddress.get(token.from.toLowerCase())}
          toUser={namesByAddress.get(token.to.toLowerCase())}
        />
      ))}
    </div>
  );
};
