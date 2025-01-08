import axios from "axios";
import {
  Children,
  type FC,
  type ReactNode,
  cloneElement,
  isValidElement,
  useEffect,
  useState,
} from "react";
import type { HatsDetailSchama } from "types/hats";
import { ipfs2https } from "utils/ipfs";

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

  const [detail, setDetail] = useState<HatsDetailSchama>();

  useEffect(() => {
    if (!parsedDetailUri) return;

    const fetch = async () => {
      const { data } = await axios.get(parsedDetailUri);
      setDetail(data);
    };

    fetch();
  }, [parsedDetailUri]);

  return (
    <>
      {Children.map(props.children, (child) =>
        isValidElement(child)
          ? cloneElement(child, { imageUri: parsedImageUri, detail } as any)
          : child,
      )}
    </>
  );
};
