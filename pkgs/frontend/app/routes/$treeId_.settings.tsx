import { Box, Text, Flex, Input } from "@chakra-ui/react";
import { Hat } from "@hatsprotocol/sdk-v1-subgraph";
import { useParams } from "@remix-run/react";
import axios from "axios";
import { useAddressesByNames, useNamesByAddresses } from "hooks/useENS";
import { useHats, useTreeInfo } from "hooks/useHats";
import { useUploadHatsDetailsToIpfs, useUploadImageFileToIpfs } from "hooks/useIpfs";
import { useActiveWallet } from "hooks/useWallet";
import { useGetWorkspace } from "hooks/useWorkspace";
import { useEffect, useState, type FC } from "react";
import { HatsDetailSchama } from "types/hats";
import { ipfs2https } from "utils/ipfs";
import { abbreviateAddress, isValidEthAddress } from "utils/wallet";
import { CommonButton } from "~/components/common/CommonButton";
import { CommonInput } from "~/components/common/CommonInput";
import { CommonTextArea } from "~/components/common/CommonTextarea";
import { UserIcon } from "~/components/icon/UserIcon";
import { WorkspaceIcon } from "~/components/icon/WorkspaceIcon";
import { PageHeader } from "~/components/PageHeader";
import { useGrantCreateHatAuthority, useRevokeCreateHatAuthority } from "hooks/useHatsHatCreatorModule";
import { Address, TransactionReceipt } from "viem";
import { useGrantOperationAuthority, useRevokeOperationAuthority } from "hooks/useHatsTimeFrameModule";

const SettingsSection: FC<{ children: React.ReactNode; headingText: string }> = ({
  children,
  headingText,
}) => (
  <Box mt={2} mb={12}>
    <Text fontSize="md" fontWeight="medium" color="gray.600">
      {headingText}
    </Text>
    {children}
  </Box>
);

const SettingsSubSection: FC<{ children: React.ReactNode; headingText: string }> = ({
  children,
  headingText,
}) => (
  <Box mt={3} mb={5}>
    <Text mb={3} fontSize="sm" fontWeight="medium" color="gray.600">
      {headingText}
    </Text>
    {children}
  </Box>
);

interface ActionButtonWrapperWithoutChildrenProps {
  buttonText: string;
  color?: string;
  backgroundColor?: string;
  onClick: () => void;
  isLoading: boolean;
  isDisabled?: boolean;
}

interface ActionButtonWrapperProps extends React.PropsWithChildren<ActionButtonWrapperWithoutChildrenProps> {}

const ActionButtonWrapper: FC<ActionButtonWrapperProps> = ({
  children,
  buttonText,
  color = "gray.800",
  backgroundColor = "yellow.400",
  onClick,
  isLoading,
  isDisabled,
}) => (
  <Flex gap={2.5} mb={3.5}>
    {children}
    <Box>
      <CommonButton
        color={color}
        backgroundColor={backgroundColor}
        onClick={onClick}
        loading={isLoading}
        disabled={isDisabled}
      >
        {buttonText}
      </CommonButton>
    </Box>
  </Flex>
);

const InputAddressWithButton: FC<
  ActionButtonWrapperWithoutChildrenProps & {
    placeholder?: string;
    inputAccount: string;
    setInputAccount: (account: string) => void;
  }
> = ({
  placeholder = "",
  inputAccount,
  setInputAccount,
  buttonText,
  color = "gray.800",
  backgroundColor = "yellow.400",
  onClick,
  isLoading,
  isDisabled,
}) => (
  <ActionButtonWrapper
    buttonText={buttonText}
    color={color}
    backgroundColor={backgroundColor}
    onClick={onClick}
    isLoading={isLoading}
    isDisabled={isDisabled}
  >
    <CommonInput
      placeholder={placeholder}
      value={inputAccount}
      onChange={(e) => setInputAccount(e.target.value)}
    />
  </ActionButtonWrapper>
);

