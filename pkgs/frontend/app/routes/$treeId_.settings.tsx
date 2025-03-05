import type { ApolloQueryResult } from "@apollo/client/core";
import { Box, Flex, HStack, Input, Text } from "@chakra-ui/react";
import type { Hat, Tree } from "@hatsprotocol/sdk-v1-subgraph";
import { useParams } from "@remix-run/react";
import axios from "axios";
import {
  SettingsSection,
  SettingsSubSection,
} from "~/components/SettingSections";
import type { GetWorkspaceQuery } from "gql/graphql";
import type { Exact, Scalars } from "gql/graphql";
import { useAddressesByNames, useNamesByAddresses } from "hooks/useENS";
import { useHats, useTreeInfo } from "hooks/useHats";
import {
  useGrantCreateHatAuthority,
  useRevokeCreateHatAuthority,
} from "hooks/useHatsHatCreatorModule";
import {
  useGrantOperationAuthority,
  useRevokeOperationAuthority,
} from "hooks/useHatsTimeFrameModule";
import {
  useUploadHatsDetailsToIpfs,
  useUploadImageFileToIpfs,
} from "hooks/useIpfs";
import type { WalletType } from "hooks/useWallet";
import { useActiveWallet } from "hooks/useWallet";
import { useGetWorkspace } from "hooks/useWorkspace";
import type { NameData } from "namestone-sdk";
import { type FC, useCallback, useEffect, useMemo, useState } from "react";
import { FaCircleCheck } from "react-icons/fa6";
import { toast } from "react-toastify";
import type { HatsDetailSchama } from "types/hats";
import { ipfs2https } from "utils/ipfs";
import { abbreviateAddress, isValidEthAddress } from "utils/wallet";
import type { Address, TransactionReceipt } from "viem";
import { PageHeader } from "~/components/PageHeader";
import { CommonButton } from "~/components/common/CommonButton";
import { CommonInput } from "~/components/common/CommonInput";
import { CommonTextArea } from "~/components/common/CommonTextarea";
import { UserIcon } from "~/components/icon/UserIcon";
import { WorkspaceIcon } from "~/components/icon/WorkspaceIcon";

interface ActionButtonWrapperWithoutChildrenProps {
  buttonText: string;
  color?: string;
  backgroundColor?: string;
  onClick: () => void;
  isLoading: boolean;
  isDisabled?: boolean;
}

interface ActionButtonWrapperProps
  extends React.PropsWithChildren<ActionButtonWrapperWithoutChildrenProps> {}

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
    resolvedAddress?: string | undefined;
  }
