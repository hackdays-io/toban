import { Box, Stack, Text } from "@chakra-ui/react";
import { hatIdDecimalToHex, hatIdToTreeId } from "@hatsprotocol/sdk-v1-core";
import { useNavigate } from "@remix-run/react";
import { AnimatePresence, motion } from "framer-motion";
import { useBigBang } from "hooks/useBigBang";
import {
  useUploadHatsDetailsToIpfs,
  useUploadImageFileToIpfs,
} from "hooks/useIpfs";
import { useActiveWallet } from "hooks/useWallet";
import { type FC, useState } from "react";
import type {
  HatsDetailsAttributes,
  HatsDetailsAuthorities,
  HatsDetailsResponsabilities,
} from "types/hats";
import { ipfs2https } from "utils/ipfs";
import type { Address } from "viem";
import { BasicButton } from "~/components/BasicButton";
import { ContentContainer } from "~/components/ContentContainer";
import { PageHeader } from "~/components/PageHeader";
import { RoleAttributesList } from "~/components/RoleAttributesList";
import { InputDescription } from "~/components/input/InputDescription";
import { InputImage } from "~/components/input/InputImage";
import { InputName } from "~/components/input/InputName";
import { InputNumber } from "~/components/input/InputNumber";
import { AddRoleAttributeDialog } from "~/components/roleAttributeDialog/AddRoleAttributeDialog";
import { RoleImageLibrarySelector } from "~/components/roles/RoleImageLibrarySelector";

const MotionBox = motion(Box);

