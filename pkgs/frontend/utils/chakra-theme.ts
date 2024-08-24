import { extendTheme } from "@chakra-ui/react";

const colors = {
  yellow: {
    100: "#FFFCF5", // 明るい
    400: "#F2B71F", // 普通
    700: "#B1B0AB", // 暗い
  },
  blue: {
    100: "#65A0FF", // 明るい
    400: "#4894EE", // 普通
    700: "#4066A2", // 暗い
  },
  orange: {
    100: "#FF8244", // 明るい
    400: "#E36526", // 普通
    700: "#934B27", // 暗い
  },
  lightblue: {
    100: "#5EC1E7", // 明るい
    400: "#1F97B5", // 普通
    700: "#33687C", // 暗い
  },
};

export const chakraTheme = extendTheme({
  config: {
    initialColorMode: "light",
    useSystemColorMode: false,
  },
  colors,
  styles: {
    global: {
      body: {
        color: colors.blue[700], // 黒に近い色に変更
      },
    },
  },
});

export default chakraTheme;
