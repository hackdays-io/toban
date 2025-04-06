import { Box, Grid, Heading, Image, Stack, Text } from "@chakra-ui/react";
import { useNavigate, useParams } from "@remix-run/react";
import { useHats } from "hooks/useHats";
import { useCreateHatFromHatCreatorModule } from "hooks/useHatsHatCreatorModule";
import {
  useUploadHatsDetailsToIpfs,
  useUploadImageFileToIpfs,
} from "hooks/useIpfs";
import { useActiveWallet } from "hooks/useWallet";
import { useGetWorkspace } from "hooks/useWorkspace";
import { type FC, useCallback, useState } from "react";
import type {
  HatsDetailsAuthorities,
  HatsDetailsResponsabilities,
} from "types/hats";
import type { Address } from "viem";
import { BasicButton } from "~/components/BasicButton";
import { ContentContainer } from "~/components/ContentContainer";
import { PageHeader } from "~/components/PageHeader";
import { RoleAttributesList } from "~/components/RoleAttributesList";
import CommonButton from "~/components/common/CommonButton";
import { CommonDialog } from "~/components/common/CommonDialog";
import { InputDescription } from "~/components/input/InputDescription";
import { InputImage } from "~/components/input/InputImage";
import { InputName } from "~/components/input/InputName";
import { AddRoleAttributeDialog } from "~/components/roleAttributeDialog/AddRoleAttributeDialog";
import { DialogCloseTrigger } from "~/components/ui/dialog";

const SectionHeading: FC<{ children: React.ReactNode }> = ({ children }) => (
  <Text mt={7}>{children}</Text>
);

