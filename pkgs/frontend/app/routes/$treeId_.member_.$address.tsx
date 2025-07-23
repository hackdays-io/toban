import { Box, Flex, Input, Text } from "@chakra-ui/react";
import type { Hat, Tree } from "@hatsprotocol/sdk-v1-subgraph";
import { useParams } from "@remix-run/react";
import { OrderDirection, TransferFractionToken_OrderBy } from "gql/graphql";
import { useGetTransferFractionTokens } from "hooks/useFractionToken";
import type { TextRecords } from "namestone-sdk";
import { type FC, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  useAddressesByNames,
  useIdentity,
  useUpdateName,
} from "../../hooks/useENS";
import { useTreeInfo } from "../../hooks/useHats";
import { useUploadImageFileToIpfs } from "../../hooks/useIpfs";
import { useActiveWallet } from "../../hooks/useWallet";
import type { WalletType } from "../../hooks/useWallet";
import { ipfs2https } from "../../utils/ipfs";
import { PageHeader } from "../components/PageHeader";
import {
  SettingsSection,
  SettingsSubSection,
} from "../components/SettingSections";
import { UserAssistCreditHistory } from "../components/assistcredit/History";
import CommonButton from "../components/common/CommonButton";
import { CommonInput } from "../components/common/CommonInput";
import { CommonTextArea } from "../components/common/CommonTextarea";
import { UserIcon } from "../components/icon/UserIcon";

interface ProfileOverviewSettingsProps {
  wallet: WalletType;
  treeInfo: Tree | undefined;
  address: string | undefined;
}

