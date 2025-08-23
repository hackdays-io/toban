import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  overwrite: true,
  schema:
    "https://api.goldsky.com/api/public/project_cm9v3lkp35fui01yx8k3k0xxj/subgraphs/toban-sepolia/1.0.3/gn",
  documents: ["./**/*.tsx", "./**/*.ts", "!./node_modules/**/*"],
  generates: {
    "./gql/": {
      preset: "client",
    },
  },
};

export default config;
