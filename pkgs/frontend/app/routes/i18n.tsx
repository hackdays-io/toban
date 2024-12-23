import { Box, Button, Float, Text } from "@chakra-ui/react";
import { FC } from "react";
import { useTranslation } from "react-i18next";

export const handle = { i18n: "common" };

/**
 * i18nの機能を試すテストページ
 */
const I18n: FC = () => {
  const { t, i18n } = useTranslation("common");

  /**
   * 言語を変更するメソッド
   * @param language
   */
  const change = (language: string) => {
    console.log("lang:", language);
    i18n.changeLanguage(language);
  };

  return (
    <>
      <Float
        placement="middle-center"
        width="100%"
        display="flex"
        flexDirection="column"
        alignItems="center"
      >
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          width="160px"
        >
          <Text textAlign="center" color="gray.800" mt={5}>
            i18n テストページ
          </Text>
        </Box>
        <Button onClick={() => change("en")}>English</Button>
        <Button onClick={() => change("ja")}>日本語</Button>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          width="160px"
        >
          <Text textAlign="center" color="gray.800" mt={5}>
            {t("title")}
          </Text>
        </Box>
      </Float>
    </>
  );
};

export default I18n;