const ProfileOverviewSettings: FC<ProfileOverviewSettingsProps> = ({
  wallet,
  treeInfo,
  address,
}) => {
  const me = useActiveWallet();
  const { identity } = useIdentity(address);

  const {
    uploadImageFileToIpfs,
    isLoading: isIpfsLoading,
    setImageFile,
    imageFile,
  } = useUploadImageFileToIpfs();

  const [topHat, setTopHat] = useState<Hat | undefined>(undefined);
  const [profileImgUrl, setProfileImgUrl] = useState<string | undefined>(
    undefined,
  );
  const [profileName, setProfileName] = useState<string>("");
  const [profileDescription, setProfileDescription] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const { updateName, isLoading: isUpdateNameLoading } = useUpdateName();

  const names = useMemo(() => {
    return profileName ? [profileName] : [];
  }, [profileName]);
  const { addresses } = useAddressesByNames(names, true);

  useEffect(() => {
    const computedTopHat = treeInfo?.hats?.find(
      (hat) => hat.levelAtLocalTree === 0,
    );
    if (computedTopHat !== topHat) setTopHat(computedTopHat);
  }, [treeInfo, topHat]);

  useEffect(() => {
    const setInitialProfileImgUrl = async () => {
      const avatar = identity?.text_records?.avatar;
      setProfileImgUrl(ipfs2https(avatar || ""));
    };
    setInitialProfileImgUrl();
  }, [identity]);

  useEffect(() => {
    const setInitialProfileStates = async () => {
      if (identity?.name) {
        const name = identity.name;
        setProfileName(name);
      }
      if (identity?.text_records?.description) {
        const description = identity.text_records.description;
        setProfileDescription(description);
      }
    };
    setInitialProfileStates();
  }, [identity]);

  const handleUploadImg = (file: File | undefined) => {
    if (!file?.type?.startsWith("image/")) {
      alert("画像ファイルを選択してください");
      return;
    }
    const imgUrl = file ? URL.createObjectURL(file) : undefined;
    setImageFile(file);
    setProfileImgUrl(imgUrl);
  };

  const isChangedDetails = useMemo(() => {
    return (
      profileName !== identity?.name ||
      profileDescription !== identity?.text_records?.description ||
      imageFile
    );
  }, [profileName, profileDescription, identity, imageFile]);

  const availableName = useMemo(() => {
    if (!profileName) return false;
    return addresses?.[0]?.length === 0 || identity?.name === profileName;
  }, [profileName, addresses, identity]);

  const uploadImage = useCallback(async () => {
    const resUploadImage = await uploadImageFileToIpfs();
    if (!resUploadImage) throw new Error("Failed to upload image to ipfs");
    const ipfsUri = resUploadImage.ipfsUri;
    console.log("ipfsUri", ipfsUri);

    return ipfsUri;
  }, [uploadImageFileToIpfs]);

  const handleSubmit = useCallback(async () => {
    if (!identity) {
      alert("ユーザー情報を取得できませんでした。");
      return;
    }
    if (!wallet) {
      alert("ウォレットを接続してください。");
      return;
    }
    if (!availableName) {
      alert("適切な名前を入力してください。");
      return;
    }
    if (!profileName) {
      alert("名前を入力してください。");
      return;
    }
    if (!isChangedDetails) {
      alert("変更がありません。");
      return;
    }

    try {
      setIsLoading(true);

      let ipfsUri = undefined;
      if (imageFile) {
        ipfsUri = await uploadImage();
        console.log("uploaded image", ipfsUri);
      }
      const params: {
        name: string;
        address: string;
        text_records: TextRecords;
      } = {
        name: profileName ?? identity.name,
        address: wallet.account?.address,
        text_records: {
          avatar: ipfsUri ?? identity?.text_records?.avatar ?? "",
          description: profileDescription,
        },
      };

      console.log("Attempting to update profile with params:", params);

      // Calling updateName - if it fails, it will throw an exception
      const result = await updateName(params);

      if (!result || !result.success) {
        console.error("Update failed without throwing an error", result);
        throw new Error(
          "プロフィールの更新に失敗しました。サーバー側のエラーが発生しました。",
        );
      }

      console.log("Profile updated successfully:", result);
      toast.success("プロフィールを更新しました。");
    } catch (error) {
      console.error("Failed to update profile:", error);
      const errorMessage =
        error instanceof Error ? error.message : "不明なエラー";
      toast.error(`プロフィールの更新に失敗しました: ${errorMessage}`);
      // Re-throw the error to ensure the process stops
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [
    isChangedDetails,
    wallet,
    availableName,
    profileName,
    profileDescription,
    identity,
    imageFile,
    uploadImage,
    updateName,
  ]);

  const isMe = useMemo(() => {
    return (
      address?.toLocaleLowerCase() === me?.wallet?.account.address.toLowerCase()
    );
  }, [address, me]);

  return (
    <SettingsSection headingText="プロフィールの概要">
      <Flex mt={8} width="100%" gap={8} alignItems="center">
        <Box
          mb={4}
          minW="120px"
          maxW="200px"
          w="20%"
          aspectRatio={1}
          bg="gray.100"
          borderRadius="full"
        >
          <UserIcon userImageUrl={profileImgUrl} />
        </Box>
        {isMe && (
          <Box>
            <CommonButton as="label">
              <Input
                type="file"
                accept="image/*"
                display="none"
                onChange={(e) => {
                  handleUploadImg(e.target.files?.[0]);
                }}
              />
              <Text>画像をアップロード</Text>
            </CommonButton>
          </Box>
        )}
      </Flex>
      <SettingsSubSection headingText="アドレス">
        <Text fontSize="sm" fontWeight="medium" color="gray.600" pb={2}>
          {address}
        </Text>
      </SettingsSubSection>
      <SettingsSubSection headingText="名前">
        {isMe ? (
          <CommonInput
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
          />
        ) : (
          <Text fontSize="sm" fontWeight="medium" color="gray.600" pb={2}>
            {profileName}
          </Text>
        )}
      </SettingsSubSection>
      <SettingsSubSection headingText="自己紹介">
        {isMe ? (
          <CommonTextArea
            minHeight="80px"
            value={profileDescription}
            onChange={(e) => setProfileDescription(e.target.value)}
          />
        ) : (
          <Text fontSize="sm" fontWeight="medium" color="gray.600" pb={2}>
            {profileDescription}
          </Text>
        )}
      </SettingsSubSection>
      {isMe && (
        <CommonButton
          size="lg"
          maxHeight="64px"
          minHeight="48px"
          onClick={handleSubmit}
          disabled={!isChangedDetails && !imageFile}
          loading={isLoading || isIpfsLoading || isUpdateNameLoading}
        >
          保存
        </CommonButton>
      )}
    </SettingsSection>
  );
};

interface UserHistoryComponentProps {
  treeId: string | undefined;
  address: string | undefined;
}

export const UserHistoryComponent: FC<UserHistoryComponentProps> = ({
  treeId,
  address,
}) => {
  const TX_HISTORY_LIMIT = 5;

  const [activeTab, setActiveTab] = useState<"sent" | "received">("received");

  const normalizedAddress = useMemo(
    () => (address ? address.toLowerCase() : address),
    [address],
  );

  const { data: receivedData } = useGetTransferFractionTokens({
    where: {
      workspaceId: treeId,
      to: normalizedAddress,
    },
    orderBy: TransferFractionToken_OrderBy.BlockTimestamp,
    orderDirection: OrderDirection.Desc,
    first: TX_HISTORY_LIMIT,
  });

  const { data: sentData } = useGetTransferFractionTokens({
    where: {
      workspaceId: treeId,
      from: normalizedAddress,
    },
    orderBy: TransferFractionToken_OrderBy.BlockTimestamp,
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
            : "アシストクレジット"}
          履歴
        </Text>
        <Flex>
          <TabButton
            isActive={activeTab === "received"}
            onClick={() => setActiveTab("received")}
            label="受信"
            isLeftTab={true}
          />
          <TabButton
            isActive={activeTab === "sent"}
            onClick={() => setActiveTab("sent")}
            label="送信"
          />
        </Flex>
      </Flex>

      {treeId && address && (
        <Box mt={4}>
          <UserAssistCreditHistory
            data={activeTab === "received" ? receivedData : sentData}
            treeId={treeId}
            userAddress={address}
            limit={TX_HISTORY_LIMIT}
            txType={activeTab}
          />
        </Box>
      )}
    </Box>
  );
};

const MemberProfile: FC = () => {
  const { wallet } = useActiveWallet();
  const { treeId, address } = useParams();
  const treeInfo = useTreeInfo(Number(treeId));

  return (
    <Box width="100%" pb={10}>
      <PageHeader title="プロフィール" />
      <ProfileOverviewSettings
        wallet={wallet}
        treeInfo={treeInfo}
        address={address}
      />
      <UserHistoryComponent treeId={treeId} address={address} />
    </Box>
  );
};

export default MemberProfile;