> = ({
  placeholder = "",
  inputAccount,
  setInputAccount,
  buttonText,
  resolvedAddress,
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
    <Box width="100%">
      <CommonInput
        placeholder={placeholder}
        value={inputAccount}
        onChange={(e) => setInputAccount(e.target.value)}
      />
      <HStack
        mt={1}
        fontSize="sm"
        justifyContent="end"
        color="blue.300"
        visibility={resolvedAddress ? "visible" : "hidden"}
      >
        <FaCircleCheck />
        <Text color="gray.500">
          {resolvedAddress
            ? abbreviateAddress(resolvedAddress)
            : "address not found"}
        </Text>
      </HStack>
    </Box>
  </ActionButtonWrapper>
);

const RoleSubSection: FC<{
  authorities:
    | {
        address: string;
        authorised: boolean;
        [key: string]: unknown;
      }[]
    | undefined;
  headingText: string;
  remove: (address: Address) => Promise<TransactionReceipt | undefined>;
  add: (address: Address) => Promise<TransactionReceipt | undefined>;
  isLoadingRemove: boolean;
  isLoadingAdd: boolean;
  isRemoveSuccess: boolean;
  isAddSuccess: boolean;
  refetch: (
    variables?:
      | Partial<
          Exact<{
            workspaceId: Scalars["ID"]["input"];
          }>
        >
      | undefined,
  ) => Promise<ApolloQueryResult<GetWorkspaceQuery>>;
}> = ({
  authorities,
  headingText,
  remove,
  add,
  isLoadingRemove,
  isLoadingAdd,
  isRemoveSuccess,
  isAddSuccess,
  refetch,
}) => {
  const [currentAuthoritiesAddresses, setCurrentAuthoritiesAddresses] =
    useState<string[]>([]);
  const [currentAuthoritiesAccounts, setCurrentAuthoritiesAccounts] = useState<
    NameData[][]
  >([]);
  const [newAuthority, setNewAuthority] = useState<string>("");
  const { fetchNames } = useNamesByAddresses(currentAuthoritiesAddresses);
  const { fetchAddresses } = useAddressesByNames(undefined, true);
  const [address, setAddress] = useState<string | undefined>(undefined);

  const setAuthority = useCallback(async () => {
    if (!authorities) return;
    const addresses = authorities?.map((authority) => authority.address);
    if (addresses) {
      setCurrentAuthoritiesAddresses(addresses);

      const accounts = await fetchNames(addresses);
      setCurrentAuthoritiesAccounts(accounts as NameData[][]);
    } else {
      setCurrentAuthoritiesAddresses([]);
      setCurrentAuthoritiesAccounts([]);
    }
  }, [authorities, fetchNames]);

  useEffect(() => {
    setAuthority();
  }, [setAuthority]);

  useEffect(() => {
    const refetchData = async () => {
      const { data } = await refetch();
      console.log("data", data);
    };

    if (isRemoveSuccess || isAddSuccess) {
      refetchData();
      toast.success(
        "権限の変更が完了しました。反映には時間がかかる場合があります。",
      );
    }
  }, [isRemoveSuccess, isAddSuccess, refetch]);

  useEffect(() => {
    const resolveAddress = async () => {
      let targetAddress = undefined;
      if (newAuthority !== "") {
        if (isValidEthAddress(newAuthority)) {
          targetAddress = newAuthority;
        } else {
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
  }, [newAuthority, fetchAddresses, address]);

  return (
    <SettingsSubSection headingText={headingText}>
      <Box>
        {currentAuthoritiesAccounts.map((accountArr) => {
          const account = accountArr[0];
          if (!account) return null;
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
                  userImageUrl={ipfs2https(account?.text_records?.avatar)}
                />
                <Box flexGrow={1}>
                  <Text textStyle="sm">{account?.name}</Text>
                  <Text textStyle="sm">
                    {abbreviateAddress(account?.address || "")}
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
          resolvedAddress={address}
          onClick={() => add(address as Address)}
          isLoading={isLoadingAdd}
          isDisabled={!address}
        />
      </Box>
    </SettingsSubSection>
  );
};

interface WorkspaceOverviewSettingsProps {
  wallet: WalletType;
  treeInfo: Tree | undefined;
}

const WorkspaceOverviewSettings: FC<WorkspaceOverviewSettingsProps> = ({
  wallet,
  treeInfo,
}) => {
  const { uploadImageFileToIpfs, imageFile, setImageFile } =
    useUploadImageFileToIpfs();
  const { uploadHatsDetailsToIpfs } = useUploadHatsDetailsToIpfs();
  const { changeHatDetails, changeHatImageURI } = useHats();

  const [topHat, setTopHat] = useState<Hat | undefined>(undefined);
  const [workspaceImgUrl, setWorkspaceImgUrl] = useState<string | undefined>(
    undefined,
  );
  const [workspaceName, setWorkspaceName] = useState<string>("");
  const [workspaceDescription, setWorkspaceDescription] = useState<string>("");
  const [currentWorkspaceDetails, setCurrentWorkspaceDetails] = useState<
    HatsDetailSchama | undefined
  >(undefined);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const computedTopHat = treeInfo?.hats?.find(
      (hat) => hat.levelAtLocalTree === 0,
    );
    if (computedTopHat !== topHat) setTopHat(computedTopHat);
  }, [treeInfo, topHat]);

  useEffect(() => {
    const setInitialWorkspaceImgUrl = async () => {
      if (!topHat?.imageUri) return;
      const url = ipfs2https(topHat.imageUri);
      if (url !== workspaceImgUrl) setWorkspaceImgUrl(url);
    };
    setInitialWorkspaceImgUrl();
  }, [topHat, workspaceImgUrl]);

  useEffect(() => {
    const setInitialWorkspaceStates = async () => {
      if (!topHat?.details) return;
      const { data } = await axios.get<HatsDetailSchama>(
        ipfs2https(topHat.details) || "",
      );
      const name = data.data.name;
      const description = data.data.description;
      setWorkspaceName(name);
      setCurrentWorkspaceDetails(data);
      setWorkspaceDescription(description ?? "");
    };
    setInitialWorkspaceStates();
  }, [topHat]);

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
      workspaceName !== currentWorkspaceDetails?.data.name ||
      workspaceDescription !== currentWorkspaceDetails?.data.description
    );
  }, [workspaceName, workspaceDescription, currentWorkspaceDetails]);

  const changeDetails = useCallback(async () => {
    if (!topHat) return;
    if (!isChangedDetails) return;

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
  }, [
    topHat,
    isChangedDetails,
    changeHatDetails,
    uploadHatsDetailsToIpfs,
    workspaceName,
    workspaceDescription,
    currentWorkspaceDetails,
  ]);

  const changeImage = useCallback(async () => {
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
  }, [topHat, changeHatImageURI, uploadImageFileToIpfs]);

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
      const requestArray = [];
      if (isChangedDetails) requestArray.push(changeDetails());
      if (imageFile) requestArray.push(changeImage());
      await Promise.all(requestArray);
      toast.success("ワークスペースの設定を保存しました。");
    } catch (error) {
      console.error(error);
      toast.error("設定の保存に失敗しました。");
    }
    setIsLoading(false);
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
          <WorkspaceIcon workspaceImageUrl={workspaceImgUrl} />
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
        disabled={
          !workspaceName ||
          !workspaceDescription ||
          (!isChangedDetails && !imageFile)
        }
        loading={isLoading}
      >
        保存
      </CommonButton>
    </SettingsSection>
  );
};

