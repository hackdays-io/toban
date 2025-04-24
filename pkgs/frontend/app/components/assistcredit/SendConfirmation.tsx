import {
  Box,
  Container,
  HStack,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import type { NameData } from "namestone-sdk";
import { type FC, useRef, useState } from "react";
import { FaAngleDoubleUp } from "react-icons/fa";
import { FaArrowRight } from "react-icons/fa6";
import { FreeMode, Mousewheel, Virtual } from "swiper/modules";
// Swiper imports
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperInstance } from "swiper/types";
import { ipfs2https } from "utils/ipfs";
import { abbreviateAddress } from "utils/wallet";
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

interface SendConfirmationProps {
  amount: number;
  me?: NameData;
  receiver?: NameData;
  onSend: () => Promise<void>;
}

// Minimum swipe distance in pixels required to trigger the action
const SWIPE_THRESHOLD = 200;

const SendConfirmation: FC<SendConfirmationProps> = ({
  amount,
  me,
  receiver,
  onSend,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const swiperRef = useRef<SwiperInstance | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const swiped = useRef(false);

  // Handle swipe and trigger the send function
  const handleSwipe = async () => {
    if (swiped.current) return; // Prevent multiple swipes
    swiped.current = true; // Mark as swiped
    await new Promise((resolve) => setTimeout(resolve, 300));
    setIsProcessing(true);
    try {
      await onSend();
    } catch (error) {
      console.error("Error sending tokens:", error);
      if (swiperRef.current) {
        swiperRef.current.slideTo(0);
      }
      swiped.current = false;
      setIsProcessing(false);
    }
  };

  return (
    <VStack
      pt={8}
      height="100%"
      justifyContent="space-between"
      overflow="hidden"
    >
      <Text fontSize="md" color="gray.500" fontWeight="bold" textAlign="center">
        スワイプして
        <br />
        アシストクレジットを送る
      </Text>

      <VStack pt={4}>
        <FaAngleDoubleUp color="orange" size="60px" />
      </VStack>

      {/* Swipeable emoji container */}
      <Box position="relative" width="100%" height="300px" ref={containerRef}>
        <Swiper
          modules={[Virtual, FreeMode, Mousewheel]}
          direction="vertical"
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
          mousewheel={true}
          freeMode={{
            enabled: true,
            sticky: false,
            momentumRatio: 0.5,
          }}
          allowTouchMove={!isProcessing}
          threshold={5}
          resistance={true}
          resistanceRatio={0.5}
          onProgress={(swiper) => {
            if (swiper.translate <= -SWIPE_THRESHOLD && !isProcessing) {
              handleSwipe();
            }
          }}
          virtual={{ enabled: true }}
          watchSlidesProgress={true}
          slidesPerView={1}
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "visible",
          }}
          touchAngle={45}
        >
          <SwiperSlide
            virtualIndex={0}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <Field alignItems="center" justifyContent="center" py={4}>
              <Text fontSize="150px" fontWeight="bold" textAlign="center">
                {treatEmojis[getNearestEmoji(amount)]}
              </Text>
            </Field>
          </SwiperSlide>
          <SwiperSlide>
            <Box width="300px" height="300px" />
          </SwiperSlide>
        </Swiper>

        {/* Custom loading animation overlay */}
        {isProcessing && (
          <Box
            position="fixed"
            top="0"
            left="0"
            width="100%"
            height="100%"
            zIndex={10}
          >
            <Container bg="#fffdf8" maxW="430px" height="100%" width="100%">
              <VStack justifyContent="center" height="100%" gap={20}>
                <Text color="orange.500" fontWeight="bold" fontSize="xl">
                  送信中...
                </Text>

                {/* Custom treat animation */}
                <Box position="relative" width="100%">
                  {/* Sender */}
                  <Box
                    position="absolute"
                    left="0"
                    top="50%"
                    transform="translateY(-50%)"
                  >
                    <UserIcon
                      size={16}
                      userImageUrl={ipfs2https(me?.text_records?.avatar)}
                    />
                    <Text fontSize="sm" textAlign="center" mt={1}>
                      {me?.name || "You"}
                    </Text>
                  </Box>

                  {/* Treats animation */}
                  <HStack
                    position="absolute"
                    left="50%"
                    top="50%"
                    transform="translate(-50%, -50%)"
                    gap={4}
                    justifyContent="center"
                  >
                    <Text
                      fontSize="36px"
                      style={{
                        animation: "blink 1.5s infinite",
                        animationDelay: "0s",
                        opacity: 0,
                      }}
                    >
                      {treatEmojis[getNearestEmoji(amount)]}
                    </Text>
                    <Text
                      fontSize="36px"
                      style={{
                        animation: "blink 1.5s infinite",
                        animationDelay: "0.5s",
                        opacity: 0,
                      }}
                    >
                      {treatEmojis[getNearestEmoji(amount)]}
                    </Text>
                    <Text
                      fontSize="36px"
                      style={{
                        animation: "blink 1.5s infinite",
                        animationDelay: "1s",
                        opacity: 0,
                      }}
                    >
                      {treatEmojis[getNearestEmoji(amount)]}
                    </Text>
                  </HStack>

                  {/* Receiver */}
                  <Box
                    position="absolute"
                    right="0"
                    top="50%"
                    transform="translateY(-50%)"
                  >
                    <UserIcon
                      size={16}
                      userImageUrl={ipfs2https(receiver?.text_records?.avatar)}
                    />
                    <Text fontSize="sm" textAlign="center" mt={1}>
                      {receiver?.name ||
                        abbreviateAddress(receiver?.address || "")}
                    </Text>
                  </Box>
                </Box>
              </VStack>
            </Container>
          </Box>
        )}
      </Box>

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
        <Box>
          <UserIcon
            size={10}
            userImageUrl={ipfs2https(receiver?.text_records?.avatar)}
          />
          <Text fontSize="xs">
            {receiver?.name || abbreviateAddress(receiver?.address || "")}
          </Text>
        </Box>
      </HStack>
    </VStack>
  );
};

export default SendConfirmation;
