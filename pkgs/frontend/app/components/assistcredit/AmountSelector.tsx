import { Box, Flex, HStack, Stack, Text, VStack } from "@chakra-ui/react";
import { Slider, useSlider } from "@chakra-ui/react/slider";
import type { NameData } from "namestone-sdk";
import { useEffect, useState } from "react";
import { FaArrowRight } from "react-icons/fa6";
import { ipfs2https } from "utils/ipfs";
import { abbreviateAddress } from "utils/wallet";
import { BasicButton } from "~/components/BasicButton";
import { CommonInput } from "~/components/common/CommonInput";
import { Field } from "~/components/ui/field";
import { UserIcon } from "../icon/UserIcon";
import { treatEmojis } from "./emojiConstants";

// Find the nearest emoji key for any amount
const getNearestEmoji = (amount: number): number => {
  const keys = Object.keys(treatEmojis).map(Number);
  if (amount <= 0) return keys[0];
  if (amount >= 2000) return 2000;

  // Find the closest multiple of 200
  return Math.round(amount / 200) * 200;
};

interface AmountSelectorProps {
  amount: number;
  setAmount: (amount: number) => void;
  onNext: () => void;
  isLoading: boolean;
  me?: NameData;
  receiver?: NameData;
  receivers?: NameData[];
  max?: number;
  step?: number;
}

const AmountSelector = ({
  amount,
  setAmount,
  onNext,
  isLoading,
  me,
  receiver,
  receivers,
  max,
  step,
}: AmountSelectorProps) => {
  const slider = useSlider({
    defaultValue: [0],
    min: 0,
    max: max || 2000,
    thumbAlignment: "center",
    step: step || 50,
  });

  const [inputValue, setInputValue] = useState<string>(amount.toString());
  const [useCustomValue, setUseCustomValue] = useState<boolean>(false);

  useEffect(() => {
    if (!useCustomValue) {
      setAmount(Number(slider.value));
      setInputValue(slider.value.toString());
    }
  }, [slider.value, setAmount, useCustomValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    setInputValue(value);
    setUseCustomValue(true);

    // Convert to number and update if valid
    const numValue = Number(value);
    if (!Number.isNaN(numValue) && numValue >= 0) {
      setAmount(numValue);
    } else {
      setAmount(0);
    }
  };

  return (
    <>
      <Field alignItems="center" justifyContent="center">
        <VStack gap={4} mb={2}>
          <Text fontSize="lg" fontWeight="bold" textAlign="center">
            送信量
          </Text>
          <Box width="250px">
            <CommonInput
              value={inputValue}
              onChange={handleInputChange}
              textAlign="center"
              fontSize="24px"
              fontWeight="bold"
              type="text"
              placeholder="数量を入力"
            />
          </Box>
        </VStack>
        <Text fontSize="150px" fontWeight="bold" textAlign="center" mb={2}>
          {treatEmojis[getNearestEmoji(amount)]}
        </Text>
        <Box width="100%" px={4} mb={4}>
          <Stack align="flex-start" justifyContent="center">
            <Slider.RootProvider
              value={slider}
              onChange={() => {
                setUseCustomValue(false);
              }}
              size="lg"
              width="100%"
            >
              <Slider.Control>
                <Slider.Track>
                  <Slider.Range />
                </Slider.Track>
                <Slider.Thumbs />
              </Slider.Control>
            </Slider.RootProvider>
          </Stack>
        </Box>
      </Field>

      <Flex width="100%" flexDirection="column" alignItems="center">
        <HStack columnGap={3} mb={4}>
          <Box textAlign="center">
            <UserIcon
              size={10}
              userImageUrl={ipfs2https(me?.text_records?.avatar)}
            />
            <Text fontSize="xs">{me?.name}</Text>
          </Box>
          <VStack textAlign="center">
            <Text>{amount}</Text>
            <FaArrowRight size="20px" />
          </VStack>
          <Box textAlign="center">
            {receivers && receivers.length > 0 ? (
              <HStack>
                {receivers.slice(0, 3).map((user, index) => (
                  <Box key={user.address} marginLeft={index === 0 ? 0 : -4}>
                    <UserIcon
                      size={10}
                      userImageUrl={ipfs2https(user.text_records?.avatar)}
                    />
                  </Box>
                ))}
                {receivers.length > 3 && (
                  <Text fontSize="sm" fontWeight="bold">
                    +{receivers.length - 3}
                  </Text>
                )}
              </HStack>
            ) : receiver ? (
              <UserIcon
                size={10}
                userImageUrl={ipfs2https(receiver?.text_records?.avatar)}
              />
            ) : null}
            <Text fontSize="xs">
              {receivers && receivers.length > 0
                ? `${receivers.length}人`
                : receiver?.name || abbreviateAddress(receiver?.address || "")}
            </Text>
          </Box>
        </HStack>
        <BasicButton
          colorScheme="yellow"
          loading={isLoading}
          onClick={onNext}
          mb={5}
          disabled={amount <= 0 || amount > (max || 2000) || isLoading}
        >
          次へ
        </BasicButton>
      </Flex>
    </>
  );
};

export default AmountSelector;
