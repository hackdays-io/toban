import {hatsDetailsClient} from "@/lib/hats";
import {DefaultHatsDetailsSchema, HatsResponsibility} from "@/types/hats";
import {useCallback, useMemo} from "react";

export const useUploadHatDetail = () => {
  const uploadHatDetail = async (
    name: string,
    description: string,
    responsabilities: HatsResponsibility[] = []
  ) => {
    const metadata: DefaultHatsDetailsSchema = {
      type: "1.0",
      data: {
        name: name,
        description: description,
        responsabilities: responsabilities,
        authorities: [],
      },
    };
    const cid = await hatsDetailsClient.pin(metadata);
    const ipfs = `ipfs://${cid}`;
    return {cid, ipfs};
  };

  return {uploadHatDetail};
};
