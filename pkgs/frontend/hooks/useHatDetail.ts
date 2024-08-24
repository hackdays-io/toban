import {hatsDetailsClient} from "@/lib/hats";
import {DefaultHatsDetailsSchema, HatsResponsibility} from "@/types/hats";
import {useCallback, useMemo} from "react";

export const useUploadHatDetail = (
  name: string,
  description: string,
  responsabilities: HatsResponsibility[] = []
) => {
  const metadata: DefaultHatsDetailsSchema = useMemo(() => {
    return {
      type: "1.0",
      data: {
        name: name,
        description: description,
        responsabilities: responsabilities,
        authorities: [],
      },
    };
  }, [name, description, responsabilities]);

  const uploadHatDetail = useCallback(async () => {
    const cid = await hatsDetailsClient.pin(metadata);
    const ipfs = `ipfs://${cid}`;
    return {cid, ipfs};
  }, [metadata]);

  return {uploadHatDetail};
};
