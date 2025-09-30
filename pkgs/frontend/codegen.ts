import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  overwrite: true,
  schema:
    "https://api.goldsky.com/api/public/project_cm4r39viziqcd01wo6y96c1r6/subgraphs/toban-base/0.0.1/gn",
  documents: ["./**/*.ts", "!./node_modules/**/*", "!./hooks/useHats.ts"],
  generates: {
    "./gql/": {
      preset: "client",
    },
  },
};

export default config;