const NewRole: FC = () => {
  const { treeId } = useParams();

  const { uploadImageFileToIpfs, imageFile, setImageFile } =
    useUploadImageFileToIpfs();

  const [imageLibId, setImageLibId] = useState<string | null>(null);
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");

  const [responsibilities, setResponsibilities] = useState<
    NonNullable<HatsDetailsResponsabilities>
  >([]);

  const [authorities, setAuthorities] = useState<
    NonNullable<HatsDetailsAuthorities>
  >([]);
  const { wallet } = useActiveWallet();
  const [isLoading, setIsLoading] = useState(false);
  const { data: workspace } = useGetWorkspace(treeId);
  const { createHat, isLoading: isCreating } = useCreateHatFromHatCreatorModule(
    workspace?.workspace?.hatsHatCreatorModule?.id as Address,
  );
  const { uploadHatsDetailsToIpfs } = useUploadHatsDetailsToIpfs();
  const { getTreeInfo } = useHats();
  const navigate = useNavigate();

  const handleSubmit = useCallback(async () => {
    if (!wallet) {
      alert("ウォレットを接続してください。");
      return;
    }
    if (!roleName) {
      alert("ロール名を入力してください。");
      return;
    }

    try {
      setIsLoading(true);

      const [resUploadHatsDetails, resUploadImage, treeInfo] =
        await Promise.all([
          uploadHatsDetailsToIpfs({
            name: roleName,
            description: roleDescription,
            responsabilities: responsibilities,
            authorities: authorities,
          }),
          uploadImageFileToIpfs(),
          getTreeInfo({ treeId: Number(treeId) }),
        ]);

      if (!resUploadHatsDetails)
        throw new Error("Failed to upload metadata to ipfs");

      const hatterHatId = treeInfo?.hats?.[1]?.id;
      if (!hatterHatId) throw new Error("Hat ID is required");

      const parsedLog = await createHat({
        parentHatId: BigInt(hatterHatId),
        details: resUploadHatsDetails?.ipfsUri,
        imageURI:
          resUploadImage?.ipfsUri ||
          `ipfs://${imageLibrary.find((image) => image.id === imageLibId)?.cid}` ||
          "",
      });
      const log = parsedLog?.find((log) => log.eventName === "HatCreated");
      if (!log) throw new Error("Failed to create hat transaction");
      setTimeout(() => {
        const hatIdLength = log.args.id?.toString(16).length || 0;
        const requiredPadding = 64 - hatIdLength;
        navigate(
          `/${treeId}/0x${"0".repeat(
            requiredPadding,
          )}${log.args.id?.toString(16)}`,
        );
      }, 3000);
    } catch (error) {
      console.error(error);
      alert(`エラーが発生しました。${error}`);
      setIsLoading(false);
    }
  }, [
    authorities,
    createHat,
    navigate,
    responsibilities,
    roleName,
    roleDescription,
    treeId,
    uploadHatsDetailsToIpfs,
    uploadImageFileToIpfs,
    wallet,
    getTreeInfo,
    imageLibId,
  ]);

  const imageLibrary = [
    {
      id: "rpg1",
      url: "/images/imagelib/rpg1.png",
      cid: "bafybeignhscpeh55e7y2iva3eliuqugmgve2hfkxb43yg72brdnlexutti",
    },
    {
      id: "rpg2",
      url: "/images/imagelib/rpg2.png",
      cid: "bafybeibfdgmu525swbw644j5i4cnqkf5lxql24qwjc47ilctdvhkmue7ne",
    },
    {
      id: "rpg3",
      url: "/images/imagelib/rpg3.png",
      cid: "bafybeigudaq4m4xpoocgisen6adfynuhcei2piuw3bs4zahvit7zcv3nuy",
    },
    {
      id: "rpg4",
      url: "/images/imagelib/rpg4.png",
      cid: "bafybeicyvdsgjh4gxlzfqyrf47viq2cyr4dwswfjwcgcxipvalz2xqarni",
    },
  ];

  return (
    <>
      <Box w="100%">
        <PageHeader title="新しいロールを作成" />
        <ContentContainer>
          <Stack my="30px" gap={3}>
            <InputImage
              imageFile={
                imageFile ||
                imageLibrary.find((image) => image.id === imageLibId)?.url ||
                null
              }
              setImageFile={setImageFile}
            />
            <CommonDialog
              dialogTriggerReactNode={
                <CommonButton size="xs" bgColor="blue.300">
                  便利な素材から選択
                </CommonButton>
              }
            >
              <DialogCloseTrigger />
              <Box p={4}>
                <Heading fontSize="lg">役割画像ライブラリ</Heading>

                <Grid
                  gridTemplateColumns={"repeat(auto-fill, minmax(100px, 1fr))"}
                  gap={4}
                  mt={4}
                >
                  {imageLibrary.map((image) => (
                    <Box
                      key={`image${image.cid}`}
                      onClick={() => setImageLibId(image.id)}
                      position="relative"
                    >
                      <Image src={image.url} alt="" />
                      {imageLibId === image.id && (
                        <Box
                          position="absolute"
                          top={0}
                          left={0}
                          width="100%"
                          height="100%"
                          bgColor="blackAlpha.600"
                          _before={{
                            content: '"Selected"',
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            color: "white",
                            fontSize: "lg",
                          }}
                        />
                      )}
                    </Box>
                  ))}
                </Grid>
              </Box>
            </CommonDialog>
          </Stack>
          <InputName name={roleName} setName={setRoleName} />
          <InputDescription
            description={roleDescription}
            setDescription={setRoleDescription}
            mt={6}
          />
        </ContentContainer>
        <SectionHeading>役割</SectionHeading>
        <ContentContainer>
          <RoleAttributesList
            items={responsibilities}
            setItems={setResponsibilities}
          />
          <AddRoleAttributeDialog
            type="responsibility"
            attributes={responsibilities}
            setAttributes={setResponsibilities}
          />
        </ContentContainer>
        <SectionHeading>権限</SectionHeading>
        <ContentContainer>
          <RoleAttributesList items={authorities} setItems={setAuthorities} />
          <AddRoleAttributeDialog
            type="authority"
            attributes={authorities}
            setAttributes={setAuthorities}
          />
        </ContentContainer>
        <Box
          mt={10}
          mb="4vh"
          width="100%"
          display="flex"
          flexDirection="column"
          alignItems="center"
        >
          <BasicButton
            onClick={handleSubmit}
            disabled={!roleName}
            loading={isLoading}
          >
            作成
          </BasicButton>
        </Box>
      </Box>
    </>
  );
};

export default NewRole;
