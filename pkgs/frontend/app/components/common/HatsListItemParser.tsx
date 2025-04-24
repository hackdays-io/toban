import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  Children,
  type FC,
  type ReactNode,
  cloneElement,
  isValidElement,
} from "react";
import type { HatsDetailSchama } from "types/hats";
import { ipfs2https } from "utils/ipfs";

interface HatsListItemChildProps {
  imageUri?: string;
  detail?: HatsDetailSchama;
}

interface HatsListItemParserProps {
  children: ReactNode;
  detailUri?: string;
  imageUri?: string;
}

export const HatsListItemParser: FC<HatsListItemParserProps> = (props) => {
  const parsedImageUri = props.imageUri
    ? ipfs2https(props.imageUri)
    : props.imageUri;
  const parsedDetailUri = props.detailUri
    ? ipfs2https(props.detailUri)
    : props.detailUri;

  const { data: detail } = useQuery({
    queryKey: ["hats-detail", parsedDetailUri],
    queryFn: async () => {
      if (!parsedDetailUri) return;
      const { data } = await axios.get(parsedDetailUri);
      return data;
    },
    staleTime: 1000 * 60 * 60,
  });

  return (
    <>
      {Children.map(props.children, (child) =>
        isValidElement(child)
          ? cloneElement(child, {
              imageUri: parsedImageUri,
              detail,
            } as HatsListItemChildProps)
          : child,
      )}
    </>
  );
};
