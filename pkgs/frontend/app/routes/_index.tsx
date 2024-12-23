import { Box, Input } from "@chakra-ui/react";
import type { MetaFunction } from "@remix-run/node";
import { CommonButton } from "~/components/common/CommonButton";
import { useBigBang } from "hooks/useBigBang";
import {
  useUploadMetadataToIpfs,
  useUploadImageFileToIpfs,
} from "hooks/useIpfs";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export default function Index() {
  const { bigbang, isLoading } = useBigBang();
  const { uploadMetadataToIpfs, isLoading: isUploadingMetadataToIpfs } =
    useUploadMetadataToIpfs();
  const {
    uploadImageFileToIpfs,
    setImageFile,
    isLoading: isUploadingImageFileToIpfs,
  } = useUploadImageFileToIpfs();

  const handleBigBang = async () => {
    const res = await bigbang({
      owner: "0xdCb93093424447bF4FE9Df869750950922F1E30B",
      topHatDetails: "Top Hat Details",
      topHatImageURI: "https://example.com/top-hat.png",
      hatterHatDetails: "Hatter Hat Details",
      hatterHatImageURI: "https://example.com/hatter-hat.png",
    });

    console.log(res);
  };

  const metadata = {
    name: "Toban test",
    description: "Toban test",
    responsibilities: "Toban test",
    authorities: "Toban test",
    eligibility: true,
    toggle: true,
  };

  return (
    <Box textAlign="center" fontSize="xl" pt="30vh">
      <CommonButton loading={isLoading} onClick={handleBigBang}>
        BigBang
      </CommonButton>
      <CommonButton
        loading={isUploadingMetadataToIpfs}
        onClick={() => uploadMetadataToIpfs(metadata)}
      >
        Upload Metadata to IPFS
      </CommonButton>
      <Input
        type="file"
        accept="image/*"
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setImageFile(e.target.files?.[0] || null)
        }
      />
      <CommonButton
        loading={isUploadingImageFileToIpfs}
        onClick={uploadImageFileToIpfs}
      >
        Upload Image File to IPFS
      </CommonButton>
    </Box>
  );
}
