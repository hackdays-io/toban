import { Box, Grid } from "@chakra-ui/react";
import { hatIdToTreeId } from "@hatsprotocol/sdk-v1-core";
import { useNavigate } from "@remix-run/react";
import { useBigBang } from "hooks/useBigBang";
import {
  useUploadHatsDetailsToIpfs,
  useUploadImageFileToIpfs,
} from "hooks/useIpfs";
import { useActiveWallet } from "hooks/useWallet";
import { type FC, useState } from "react";
import type { Address } from "viem";
import { BasicButton } from "~/components/BasicButton";
import { PageHeader } from "~/components/PageHeader";
import { InputDescription } from "~/components/input/InputDescription";
import { InputImage } from "~/components/input/InputImage";
import { InputName } from "~/components/input/InputName";

const WorkspaceNew: FC = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { uploadHatsDetailsToIpfs } = useUploadHatsDetailsToIpfs();
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
    if (!name) {
      alert("名前を入力してください。");
      return;
    }
    setIsLoading(true);

    try {
      const resUploadMetadata = await uploadHatsDetailsToIpfs({
        name,
        description,
        responsabilities: [],
        authorities: [],
      });
      if (!resUploadMetadata)
        throw new Error("Failed to upload metadata to ipfs");

      const resUploadImage = await uploadImageFileToIpfs();
      console.log("resUploadImage", resUploadImage);

      const parsedLog = await bigbang({
        owner: wallet?.account.address as Address,
        topHatDetails: resUploadMetadata.ipfsUri,
        topHatImageURI: resUploadImage?.ipfsUri || "",
        hatterHatDetails: resUploadMetadata.ipfsUri,
        hatterHatImageURI: resUploadImage?.ipfsUri || "",
      });

      const topHatId = parsedLog?.args.topHatId;

      if (topHatId) {
        const treeId = hatIdToTreeId(BigInt(topHatId));
        const treeIdStr = treeId.toString();

        setTimeout(() => {
          navigate(`/${treeIdStr}`);
        }, 3000);
      } else {
        navigate("/workspace");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Grid gridTemplateRows="1fr auto" h="calc(100vh - 72px)">
      <Box w="100%">
        <PageHeader title="ワークスペースを新規作成" />
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          mt={10}
          alignItems="center"
          data-testid="workspace-creation-form"
        >
          <InputImage imageFile={imageFile} setImageFile={setImageFile} data-testid="file-input" />
          <InputName name={name} setName={setName} data-testid="workspace-name-input" />
          <InputDescription
            description={description}
            setDescription={setDescription}
            mt={6}
            data-testid="description-input"
          />
        </Box>
      </Box>
      <BasicButton
        onClick={handleSubmit}
        disabled={!name}
        loading={isLoading}
        mb={5}
      >
        作成
      </BasicButton>
    </Grid>
  );
};

export default WorkspaceNew;
