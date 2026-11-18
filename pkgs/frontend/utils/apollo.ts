import { ApolloClient, InMemoryCache } from "@apollo/client/core";
import { HttpLink } from "@apollo/client/link/http/http.cjs";

export const goldskyClient = new ApolloClient({
  ssrMode: typeof window === "undefined",
  link: new HttpLink({
    uri: import.meta.env.VITE_GOLDSKY_GRAPHQL_ENDPOINT,
  }),
  cache: new InMemoryCache(),
});

// Resolve the Hats Protocol subgraph URL for the active chain.
// `VITE_HATS_GRAPHQL_ENDPOINT` (our self-hosted Goldsky deployment) wins on
// every chain, including Base mainnet. Only when it is unset on Base do we
// fall back to Hats Protocol's official subgraph on The Graph's decentralised
// Gateway, which needs `VITE_THEGRAPH_API_KEY`. Shared with
// `hatsSubgraphClient` in `hooks/useHats.ts` so both clients hit the same
// indexer.
const BASE_HATS_SUBGRAPH_ID = "FWeAqrp36QYqv9gDWLwr7em8vtvPnPrmRRQgnBb6QbBs";

export const resolveHatsEndpoint = (): string => {
  const endpoint = import.meta.env.VITE_HATS_GRAPHQL_ENDPOINT;
  if (endpoint) return endpoint;

  const chainId = Number(import.meta.env.VITE_CHAIN_ID);
  const apiKey = import.meta.env.VITE_THEGRAPH_API_KEY;
  if (chainId === 8453 && apiKey) {
    return `https://gateway.thegraph.com/api/${apiKey}/subgraphs/id/${BASE_HATS_SUBGRAPH_ID}`;
  }

  throw new Error(
    chainId === 8453
      ? "Hats subgraph endpoint is not set on Base mainnet. Set VITE_HATS_GRAPHQL_ENDPOINT (Goldsky) or VITE_THEGRAPH_API_KEY (The Graph Gateway)."
      : "VITE_HATS_GRAPHQL_ENDPOINT is not set. Point it at the self-hosted Goldsky Hats subgraph.",
  );
};

export const hatsApolloClient = new ApolloClient({
  ssrMode: typeof window === "undefined",
  link: new HttpLink({
    uri: resolveHatsEndpoint(),
  }),
  cache: new InMemoryCache(),
});
