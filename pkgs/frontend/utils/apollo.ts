import { ApolloClient, InMemoryCache } from "@apollo/client/core";
import { HttpLink } from "@apollo/client/link/http/http.cjs";

export const goldskyClient = new ApolloClient({
  ssrMode: typeof window === "undefined",
  link: new HttpLink({
    uri: import.meta.env.VITE_GOLDSKY_GRAPHQL_ENDPOINT,
  }),
  cache: new InMemoryCache(),
});

// Resolve the Hats Protocol subgraph URL for the active chain. The Studio
// endpoint Hats Protocol publishes for Base (`api.studio.thegraph.com/.../hats-v1-base`)
// has been retired in favour of The Graph's decentralised Gateway — keep the
// Studio URL as a fallback for Sepolia/local where Gateway pricing is overkill.
// Mirrors the chain switch already used by `hatsSubgraphClient` in
// `hooks/useHats.ts` so both clients hit the same indexer.
const BASE_HATS_SUBGRAPH_ID = "FWeAqrp36QYqv9gDWLwr7em8vtvPnPrmRRQgnBb6QbBs";

export const resolveHatsEndpoint = (): string => {
  const chainId = Number(import.meta.env.VITE_CHAIN_ID);
  const apiKey = import.meta.env.VITE_THEGRAPH_API_KEY;
  // Base mainnet — Hats Protocol's official subgraph lives on The Graph's
  // decentralised Gateway. Require the API key explicitly so a missing key
  // on Base fails loudly instead of silently falling back to the Sepolia
  // Goldsky endpoint configured via VITE_HATS_GRAPHQL_ENDPOINT.
  if (chainId === 8453) {
    if (!apiKey) {
      throw new Error(
        "VITE_THEGRAPH_API_KEY is required on Base mainnet (Hats Protocol uses The Graph's decentralised Gateway).",
      );
    }
    return `https://gateway.thegraph.com/api/${apiKey}/subgraphs/id/${BASE_HATS_SUBGRAPH_ID}`;
  }
  // Sepolia / local — no official Hats subgraph, use the self-hosted
  // Goldsky deployment configured via env.
  return import.meta.env.VITE_HATS_GRAPHQL_ENDPOINT;
};

export const hatsApolloClient = new ApolloClient({
  ssrMode: typeof window === "undefined",
  link: new HttpLink({
    uri: resolveHatsEndpoint(),
  }),
  cache: new InMemoryCache(),
});
