import { Box, Grid, Heading, Image } from "@chakra-ui/react";
import type { FC } from "react";
import CommonButton from "../common/CommonButton";
import { CommonDialog } from "../common/CommonDialog";
import { DialogCloseTrigger } from "../ui/dialog";

interface Props {
  setImageCid: (cid: string) => void;
  selectedCid: string;
}

export const RoleImageLibrarySelector: FC<Props> = ({
  setImageCid,
  selectedCid,
}) => {
  const imageLibrary = [
    {
      url: "/images/imagelib/rpg1.png",
      cid: "bafybeignhscpeh55e7y2iva3eliuqugmgve2hfkxb43yg72brdnlexutti",
    },
    {
      url: "/images/imagelib/rpg2.png",
      cid: "bafybeibfdgmu525swbw644j5i4cnqkf5lxql24qwjc47ilctdvhkmue7ne",
    },
    {
      url: "/images/imagelib/rpg3.png",
      cid: "bafybeigudaq4m4xpoocgisen6adfynuhcei2piuw3bs4zahvit7zcv3nuy",
    },
    {
      url: "/images/imagelib/rpg4.png",
      cid: "bafybeicyvdsgjh4gxlzfqyrf47viq2cyr4dwswfjwcgcxipvalz2xqarni",
    },
  ];

  return (
    <>
      <CommonDialog
        dialogTriggerReactNode={
          <CommonButton size="xs" bgColor="blue.300">
            便利な素材から選択
          </CommonButton>
        }
      >
        <DialogCloseTrigger />
        <Box p={4}>
          <Heading fontSize="lg">当番画像ライブラリ</Heading>

          <Grid
            gridTemplateColumns={"repeat(auto-fill, minmax(100px, 1fr))"}
            gap={4}
            mt={4}
          >
            {imageLibrary.map((image) => (
              <Box
                key={`image${image.cid}`}
                onClick={() => setImageCid(image.cid)}
                position="relative"
              >
                <Image src={image.url} alt="" />
                {selectedCid === image.cid && (
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
    </>
  );
};
