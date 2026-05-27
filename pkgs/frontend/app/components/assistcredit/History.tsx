import { OrderDirection, TransferFractionToken_OrderBy } from "gql/graphql";
import type { GetTransferFractionTokensQuery } from "gql/graphql";
import { useNamesByAddresses } from "hooks/useENS";
import { useGetTransferFractionTokens } from "hooks/useFractionToken";
import { useGetHat } from "hooks/useHats";
import { type FC, useMemo } from "react";
import { Link } from "react-router";
import type { HatsDetailSchama } from "types/hats";
import { ipfs2https } from "utils/ipfs";
import { abbreviateAddress } from "utils/wallet";
import { HatsListItemParser } from "../common/HatsListItemParser";
import { UserIcon } from "../icon/UserIcon";

interface Props {
  treeId: string;
  limit?: number;
}

interface UserProps extends Props {
  userAddress: string;
  data: GetTransferFractionTokensQuery | undefined;
  txType: "sent" | "received";
}

interface ItemProps {
  treeId: string;
  from: string;
  to: string;
  hatId: string;
  amount: number;
  timestamp: number;
}

interface AssistCreditTextProps {
  detail?: HatsDetailSchama;
}

const AssistCreaditText: FC<AssistCreditTextProps> = ({ detail }) => {
  return <span className="text-xs leading-none">{detail?.data.name}</span>;
};

const AssistCreditItem: FC<ItemProps> = ({
  treeId,
  from,
  to,
  amount,
  hatId,
}) => {
  const addresses = useMemo(() => {
    return [from, to];
  }, [from, to]);

  const { names } = useNamesByAddresses(addresses);

  const fromUser = useMemo(() => {
    return names?.[0]?.[0];
  }, [names]);

  const toUser = useMemo(() => {
    return names?.[1]?.[0];
  }, [names]);

  const { hat } = useGetHat(hatId);

  return (
    <div className="relative h-[60px] w-full overflow-hidden rounded-[5px] border-[color:var(--color-gray-200,#e5e7eb)] bg-blue-100 px-2 py-3">
      <div className="absolute top-0 left-0 h-full w-[55%] bg-blue-300 opacity-50" />
      <span
        aria-hidden
        className="absolute top-0 mr-2 inline-block h-0 w-0 border-y-[30px] border-l-[60px] border-y-transparent border-l-blue-300 opacity-50"
        style={{ left: "55%" }}
      />
      <div className="relative grid grid-cols-[37.5%_25%_37.5%] items-center justify-between">
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
          <HatsListItemParser imageUri={hat?.imageUri} detailUri={hat?.details}>
            <AssistCreaditText />
          </HatsListItemParser>
          <p className="text-lg font-semibold text-blue-600">
            {amount} <span className="text-xs">points</span>
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

/**
 * ワークスペース全体のサンクストークン履歴を表示するコンポーネント
 */
export const AssistCreditHistory: FC<Props> = ({ treeId, limit }) => {
  const { data } = useGetTransferFractionTokens({
    where: {
      workspaceId: treeId,
    },
    orderBy: TransferFractionToken_OrderBy.BlockTimestamp,
    orderDirection: OrderDirection.Desc,
    first: limit,
  });

  return (
    <div className="flex w-full flex-col items-stretch gap-2">
      {data?.transferFractionTokens.map((token) => (
        <AssistCreditItem
          treeId={treeId}
          key={`th_${token.id}`}
          from={token.from}
          to={token.to}
          hatId={token.tokenId}
          amount={token.amount}
          timestamp={token.blockTimestamp}
        />
      ))}
    </div>
  );
};

/**
 * ユーザーのサンクストークン履歴を表示するコンポーネント
 * txType が "sent" の場合は送信履歴、"received" の場合は受信履歴を表示する
 */
export const UserAssistCreditHistory: FC<UserProps> = ({ data, txType }) => {
  if (
    !data?.transferFractionTokens ||
    data.transferFractionTokens.length === 0
  ) {
    return (
      <div className="p-4 text-center text-gray-500">
        {txType === "sent" ? "送信履歴はありません" : "受信履歴はありません"}
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-stretch gap-2">
      {data.transferFractionTokens.map((token) => (
        <AssistCreditItem
          treeId={token.workspaceId || ""}
          key={`${txType}_${token.id}`}
          from={token.from}
          to={token.to}
          hatId={token.tokenId}
          amount={token.amount}
          timestamp={token.blockTimestamp}
        />
      ))}
    </div>
  );
};