interface WorkspaceAuthoritiesSettingsProps {
  wallet: WalletType;
  treeId: string | undefined;
  treeInfo: Tree | undefined;
}

const WorkspaceAuthoritiesSettings: FC<WorkspaceAuthoritiesSettingsProps> = ({
  wallet,
  treeId,
  treeInfo,
}) => {
  const { data, refetch } = useGetWorkspace(
    treeId,
    { authorised: true },
    { authorised: true },
  );
  const {
    grantCreateHatAuthority,
    isLoading: isGrantCreateHatAuthorityLoading,
    isSuccess: isGrantCreateHatAuthoritySuccess,
  } = useGrantCreateHatAuthority(
    data?.workspace?.hatsHatCreatorModule?.id as Address,
  );
  const {
    revokeCreateHatAuthority,
    isLoading: isRevokeCreateHatAuthorityLoading,
    isSuccess: isRevokeCreateHatAuthoritySuccess,
  } = useRevokeCreateHatAuthority(
    data?.workspace?.hatsHatCreatorModule?.id as Address,
  );
  const {
    grantOperationAuthority,
    isLoading: isGrantOperationAuthorityLoading,
    isSuccess: isGrantOperationAuthoritySuccess,
  } = useGrantOperationAuthority(
    data?.workspace?.hatsTimeFrameModule?.id as Address,
  );
  const {
    revokeOperationAuthority,
    isLoading: isRevokeOperationAuthorityLoading,
    isSuccess: isRevokeOperationAuthoritySuccess,
  } = useRevokeOperationAuthority(
    data?.workspace?.hatsTimeFrameModule?.id as Address,
  );
  const {
    transferHat,
    isLoading: isTransferHatLoading,
    isSuccess: isTransferHatSuccess,
  } = useHats();
  const { getWearersInfo } = useHats();

  const [topHat, setTopHat] = useState<Hat | undefined>(undefined);
  const [owner, setOwner] = useState<string | undefined>(undefined);
  const [newOwner, setNewOwner] = useState<string>("");
  const [createHatAuthorities, setCreateHatAuthorities] = useState<
    | {
        address: string;
        authorised: boolean;
        [key: string]: unknown;
      }[]
    | undefined
  >(undefined);
  const [operationAuthorities, setOperationAuthorities] = useState<
    | {
        address: string;
        authorised: boolean;
        [key: string]: unknown;
      }[]
    | undefined
  >(undefined);

  useEffect(() => {
    setCreateHatAuthorities(data?.workspace?.hatsHatCreatorModule?.authorities);
    setOperationAuthorities(data?.workspace?.hatsTimeFrameModule?.authorities);
  }, [data]);

  useEffect(() => {
    const computedTopHat = treeInfo?.hats?.find(
      (hat) => hat.levelAtLocalTree === 0,
    );
    if (computedTopHat !== topHat) setTopHat(computedTopHat);
  }, [treeInfo, topHat]);

  useEffect(() => {
    const fetchTophatWearer = async () => {
      if (!topHat) return;
      const wearerInfo = await getWearersInfo({ hatId: topHat.id });
      setOwner(wearerInfo?.[0].id);
    };
    fetchTophatWearer();
  }, [topHat, getWearersInfo]);

  useEffect(() => {
    if (isTransferHatSuccess) {
      setOwner(newOwner);
    }
  }, [isTransferHatSuccess, newOwner]);

  return (
    <SettingsSection headingText="ワークスペースの権限">
      <RoleSubSection
        authorities={createHatAuthorities}
        headingText="役割の新規作成"
        remove={revokeCreateHatAuthority}
        add={grantCreateHatAuthority}
        isLoadingRemove={isRevokeCreateHatAuthorityLoading}
        isLoadingAdd={isGrantCreateHatAuthorityLoading}
        isRemoveSuccess={isRevokeCreateHatAuthoritySuccess}
        isAddSuccess={isGrantCreateHatAuthoritySuccess}
        refetch={refetch}
      />
      <RoleSubSection
        authorities={operationAuthorities}
        headingText="役割の割当・休止・剥奪"
        remove={revokeOperationAuthority}
        add={grantOperationAuthority}
        isLoadingRemove={isRevokeOperationAuthorityLoading}
        isLoadingAdd={isGrantOperationAuthorityLoading}
        isRemoveSuccess={isRevokeOperationAuthoritySuccess}
        isAddSuccess={isGrantOperationAuthoritySuccess}
        refetch={refetch}
      />
      <SettingsSubSection headingText="オーナー（注意して変更してください）">
        <InputAddressWithButton
          placeholder={owner}
          inputAccount={newOwner}
          buttonText="変更"
          color="white"
          backgroundColor="orange.500"
          setInputAccount={setNewOwner}
          onClick={() => {
            wallet &&
              topHat &&
              transferHat({
                hatId: BigInt(topHat.id),
                from: wallet.account.address as Address,
                to: newOwner as Address,
              });
          }}
          isLoading={isTransferHatLoading}
          isDisabled={!wallet || !topHat || !isValidEthAddress(newOwner)}
        />
      </SettingsSubSection>
    </SettingsSection>
  );
};

const WorkspaceSettings: FC = () => {
  const { wallet } = useActiveWallet();
  const { treeId } = useParams();
  const treeInfo = useTreeInfo(Number(treeId));

  return (
    <Box width="100%" pb={10}>
      <PageHeader title="ワークスペース設定" />
      <WorkspaceOverviewSettings wallet={wallet} treeInfo={treeInfo} />
      <WorkspaceAuthoritiesSettings
        wallet={wallet}
        treeId={treeId}
        treeInfo={treeInfo}
      />
    </Box>
  );
};

export default WorkspaceSettings;
