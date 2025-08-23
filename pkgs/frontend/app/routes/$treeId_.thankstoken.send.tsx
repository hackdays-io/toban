import { useParams } from "@remix-run/react";
import { useThanksToken } from "hooks/useThanksToken";
import type { FC } from "react";

const ThanksTokenSend: FC = () => {
  const { treeId } = useParams();
  const { mintableAmount } = useThanksToken(treeId as string);
  return <>{mintableAmount}</>;
};

export default ThanksTokenSend;
