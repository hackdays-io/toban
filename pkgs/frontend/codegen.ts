import type { CodegenConfig } from "@graphql-codegen/cli";

const schema = process.env.VITE_GOLDSKY_GRAPHQL_ENDPOINT;
if (!schema) {
  throw new Error(
    "VITE_GOLDSKY_GRAPHQL_ENDPOINT is not set. Run codegen via `pnpm frontend codegen` so dotenv loads .env (or use `dotenv -e .env.base graphql-codegen ...` for Base).",
  );
}

const config: CodegenConfig = {
  overwrite: true,
  schema,
  documents: ["./**/*.ts", "!./node_modules/**/*", "!./hooks/useHats.ts"],
  generates: {
    "./gql/": {
      preset: "client",
    },
  },
};

export default config;
