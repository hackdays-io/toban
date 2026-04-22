import { ApolloClient, InMemoryCache } from "@apollo/client/core";
import { HttpLink } from "@apollo/client/link/http/http.cjs";

export const goldskyClient = new ApolloClient({
  ssrMode: typeof window === "undefined",
  link: new HttpLink({
    uri: import.meta.env.VITE_GOLDSKY_GRAPHQL_ENDPOINT,
  }),
  cache: new InMemoryCache(),
});

export const hatsApolloClient = new ApolloClient({
  ssrMode: typeof window === "undefined",
  link: new HttpLink({
    uri: import.meta.env.VITE_HATS_GRAPHQL_ENDPOINT,
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_THEGRAPH_API_KEY}`,
    },
  }),
  cache: new InMemoryCache(),
});