interface Account {
  name: string;
  address: string;
  [key: string]: unknown;
}
const RoleSubSection: FC<{
  authorities: {
    address: string;
    authorised: boolean;
    [key: string]: unknown;
  }[] | undefined,
  headingText: string;
  remove: (address: Address) => Promise<TransactionReceipt | undefined>;
  add: (address: Address) => Promise<TransactionReceipt | undefined>;
  isLoadingRemove: boolean;
  isLoadingAdd: boolean;
}> = ({
  authorities,
  headingText,
  remove,
  add,
  isLoadingRemove,
  isLoadingAdd,
}) => {
  const [currentAuthoritiesAddresses, setCurrentAuthoritiesAddresses] = useState<string[]>([]);
  const [currentAuthoritiesAccounts, setCurrentAuthoritiesAccounts] = useState<Account[][]>([]);
  const [newAuthority, setNewAuthority] = useState<string>("");
  const { names, fetchNames } = useNamesByAddresses(currentAuthoritiesAddresses);
  const { fetchAddresses } = useAddressesByNames(undefined, true);
  const [address, setAddress] = useState<string | undefined>(undefined);

  useEffect(() => {
    const setInitialAuthority = async (
    ) => {
      if (!authorities) return;
      // @todo authorised === true の filter は graphql と ts のどちらで行うか？
      const addresses = authorities?.map((authority) => authority.address);
      if (addresses !== currentAuthoritiesAddresses) {
        if (addresses) {
          setCurrentAuthoritiesAddresses(addresses);

          const accounts = await fetchNames(addresses);
          setCurrentAuthoritiesAccounts(accounts as Account[][]);
        } else {
          setCurrentAuthoritiesAddresses([]);
          setCurrentAuthoritiesAccounts([]);
        }
      }
    }

    setInitialAuthority();
  }, [authorities, fetchNames]);

  useEffect(() => {
    const resolveAddress = async () => {
      let targetAddress = undefined;
      if (newAuthority !== "") {
        if (isValidEthAddress(newAuthority)) {
          targetAddress = newAuthority;
        } else if (!newAuthority.startsWith("0x")) {
          // @todo 0x で始まる名前（例：0x-yawn）は resolve しなくてよいのか検討
          const addressesData = await fetchAddresses([newAuthority]);
          const resolvedAddress = addressesData?.[0]?.[0]?.address;
          if (resolvedAddress) {
            targetAddress = resolvedAddress;
          }
        }
      }
      if (targetAddress !== address) {
        setAddress(targetAddress);
      }
      console.log("targetAddress:", targetAddress);
    };

    resolveAddress();
  }, [newAuthority, fetchAddresses]);

  return (
    <SettingsSubSection headingText={headingText}>
      <Box mb={8}>
        {currentAuthoritiesAccounts.map((accountArr) => {
          const account = accountArr[0];
          const name = names.find(
            (name) => name[0]?.address === account.address,
          )?.[0];
          return (
            <ActionButtonWrapper
              key={account.address}
              buttonText="削除"
              backgroundColor="red.300"
              onClick={() => remove(account.address as Address)}
              isLoading={isLoadingRemove}
            >
              <Flex width="100%" alignItems="center" gap={2}>
                <UserIcon
                  size="40px"
                  userImageUrl={ipfs2https(name?.text_records?.avatar)}
                />
                <Box flexGrow={1}>
                  <Text textStyle="sm">{name?.name}</Text>
                  <Text textStyle="sm">
                    {abbreviateAddress(name?.address || "")}
                  </Text>
                </Box>
              </Flex>
            </ActionButtonWrapper>
          );
        })}
        <InputAddressWithButton
          placeholder="ユーザー名 or ウォレットアドレス"
          inputAccount={newAuthority}
          setInputAccount={setNewAuthority}
          buttonText="追加"
          onClick={() => add(address as Address)}
          isLoading={isLoadingAdd}
          isDisabled={!address}
        />
      </Box>
    </SettingsSubSection>
  );
};

