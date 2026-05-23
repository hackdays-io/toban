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
import { Box, Flex, Text } from "~/components/chakra-shim";
import { Breadcrumb } from "~/components/composite/breadcrumb";
import { PageContainer } from "~/components/layout/PageContainer";
import { MemberDetailContent } from "~/components/members/MemberDetailContent";
import { UserThanksHistory } from "~/components/thankstoken/History";

interface UserHistoryComponentProps {
  treeId: string | undefined;
  address: string | undefined;
}

// Assist-credit + thanks transaction history. Carried over from the previous
// member profile page — its assist-credit / thanks sub-components still use the
// chakra-shim primitives; restyling that tree is out of scope for #439.
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

  // タブボタンコンポーネント
  const TabButton: FC<{
    isActive: boolean;
    onClick: () => void;
    label: string;
    isLeftTab?: boolean;
  }> = ({ isActive, onClick, label, isLeftTab = false }) => (
    <Box
      as="button"
      px={4}
      py={2}
      cursor={"pointer"}
      borderLeftRadius={isLeftTab ? "md" : "0"}
      borderRightRadius={isLeftTab ? "0" : "md"}
      fontWeight={isActive ? "bold" : "medium"}
      bg={isActive ? "blue.100" : "gray.100"}
      color={isActive ? "blue.600" : "gray.600"}
      onClick={onClick}
      borderRight={isLeftTab ? "1px solid white" : undefined}
      transition="all 0.2s"
      _hover={{
        bg: isActive ? "blue.100" : "gray.200",
      }}
      role="tab"
      aria-selected={isActive}
    >
      {label}
    </Box>
  );

  return (
    <Box mt={10} mb={12}>
      <Flex justifyContent="space-between" alignItems="center" mb={4}>
        <Text fontSize="md" fontWeight="medium" color="gray.600">
          {["144", "175", "780"].includes(treeId || "")
            ? "ケアポイント"
            : "ロールシェア"}
          履歴
        </Text>
        <Flex>
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
        </Flex>
      </Flex>

      {treeId && address && (
        <Box mt={4}>
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
        </Box>
      )}

      <Flex justifyContent="space-between" alignItems="center" mb={4} mt={4}>
        <Text fontSize="md" fontWeight="medium" color="gray.600">
          サンクストークン履歴
        </Text>
        <Flex>
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
        </Flex>
      </Flex>

      {treeId && address && (
        <Box mt={4}>
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
        </Box>
      )}
    </Box>
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