const WorkspaceNew: FC = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [workspaceData, setWorkspaceData] = useState<{
    details: string;
    imageUri?: string;
  }>();

  // Role creation states
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [roleMaxSupply, setRoleMaxSupply] = useState<number | undefined>(10);
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [responsibilities, setResponsibilities] =
    useState<HatsDetailsResponsabilities>([]);
  const [authorities, setAuthorities] = useState<HatsDetailsAuthorities>([]);
  const [selectedImageCid, setSelectedImageCid] = useState("");

  const { uploadHatsDetailsToIpfs } = useUploadHatsDetailsToIpfs();
  const { uploadImageFileToIpfs, imageFile, setImageFile } =
    useUploadImageFileToIpfs();
  const {
    uploadImageFileToIpfs: uploadRoleImageFileToIpfs,
    imageFile: roleImageFile,
    setImageFile: setRoleImageFile,
  } = useUploadImageFileToIpfs();
  const { bigbang } = useBigBang();
  const { wallet } = useActiveWallet();
  const navigate = useNavigate();

  const handleUploadWorkspaceData = async () => {
    if (!wallet) {
      alert("ウォレットを接続してください。");
      return;
    }
    if (!name) {
      alert("名前を入力してください。");
      return;
    }
    setIsLoading(true);

    try {
      const workspaceMetadata = await uploadHatsDetailsToIpfs({
        name,
        description,
        responsabilities: [],
        authorities: [],
      });
      if (!workspaceMetadata) {
        throw new Error("Failed to upload metadata to ipfs");
      }

      const workspaceImage = await uploadImageFileToIpfs();

      setWorkspaceData({
        details: workspaceMetadata.ipfsUri,
        imageUri: workspaceImage?.ipfsUri,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWorkspaceWithRole = async () => {
    if (!wallet) {
      alert("ウォレットを接続してください。");
      return;
    }
    if (!workspaceData) {
      alert("ワークスペースデータが見つかりません。");
      return;
    }
    if (!roleName) {
      alert("ロール名を入力してください。");
      return;
    }

    setIsCreatingRole(true);

    try {
      // Upload role metadata to IPFS
      const roleMetadata = await uploadHatsDetailsToIpfs({
        name: roleName,
        description: roleDescription,
        responsabilities: responsibilities,
        authorities: authorities,
      });
      if (!roleMetadata) {
        throw new Error("Failed to upload role metadata to ipfs");
      }

      // Upload role image to IPFS
      const roleImage = await uploadRoleImageFileToIpfs();

      // Execute bigbang with workspace and role data
      const parsedLog = await bigbang({
        owner: wallet?.account.address as Address,
        topHatDetails: workspaceData.details,
        topHatImageURI: workspaceData.imageUri || "",
        hatterHatDetails: workspaceData.details,
        hatterHatImageURI: workspaceData.imageUri || "",
        memberHatDetails: roleMetadata.ipfsUri,
        memberHatImageURI:
          roleImage?.ipfsUri ||
          (selectedImageCid && `ipfs://${selectedImageCid}`) ||
          "",
      });
      if (!parsedLog) {
        throw new Error("Failed to execute bigbang");
      }

      const { topHatId, memberHatId } = parsedLog.args;
      const treeId = hatIdToTreeId(topHatId);
      // wait for 3 seconds to ensure the subgraph is updated
      await new Promise((resolve) => setTimeout(resolve, 3000));
      navigate(`/${treeId}/${hatIdDecimalToHex(memberHatId)}`);
    } catch (error) {
      console.error(error);
      alert(`エラーが発生しました。${error}`);
    } finally {
      setIsCreatingRole(false);
    }
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      h="calc(100vh - 72px)"
      w="100%"
      overflow="hidden"
    >
      {/* Fixed Header */}
      <Box w="100%" bg="white" position="sticky" top={0} zIndex={10}>
        {!workspaceData ? (
          <PageHeader title="ワークスペースを新規作成" />
        ) : (
          <PageHeader title="最初のロールを作成" />
        )}
      </Box>

      {/* Scrollable Content */}
      <Box flex="1" overflowY="auto" pb={4} position="relative">
        <AnimatePresence mode="wait">
          {!workspaceData ? (
            <MotionBox
              key="workspace-form"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              w="100%"
            >
              <Box
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                gapY={4}
                mt={10}
                data-testid="workspace-creation-form"
              >
                <InputImage
                  imageFile={imageFile}
                  setImageFile={setImageFile}
                  data-testid="file-input"
                />
                <InputName
                  name={name}
                  setName={setName}
                  data-testid="workspace-name-input"
                />
                <InputDescription
                  description={description}
                  setDescription={setDescription}
                  data-testid="description-input"
                />
              </Box>
            </MotionBox>
          ) : (
            <MotionBox
              key="role-form"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              w="100%"
            >
              <ContentContainer>
                <Stack my="30px" gap={3}>
                  <InputImage
                    imageFile={
                      roleImageFile || ipfs2https(`ipfs://${selectedImageCid}`)
                    }
                    setImageFile={setRoleImageFile}
                    data-testid="role-file-input"
                  />

                  <RoleImageLibrarySelector
                    setImageCid={(cid) => {
                      setRoleImageFile(null);
                      setSelectedImageCid(cid);
                    }}
                    selectedCid={selectedImageCid}
                  />
                </Stack>

                <InputName
                  name={roleName}
                  setName={setRoleName}
                  data-testid="role-name-input"
                />

                <InputDescription
                  description={roleDescription}
                  setDescription={setRoleDescription}
                  mt={6}
                  data-testid="role-description-input"
                />
              </ContentContainer>

              <Text mt={7}>当番</Text>
              <ContentContainer>
                <RoleAttributesList
                  items={responsibilities || []}
                  setItem={(
                    index: number,
                    value: HatsDetailsAttributes[number],
                  ) => {
                    const newResponsibilities = [...(responsibilities || [])];
                    newResponsibilities[index] = value;
                    setResponsibilities(newResponsibilities);
                  }}
                  deleteItem={(index: number) => {
                    const newResponsibilities = (responsibilities || []).filter(
                      (_, i) => i !== index,
                    );
                    setResponsibilities(newResponsibilities);
                  }}
                />
                <AddRoleAttributeDialog
                  type="responsibility"
                  attributes={responsibilities || []}
                  setAttributes={(newAttributes) => {
                    setResponsibilities([
                      ...(responsibilities || []),
                      ...newAttributes,
                    ]);
                  }}
                />
              </ContentContainer>

              <Text mt={7}>権限</Text>
              <ContentContainer>
                <RoleAttributesList
                  items={authorities || []}
                  setItem={(
                    index: number,
                    value: HatsDetailsAttributes[number],
                  ) => {
                    const newAuthorities = [...(authorities || [])];
                    newAuthorities[index] = value;
                    setAuthorities(newAuthorities);
                  }}
                  deleteItem={(index: number) => {
                    const newAuthorities = (authorities || []).filter(
                      (_, i) => i !== index,
                    );
                    setAuthorities(newAuthorities);
                  }}
                />
                <AddRoleAttributeDialog
                  type="authority"
                  attributes={authorities || []}
                  setAttributes={(newAttributes) => {
                    setAuthorities([...(authorities || []), ...newAttributes]);
                  }}
                />
              </ContentContainer>

              <Text mt={7}>ロールの上限人数</Text>
              <ContentContainer>
                <InputNumber
                  mt={3}
                  number={roleMaxSupply}
                  setNumber={setRoleMaxSupply}
                  defaultValue={10}
                />
              </ContentContainer>
            </MotionBox>
          )}
        </AnimatePresence>
      </Box>

      {/* Fixed Footer */}
      <Box w="100%" bg="white" position="sticky" bottom={0} py={4} zIndex={10}>
        {!workspaceData ? (
          <BasicButton
            onClick={handleUploadWorkspaceData}
            disabled={!name}
            loading={isLoading}
            w="100%"
          >
            次へ
          </BasicButton>
        ) : (
          <BasicButton
            onClick={handleCreateWorkspaceWithRole}
            disabled={!roleName || !roleMaxSupply}
            loading={isCreatingRole}
            w="100%"
          >
            作成
          </BasicButton>
        )}
      </Box>
    </Box>
  );
};

export default WorkspaceNew;
