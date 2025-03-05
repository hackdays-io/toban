import { Box, Flex, Input, Text } from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useState, type FC } from "react";
import { PageHeader } from "../components/PageHeader";
import { useActiveWallet } from "../../hooks/useWallet";
import { useParams } from "@remix-run/react";
import type { WalletType } from "../../hooks/useWallet";
import type { Hat, Tree } from "@hatsprotocol/sdk-v1-subgraph";
import { useUploadImageFileToIpfs } from "../../hooks/useIpfs";
import { useTreeInfo } from "../../hooks/useHats";
import { ipfs2https } from "../../utils/ipfs";
import { toast } from "react-toastify";
import CommonButton from "../components/common/CommonButton";
import { CommonInput } from "../components/common/CommonInput";
import { CommonTextArea } from "../components/common/CommonTextarea";
import {
  SettingsSection,
  SettingsSubSection,
} from "../components/SettingSections";
import {
  useActiveWalletIdentity,
  useAddressesByNames,
  useUpdateName,
} from "../../hooks/useENS";
import { UserIcon } from "../components/icon/UserIcon";
import type { TextRecords } from "namestone-sdk";

interface WorkspaceOverviewSettingsProps {
  wallet: WalletType;
  treeInfo: Tree | undefined;
}

const WorkspaceOverviewSettings: FC<WorkspaceOverviewSettingsProps> = ({
  wallet,
  treeInfo,
}) => {
  const {
    uploadImageFileToIpfs,
    imageFile,
    setImageFile,
    isLoading: isIpfsLoading,
  } = useUploadImageFileToIpfs();
  const { identity } = useActiveWalletIdentity();

  const [topHat, setTopHat] = useState<Hat | undefined>(undefined);
  const [workspaceImgUrl, setWorkspaceImgUrl] = useState<string | undefined>(
    undefined,
  );
  const [workspaceName, setWorkspaceName] = useState<string>("");
  const [workspaceDescription, setWorkspaceDescription] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const { updateName, isLoading: isUpdateNameLoading } = useUpdateName();

  const names = useMemo(() => {
    return workspaceName ? [workspaceName] : [];
  }, [workspaceName]);
  const { addresses } = useAddressesByNames(names, true);

  useEffect(() => {
    const computedTopHat = treeInfo?.hats?.find(
      (hat) => hat.levelAtLocalTree === 0,
    );
    if (computedTopHat !== topHat) setTopHat(computedTopHat);
  }, [treeInfo, topHat]);

  useEffect(() => {
    const setInitialWorkspaceImgUrl = async () => {
      const avatar = identity?.text_records?.avatar;
      if (avatar) setWorkspaceImgUrl(ipfs2https(avatar));
    };
    setInitialWorkspaceImgUrl();
  }, [identity]);

  useEffect(() => {
    const setInitialWorkspaceStates = async () => {
      if (identity?.name) {
        const name = identity.name;
        setWorkspaceName(name);
      }
      if (identity?.text_records?.description) {
        const description = identity.text_records.description;
        setWorkspaceDescription(description);
      }
    };
    setInitialWorkspaceStates();
  }, [identity]);

  const handleUploadImg = (file: File | undefined) => {
    if (!file?.type?.startsWith("image/")) {
      alert("画像ファイルを選択してください");
      return;
    }
    const imgUrl = file ? URL.createObjectURL(file) : undefined;
    setImageFile(file);
    setWorkspaceImgUrl(imgUrl);
  };

  const isChangedDetails = useMemo(() => {
    return (
      workspaceName !== identity?.name ||
      workspaceDescription !== identity?.text_records?.description ||
      imageFile
    );
  }, [workspaceName, workspaceDescription, identity, imageFile]);

  const availableName = useMemo(() => {
    if (!workspaceName) return false;
    return addresses?.[0]?.length === 0 || identity?.name === workspaceName;
  }, [workspaceName, addresses, identity]);

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
    if (!workspaceName) {
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
        name: workspaceName ?? identity.name,
        address: wallet.account?.address,
        text_records: {
          avatar: ipfsUri ?? identity?.text_records?.avatar ?? "",
          description: workspaceDescription,
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
    workspaceName,
    workspaceDescription,
    identity,
    imageFile,
    uploadImage,
    updateName,
  ]);

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
          <UserIcon userImageUrl={workspaceImgUrl} />
        </Box>
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
      </Flex>
      <SettingsSubSection headingText="名前">
        <CommonInput
          // placeholder={workspaceName}
          value={workspaceName}
          onChange={(e) => setWorkspaceName(e.target.value)}
        />
      </SettingsSubSection>
      <SettingsSubSection headingText="自己紹介">
        <CommonTextArea
          minHeight="80px"
          // placeholder={workspaceDescription}
          value={workspaceDescription}
          onChange={(e) => setWorkspaceDescription(e.target.value)}
        />
      </SettingsSubSection>
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
    </SettingsSection>
  );
};

const MemberProfile: FC = () => {
  const { wallet } = useActiveWallet();
  const { treeId } = useParams();
  const treeInfo = useTreeInfo(Number(treeId));
  return (
    <Box width="100%" pb={10}>
      <PageHeader title="プロフィール" />
      <WorkspaceOverviewSettings wallet={wallet} treeInfo={treeInfo} />
    </Box>
  );
};

export default MemberProfile;
