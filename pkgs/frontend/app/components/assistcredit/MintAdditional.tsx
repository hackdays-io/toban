import { Box, Flex, Text } from "@chakra-ui/react";
import { useParams } from "@remix-run/react";
import { useFractionToken } from "hooks/useFractionToken";
import { type FC, useState } from "react";
import { BasicButton } from "../BasicButton";
import { CommonInput } from "../common/CommonInput";

const MintAdditional: FC = () => {
  const [amount, setAmount] = useState(0);
  const { mintFractionToken, isLoading } = useFractionToken();

  const { hatId, address } = useParams();

  const handleMint = async () => {
    if (isLoading) return;
    await mintFractionToken({
      hatId: BigInt(hatId ?? ""),
      account: address as `0x${string}`,
      amount: BigInt(amount),
    });
  };

  return (
    <>
      <Text mb={2}>追加発行</Text>
      <Flex gap={2} align="center">
        <CommonInput
          w="100%"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
        />
        <BasicButton
          size="sm"
          w="auto"
          onClick={handleMint}
          loading={isLoading}
          disabled={amount <= 0 || isLoading}
        >
          追加発行
        </BasicButton>
      </Flex>
    </>
  );
};

export default MintAdditional;
