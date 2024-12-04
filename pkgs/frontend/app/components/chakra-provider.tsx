import {
  ChakraProvider as Provider,
  createSystem,
  defaultConfig,
} from "@chakra-ui/react";

const system = createSystem(defaultConfig, {
  theme: {
    tokens: {
      colors: {
        yellow: {
          "50": {
            value: "#fdfae9",
          },
          "100": {
            value: "#fcf3c5",
          },
          "200": {
            value: "#fbe38d",
          },
          "300": {
            value: "#f8cc4c",
          },
          "400": {
            value: "#f4b520",
          },
          "500": {
            value: "#e49b0e",
          },
          "600": {
            value: "#c57609",
          },
          "700": {
            value: "#9d530b",
          },
          "800": {
            value: "#824211",
          },
          "900": {
            value: "#6e3615",
          },
          "950": {
            value: "#401b08",
          },
        },
        blue: {
          "50": {
            value: "#f0f7fe",
          },
          "100": {
            value: "#dcecfd",
          },
          "200": {
            value: "#c2dffb",
          },
          "300": {
            value: "#97ccf9",
          },
          "400": {
            value: "#66b0f4",
          },
          "500": {
            value: "#4994ef",
          },
          "600": {
            value: "#2d73e3",
          },
          "700": {
            value: "#255ed0",
          },
          "800": {
            value: "#244da9",
          },
          "900": {
            value: "#224386",
          },
          "950": {
            value: "#192a52",
          },
        },
        orange: {
          "50": {
            value: "#fdf6ef",
          },
          "100": {
            value: "#fbe9d9",
          },
          "200": {
            value: "#f6d1b2",
          },
          "300": {
            value: "#f0b181",
          },
          "400": {
            value: "#e9884e",
          },
          "500": {
            value: "#e36527",
          },
          "600": {
            value: "#d55121",
          },
          "700": {
            value: "#b13c1d",
          },
          "800": {
            value: "#8d311f",
          },
          "900": {
            value: "#722b1c",
          },
          "950": {
            value: "#3d130d",
          },
        },
        skyblue: {
          "50": {
            value: "#eefbfd",
          },
          "100": {
            value: "#d5f3f8",
          },
          "200": {
            value: "#b0e6f1",
          },
          "300": {
            value: "#79d4e7",
          },
          "400": {
            value: "#3cb8d4",
          },
          "500": {
            value: "#1f97b5",
          },
          "600": {
            value: "#1d7d9d",
          },
          "700": {
            value: "#1e6680",
          },
          "800": {
            value: "#215469",
          },
          "900": {
            value: "#204759",
          },
          "950": {
            value: "#102e3c",
          },
        },
      },
    },
  },
});

export const ChakraProvider = (props: { children: React.ReactNode }) => {
  return <Provider value={system} {...props} />;
};
