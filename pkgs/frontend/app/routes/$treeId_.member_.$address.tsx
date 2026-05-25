import {
  MintThanksToken_OrderBy,
  OrderDirection,
  TransferFractionToken_OrderBy,
} from "gql/graphql";
import { useIdentity } from "hooks/useENS";
import { useGetTransferFractionTokens } from "hooks/useFractionToken";
import { useTreeInfo } from "hooks/useHats";
import { useGetMintThanksTokens } from "hooks/useThanksToken";
import { type FC, useMemo, useState } from "react";
import { useParams } from "react-router";
import { abbreviateAddress } from "utils/wallet";
import { UserAssistCreditHistory } from "~/components/assistcredit/History";
import { Breadcrumb } from "~/components/composite/breadcrumb";
import { PageContainer } from "~/components/layout/PageContainer";
import { MemberDetailContent } from "~/components/members/MemberDetailContent";
import { UserThanksHistory } from "~/components/thankstoken/History";
import { cn } from "~/lib/utils";

interface UserHistoryComponentProps {
  treeId: string | undefined;
  address: string | undefined;
}

interface TabButtonProps {
  isActive: boolean;
  onClick: () => void;
  label: string;
  isLeftTab?: boolean;
}

const TabButton: FC<TabButtonProps> = ({
  isActive,
  onClick,
  label,
  isLeftTab = false,
}) => (
  <button
    type="button"
    role="tab"
    aria-selected={isActive}
    onClick={onClick}
    className={cn(
      "cursor-pointer px-4 py-2 transition-colors",
      isLeftTab ? "rounded-l-md border-r border-white" : "rounded-r-md",
      isActive
        ? "bg-blue-100 font-bold text-blue-600"
        : "bg-gray-100 font-medium text-gray-600 hover:bg-gray-200",
    )}
  >
    {label}
  </button>
);

// Assist-credit + thanks transaction history. Carried over from the previous
// member profile page.
export const UserHistoryComponent: FC<UserHistoryComponentProps> = ({
  treeId,
  address,
}) => {
  const TX_HISTORY_LIMIT = 5;

  const [assistCreditActiveTab, setAssistCreditActiveTab] = useState<
    "sent" | "received"
  >("received");

  const [thanksTokenActiveTab, setThanksTokenActiveTab] = useState<
    "sent" | "received"
  >("received");

  const normalizedAddress = useMemo(
    () => (address ? address.toLowerCase() : address),
    [address],
  );

  const { data: receivedAssistTokenData } = useGetTransferFractionTokens({
    where: {
      workspaceId: treeId,
      to: normalizedAddress,
    },
    orderBy: TransferFractionToken_OrderBy.BlockTimestamp,
    orderDirection: OrderDirection.Desc,
    first: TX_HISTORY_LIMIT,
  });

  const { data: sentAssistTokenData } = useGetTransferFractionTokens({
    where: {
      workspaceId: treeId,
      from: normalizedAddress,
    },
    orderBy: TransferFractionToken_OrderBy.BlockTimestamp,
    orderDirection: OrderDirection.Desc,
    first: TX_HISTORY_LIMIT,
  });

  const { data: receivedThanksTokenData } = useGetMintThanksTokens({
    where: {
      workspaceId: treeId,
      to: normalizedAddress,
    },
    orderBy: MintThanksToken_OrderBy.BlockTimestamp,
    orderDirection: OrderDirection.Desc,
    first: TX_HISTORY_LIMIT,
  });

  const { data: sentThanksTokenData } = useGetMintThanksTokens({
    where: {
      workspaceId: treeId,
      from: normalizedAddress,
    },
    orderBy: MintThanksToken_OrderBy.BlockTimestamp,
    orderDirection: OrderDirection.Desc,
    first: TX_HISTORY_LIMIT,
  });

  return (
    <div className="mt-10 mb-12">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-base font-medium text-gray-600">
          {["144", "175", "780"].includes(treeId || "")
            ? "ケアポイント"
            : "ロールシェア"}
          履歴
        </p>
        <div className="flex">
          <TabButton
            isActive={assistCreditActiveTab === "received"}
            onClick={() => setAssistCreditActiveTab("received")}
            label="受信"
            isLeftTab={true}
          />
          <TabButton
            isActive={assistCreditActiveTab === "sent"}
            onClick={() => setAssistCreditActiveTab("sent")}
            label="送信"
          />
        </div>
      </div>

      {treeId && address && (
        <div className="mt-4">
          <UserAssistCreditHistory
            data={
              assistCreditActiveTab === "received"
                ? receivedAssistTokenData
                : sentAssistTokenData
            }
            treeId={treeId}
            userAddress={address}
            limit={TX_HISTORY_LIMIT}
            txType={assistCreditActiveTab}
          />
        </div>
      )}

      <div className="mt-4 mb-4 flex items-center justify-between">
        <p className="text-base font-medium text-gray-600">
          サンクストークン履歴
        </p>
        <div className="flex">
          <TabButton
            isActive={thanksTokenActiveTab === "received"}
            onClick={() => setThanksTokenActiveTab("received")}
            label="受信"
            isLeftTab={true}
          />
          <TabButton
            isActive={thanksTokenActiveTab === "sent"}
            onClick={() => setThanksTokenActiveTab("sent")}
            label="送信"
          />
        </div>
      </div>

      {treeId && address && (
        <div className="mt-4">
          <UserThanksHistory
            data={
              thanksTokenActiveTab === "received"
                ? receivedThanksTokenData
                : sentThanksTokenData
            }
            treeId={treeId}
            userAddress={address}
            limit={TX_HISTORY_LIMIT}
            txType={thanksTokenActiveTab}
          />
        </div>
      )}
    </div>
  );
};

const MemberProfile: FC = () => {
  const { treeId, address } = useParams();
  const tree = useTreeInfo(Number(treeId));
  const { identity } = useIdentity(address);

  const memberLabel =
    identity?.name ??
    (address ? abbreviateAddress(address as `0x${string}`) : "メンバー");

  return (
    <PageContainer className="pt-2 pb-10 md:pt-4">
      <Breadcrumb
        className="mb-3 px-1"
        items={[
          { label: "ホーム", to: `/${treeId}` },
          { label: "メンバー", to: `/${treeId}/member` },
          { label: memberLabel },
        ]}
      />

      <div className="mx-auto flex max-w-2xl flex-col gap-6 pt-1">
        <MemberDetailContent
          treeId={treeId ?? ""}
          address={address ?? ""}
          tree={tree}
        />
        {treeId && address && (
          <UserHistoryComponent treeId={treeId} address={address} />
        )}
      </div>
    </PageContainer>
  );
};

export default MemberProfile;
