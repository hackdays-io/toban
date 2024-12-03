import { Box } from "@chakra-ui/react";
import type { MetaFunction } from "@remix-run/node";
import { CommonButton } from "~/components/common/CommonButton";
import { useBigBang } from "hooks/useBigBang";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export default function Index() {
  const { bigbang, isLoading } = useBigBang();

  const handleBigBang = async () => {
    const res = await bigbang({
      owner: "0xdCb93093424447bF4FE9Df869750950922F1E30B",
      topHatDetails: "Top Hat Details",
      topHatImageURI: "https://example.com/top-hat.png",
      hatterHatDetails: "Hatter Hat Details",
      hatterHatImageURI: "https://example.com/hatter-hat.png",
      trustedForwarder: "0x1234567890123456789012345678901234567890",
    });

    console.log(res);
  };

  return (
    <Box textAlign="center" fontSize="xl" pt="30vh">
      <CommonButton loading={isLoading} onClick={handleBigBang}>
        BigBang
      </CommonButton>
    </Box>
  );
}