const WorkspaceOverviewSettings: FC = () => {
  const { treeId } = useParams();
  const treeInfo = useTreeInfo(Number(treeId));
  const { uploadImageFileToIpfs, imageFile, setImageFile } =
    useUploadImageFileToIpfs();
  const { uploadHatsDetailsToIpfs } = useUploadHatsDetailsToIpfs();
  const { wallet } = useActiveWallet();
  const { changeHatDetails, changeHatImageURI } = useHats();

  const [topHat, setTopHat] = useState<Hat | undefined>(undefined);
  const [workspaceImgUrl, setWorkspaceImgUrl] = useState<string | undefined>(undefined);
  const [workspaceName, setWorkspaceName] = useState<string>("");
  const [workspaceDescription, setWorkspaceDescription] = useState<string>("");
  const [currentWorkspaceDetails, setCurrentWorkspaceDetails] = useState<HatsDetailSchama | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const computedTopHat = treeInfo?.hats?.find((hat) => hat.levelAtLocalTree === 0);
    if (computedTopHat !== topHat) setTopHat(computedTopHat);
  }, [treeInfo]);

  useEffect(() => {
    const setInitialWorkspaceImgUrl = async () => {
      if (!topHat?.imageUri) return;
      const url = ipfs2https(topHat.imageUri);
      if (url !== workspaceImgUrl) setWorkspaceImgUrl(url);
    }
    setInitialWorkspaceImgUrl();
  }, [topHat]);

  useEffect(() => {
    const setInitialWorkspaceStates = async () => {
      if (!topHat?.details) return;
      const { data } = await axios.get<HatsDetailSchama>(
        ipfs2https(topHat.details) || "",
      );
      const name = data.data.name;
      const description = data.data.description;
      if (name !== workspaceName) setWorkspaceName(name);
      if (data !== currentWorkspaceDetails) setCurrentWorkspaceDetails(data);
      if (description !== workspaceDescription) setWorkspaceDescription(description ?? "");
    }
    setInitialWorkspaceStates();
  }, [topHat]);

  const handleUploadImg = (file: File | undefined) => {
    if (!file?.type?.startsWith("image/")) {
      alert("画像ファイルを選択してください");
      return;
    }
    const imgUrl = file
      ? URL.createObjectURL(file)
      : undefined;
    setImageFile(file);
    setWorkspaceImgUrl(imgUrl);
  }

  const isChangedDetails = () => {
    return (
      workspaceName !== currentWorkspaceDetails?.data.name ||
      workspaceDescription !== currentWorkspaceDetails?.data.description
    );
  };

  const changeDetails = async () => {
    if (!topHat) return;
    const isChanged = isChangedDetails();
    if (!isChanged) return;

    const resUploadHatsDetails = await uploadHatsDetailsToIpfs({
      name: workspaceName,
      description: workspaceDescription,
      responsabilities: currentWorkspaceDetails?.data.responsabilities,
      authorities: currentWorkspaceDetails?.data.authorities,
    });
    if (!resUploadHatsDetails)
      throw new Error("Failed to upload metadata to ipfs");
    const ipfsUri = resUploadHatsDetails.ipfsUri;
    console.log("ipfsUri", ipfsUri);
    const parsedLog = await changeHatDetails({
      hatId: BigInt(topHat.id),
      newDetails: ipfsUri,
    });
    if (!parsedLog) throw new Error("Failed to change hat details");
    console.log("parsedLog", parsedLog);
  };

  const changeImage = async () => {
    if (!topHat) return;
    const resUploadImage = await uploadImageFileToIpfs();
    if (!resUploadImage) throw new Error("Failed to upload image to ipfs");
    const ipfsUri = resUploadImage.ipfsUri;
    console.log("ipfsUri", ipfsUri);
    const parsedLog = await changeHatImageURI({
      hatId: BigInt(topHat.id),
      newImageURI: ipfsUri,
    });
    if (!parsedLog) throw new Error("Failed to change hat image");
    console.log("parsedLog", parsedLog);
  };

  const handleSubmit = async () => {
    if (!wallet) {
      alert("ウォレットを接続してください。");
      return;
    }
    if (!workspaceName || !workspaceDescription) {
      alert("全ての項目を入力してください。");
      return;
    }

    try {
      setIsLoading(true);
      await Promise.all([changeDetails(), changeImage()]);
    } catch (error) {
      console.error(error);
      alert(`エラーが発生しました。${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SettingsSection headingText="ワークスペースの概要">
      <Flex mt={8} width="100%" gap={8} alignItems="center">
        <Box
          mb={4}
          minW="120px"
          maxW="200px"
          w="20%"
          aspectRatio={1}
          bg="gray.100"
          borderRadius="3xl"
        >
          <WorkspaceIcon
            workspaceImageUrl={workspaceImgUrl}
          />
        </Box>
        <Box>
          <CommonButton as="label">
            <Input
              type="file"
              accept="image/*"
              display="none"
              onChange={(e) => {
                handleUploadImg(e.target.files?.[0])
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
      <SettingsSubSection headingText="説明">
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
        disabled={!workspaceName || !workspaceDescription ||
        (!isChangedDetails() && !imageFile)
        }
        loading={isLoading}
      >
        保存
      </CommonButton>
    </SettingsSection>
  );
};

const WorkspaceAuthoritiesSettings: FC = () => {
  const { treeId } = useParams();
  const { data } = useGetWorkspace(treeId);

  const { grantCreateHatAuthority, isLoading: isGrantCreateHatAuthorityLoading } = useGrantCreateHatAuthority(data?.workspace?.hatsHatCreatorModule?.id as Address);
  const { revokeCreateHatAuthority, isLoading: isRevokeCreateHatAuthorityLoading } = useRevokeCreateHatAuthority(data?.workspace?.hatsHatCreatorModule?.id as Address);
  const { grantOperationAuthority, isLoading: isGrantOperationAuthorityLoading } = useGrantOperationAuthority(data?.workspace?.hatsTimeFrameModule?.id as Address);
  const { revokeOperationAuthority, isLoading: isRevokeOperationAuthorityLoading } = useRevokeOperationAuthority(data?.workspace?.hatsTimeFrameModule?.id as Address);
  const [newOwner, setNewOwner] = useState<string>("");

  const createHatAuthorities = data?.workspace?.hatsHatCreatorModule?.authorities;
  const operationAuthorities = data?.workspace?.hatsTimeFrameModule?.authorities;

  return (
    <SettingsSection headingText="ワークスペースの権限">
      <RoleSubSection
        authorities={createHatAuthorities}
        headingText="役割の新規作成"
        remove={revokeCreateHatAuthority}
        add={grantCreateHatAuthority}
        isLoadingRemove={isRevokeCreateHatAuthorityLoading}
        isLoadingAdd={isGrantCreateHatAuthorityLoading}
      />
      <RoleSubSection
        authorities={operationAuthorities}
        headingText="役割の割当・休止・剥奪"
        remove={revokeOperationAuthority}
        add={grantOperationAuthority}
        isLoadingRemove={isRevokeOperationAuthorityLoading}
        isLoadingAdd={isGrantOperationAuthorityLoading}
      />
      <SettingsSubSection headingText="オーナー（注意して変更してください）">
        <InputAddressWithButton
          // placeholder="0x1234567890"
          inputAccount={newOwner}
          buttonText="変更"
          color="white"
          backgroundColor="orange.500"
          setInputAccount={setNewOwner}
          onClick={() => {}}
          isLoading={false}
          isDisabled={!isValidEthAddress(newOwner)}
        />
      </SettingsSubSection>
    </SettingsSection>
  )
}

const WorkspaceSettings: FC = () => {
  return (
    <Box width="100%" pb={10}>
      <PageHeader title="ワークスペース設定" />
      <WorkspaceOverviewSettings />
      <WorkspaceAuthoritiesSettings />
    </Box>
  );
};

export default WorkspaceSettings;
