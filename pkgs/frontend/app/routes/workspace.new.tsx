import { FC, useState } from "react";
import { Box, Float, Input, Text } from "@chakra-ui/react";
import { HiOutlinePlus } from "react-icons/hi2";
import { CommonInput } from "~/components/common/CommonInput";
import { BasicButton } from "~/components/BasicButton";
import { CommonTextArea } from "~/components/common/CommonTextarea";
import {
  useUploadMetadataToIpfs,
  useUploadImageFileToIpfs,
} from "hooks/useIpfs";
import { useNavigate } from "@remix-run/react";
import { CommonIcon } from "~/components/common/CommonIcon";
import { useBigBang } from "hooks/useBigBang";
import { useActiveWallet } from "hooks/useWallet";
import { Address } from "viem";
import { hatIdToTreeId } from "@hatsprotocol/sdk-v1-core";

const WorkspaceNew: FC = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { uploadMetadataToIpfs } = useUploadMetadataToIpfs();
  const { uploadImageFileToIpfs, imageFile, setImageFile } =
    useUploadImageFileToIpfs();
  const { bigbang } = useBigBang();
  const { wallet } = useActiveWallet();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!wallet) {
      alert("ウォレットを接続してください。");
      return;
    }
    if (!name || !description || !imageFile) {
      alert("全ての項目を入力してください。");
      return;
    }
    setIsLoading(true);

    try {
      const resUploadMetadata = await uploadMetadataToIpfs({
        name,
        description,
        responsibilities: "",
        authorities: "",
        eligibility: true,
        toggle: true,
      });
      if (!resUploadMetadata)
        throw new Error("Failed to upload metadata to ipfs");
      console.log(resUploadMetadata);

      const resUploadImage = await uploadImageFileToIpfs();
      if (!resUploadImage) throw new Error("Failed to upload image to ipfs");
      console.log("resUploadImage", resUploadImage);

      const parsedLog = await bigbang({
        owner: wallet?.account.address as Address,
        topHatDetails: resUploadMetadata.ipfsUri,
        topHatImageURI: resUploadImage.ipfsUri,
        hatterHatDetails: resUploadMetadata.ipfsUri,
        hatterHatImageURI: resUploadImage.ipfsUri,
      });

      const topHatId = parsedLog?.[0].args.topHatId;
      console.log("topHatId", topHatId);

      if (topHatId) {
        const treeId = hatIdToTreeId(topHatId);
        console.log(treeId);

        const treeIdStr = treeId.toString();
        console.log("treeIdStr", treeIdStr);

        navigate(`/${treeIdStr}`);
      } else {
        navigate("/workspace");
      }
    } catch (error) {
      console.error(error);
      alert("エラーが発生しました。" + error);
    } finally {
      setIsLoading(false);
    }
  };

  const EmptyImage = () => {
    return (
      <Box
        borderRadius="3xl"
        border="1px solid"
        borderColor="#1e1e1e"
        bg="#e9ecef"
        p={5}
        w={200}
        h={200}
      >
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          w="33%"
          mx="auto"
          mt={9}
          mb={1}
        >
          <HiOutlinePlus size="full" />
        </Box>
        <Text textAlign="center">画像を選択</Text>
      </Box>
    );
  };

  return (
    <>
      <Box mt={5} w="100%">
        <Text fontSize="lg">新しいワークスペースを作成</Text>
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          mt={10}
          alignItems="center"
        >
          <Box as="label" cursor="pointer" m="100px auto 40px">
            <Input
              type="file"
              accept="image/*"
              display="none"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && file.type.startsWith("image/")) {
                  setImageFile(file);
                } else {
                  alert("画像ファイルを選択してください");
                }
              }}
            />
            <CommonIcon
              imageUrl={imageFile ? URL.createObjectURL(imageFile) : undefined}
              fallbackIconComponent={<EmptyImage />}
              size={200}
              borderRadius="3xl"
            />
          </Box>
          <Box w="100%" mt={8}>
            <CommonInput
              minHeight="45px"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Box>
          <Box minH="100px" w="100%" mt={6}>
            <CommonTextArea
              minHeight="125px"
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Box>
          <Float
            placement="bottom-center"
            mb="4vh"
            width="100%"
            display="flex"
            flexDirection="column"
            alignItems="center"
          >
            <BasicButton
              onClick={handleSubmit}
              disabled={!name || !description || !imageFile}
              loading={isLoading}
            >
              作成
            </BasicButton>
          </Float>
        </Box>
      </Box>
    </>
  );
};

export default WorkspaceNew;
