/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
const documents = {
    "\n  query GetTransferFractionTokens($where: TransferFractionToken_filter = {}, $orderBy: TransferFractionToken_orderBy, $orderDirection: OrderDirection = asc, $first: Int = 10) {\n    transferFractionTokens(\n      where: $where\n      orderBy: $orderBy\n      orderDirection: $orderDirection\n      first: $first\n    ) {\n      id\n      from\n      to\n      tokenId\n      workspaceId\n      blockTimestamp\n      blockNumber\n      amount\n      hatsFractionTokenModule {\n        id\n      }\n    }\n  }\n": types.GetTransferFractionTokensDocument,
    "\n  query BalanceOfFractionTokens($where: BalanceOfFractionToken_filter = {}, $orderBy: BalanceOfFractionToken_orderBy, $orderDirection: OrderDirection = asc, $first: Int = 100) {\n    balanceOfFractionTokens(where: $where, orderBy: $orderBy, orderDirection: $orderDirection, first: $first) {\n      tokenId\n      balance\n      owner\n      workspaceId\n      hatId\n      id\n      updatedAt\n      wearer\n    }\n  }\n": types.BalanceOfFractionTokensDocument,
    "\n  query GetThanksTokenBalances($where: BalanceOfThanksToken_filter = {}, $orderBy: BalanceOfThanksToken_orderBy, $orderDirection: OrderDirection = asc, $first: Int = 100) {\n    balanceOfThanksTokens(\n      where: $where\n      orderBy: $orderBy\n      orderDirection: $orderDirection\n      first: $first\n    ) {\n      id\n      thanksToken {\n        id\n        workspaceId\n      }\n      owner\n      balance\n      workspaceId\n      updatedAt\n    }\n  }\n": types.GetThanksTokenBalancesDocument,
    "\n  query GetThanksTokenMints($where: MintThanksToken_filter = {}, $orderBy: MintThanksToken_orderBy, $orderDirection: OrderDirection = asc, $first: Int = 10) {\n    mintThanksTokens(\n      where: $where\n      orderBy: $orderBy\n      orderDirection: $orderDirection\n      first: $first\n    ) {\n      id\n      thanksToken {\n        id\n        workspaceId\n      }\n      from\n      to\n      data\n      amount\n      workspaceId\n      blockTimestamp\n      blockNumber\n    }\n  }\n": types.GetThanksTokenMintsDocument,
    "\n  query GetThanksTokenTransfers($where: TransferThanksToken_filter = {}, $orderBy: TransferThanksToken_orderBy, $orderDirection: OrderDirection = asc, $first: Int = 10) {\n    transferThanksTokens(\n      where: $where\n      orderBy: $orderBy\n      orderDirection: $orderDirection\n      first: $first\n    ) {\n      id\n      thanksToken {\n        id\n        workspaceId\n      }\n      from\n      to\n      amount\n      workspaceId\n      blockTimestamp\n      blockNumber\n    }\n  }\n": types.GetThanksTokenTransfersDocument,
    "\n  query GetThanksTokens($where: ThanksToken_filter, $first: Int = 100) {\n    thanksTokens(\n      where: $where\n      first: $first\n    ) {\n      workspaceId\n    }\n  }\n": types.GetThanksTokensDocument,
    "\n  query GetWorkspace($workspaceId: ID!) {\n    workspace(id: $workspaceId) {\n      id\n      minterHatId\n      operatorHatId\n      owner\n      splitCreator\n      topHatId\n      hatterHatId\n      hatsTimeFrameModule\n      hatsHatCreatorModule\n      creator\n      creatorHatId\n      blockTimestamp\n      blockNumber\n      hatsFractionTokenModule {\n        id\n      }\n      thanksToken {\n        id\n      }\n    }\n  }\n": types.GetWorkspaceDocument,
    "\n  query GetWorkspaces($where: Workspace_filter, $first: Int = 100) {\n    workspaces(where: $where, first: $first) {\n      id\n      minterHatId\n      operatorHatId\n      owner\n      splitCreator\n      topHatId\n      hatterHatId\n      hatsTimeFrameModule\n      hatsHatCreatorModule\n      creator\n      creatorHatId\n      blockTimestamp\n      blockNumber\n      hatsFractionTokenModule {\n        id\n      }\n      thanksToken {\n        id\n      }\n    }\n  }\n": types.GetWorkspacesDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetTransferFractionTokens($where: TransferFractionToken_filter = {}, $orderBy: TransferFractionToken_orderBy, $orderDirection: OrderDirection = asc, $first: Int = 10) {\n    transferFractionTokens(\n      where: $where\n      orderBy: $orderBy\n      orderDirection: $orderDirection\n      first: $first\n    ) {\n      id\n      from\n      to\n      tokenId\n      workspaceId\n      blockTimestamp\n      blockNumber\n      amount\n      hatsFractionTokenModule {\n        id\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetTransferFractionTokens($where: TransferFractionToken_filter = {}, $orderBy: TransferFractionToken_orderBy, $orderDirection: OrderDirection = asc, $first: Int = 10) {\n    transferFractionTokens(\n      where: $where\n      orderBy: $orderBy\n      orderDirection: $orderDirection\n      first: $first\n    ) {\n      id\n      from\n      to\n      tokenId\n      workspaceId\n      blockTimestamp\n      blockNumber\n      amount\n      hatsFractionTokenModule {\n        id\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query BalanceOfFractionTokens($where: BalanceOfFractionToken_filter = {}, $orderBy: BalanceOfFractionToken_orderBy, $orderDirection: OrderDirection = asc, $first: Int = 100) {\n    balanceOfFractionTokens(where: $where, orderBy: $orderBy, orderDirection: $orderDirection, first: $first) {\n      tokenId\n      balance\n      owner\n      workspaceId\n      hatId\n      id\n      updatedAt\n      wearer\n    }\n  }\n"): (typeof documents)["\n  query BalanceOfFractionTokens($where: BalanceOfFractionToken_filter = {}, $orderBy: BalanceOfFractionToken_orderBy, $orderDirection: OrderDirection = asc, $first: Int = 100) {\n    balanceOfFractionTokens(where: $where, orderBy: $orderBy, orderDirection: $orderDirection, first: $first) {\n      tokenId\n      balance\n      owner\n      workspaceId\n      hatId\n      id\n      updatedAt\n      wearer\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetThanksTokenBalances($where: BalanceOfThanksToken_filter = {}, $orderBy: BalanceOfThanksToken_orderBy, $orderDirection: OrderDirection = asc, $first: Int = 100) {\n    balanceOfThanksTokens(\n      where: $where\n      orderBy: $orderBy\n      orderDirection: $orderDirection\n      first: $first\n    ) {\n      id\n      thanksToken {\n        id\n        workspaceId\n      }\n      owner\n      balance\n      workspaceId\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  query GetThanksTokenBalances($where: BalanceOfThanksToken_filter = {}, $orderBy: BalanceOfThanksToken_orderBy, $orderDirection: OrderDirection = asc, $first: Int = 100) {\n    balanceOfThanksTokens(\n      where: $where\n      orderBy: $orderBy\n      orderDirection: $orderDirection\n      first: $first\n    ) {\n      id\n      thanksToken {\n        id\n        workspaceId\n      }\n      owner\n      balance\n      workspaceId\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetThanksTokenMints($where: MintThanksToken_filter = {}, $orderBy: MintThanksToken_orderBy, $orderDirection: OrderDirection = asc, $first: Int = 10) {\n    mintThanksTokens(\n      where: $where\n      orderBy: $orderBy\n      orderDirection: $orderDirection\n      first: $first\n    ) {\n      id\n      thanksToken {\n        id\n        workspaceId\n      }\n      from\n      to\n      data\n      amount\n      workspaceId\n      blockTimestamp\n      blockNumber\n    }\n  }\n"): (typeof documents)["\n  query GetThanksTokenMints($where: MintThanksToken_filter = {}, $orderBy: MintThanksToken_orderBy, $orderDirection: OrderDirection = asc, $first: Int = 10) {\n    mintThanksTokens(\n      where: $where\n      orderBy: $orderBy\n      orderDirection: $orderDirection\n      first: $first\n    ) {\n      id\n      thanksToken {\n        id\n        workspaceId\n      }\n      from\n      to\n      data\n      amount\n      workspaceId\n      blockTimestamp\n      blockNumber\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetThanksTokenTransfers($where: TransferThanksToken_filter = {}, $orderBy: TransferThanksToken_orderBy, $orderDirection: OrderDirection = asc, $first: Int = 10) {\n    transferThanksTokens(\n      where: $where\n      orderBy: $orderBy\n      orderDirection: $orderDirection\n      first: $first\n    ) {\n      id\n      thanksToken {\n        id\n        workspaceId\n      }\n      from\n      to\n      amount\n      workspaceId\n      blockTimestamp\n      blockNumber\n    }\n  }\n"): (typeof documents)["\n  query GetThanksTokenTransfers($where: TransferThanksToken_filter = {}, $orderBy: TransferThanksToken_orderBy, $orderDirection: OrderDirection = asc, $first: Int = 10) {\n    transferThanksTokens(\n      where: $where\n      orderBy: $orderBy\n      orderDirection: $orderDirection\n      first: $first\n    ) {\n      id\n      thanksToken {\n        id\n        workspaceId\n      }\n      from\n      to\n      amount\n      workspaceId\n      blockTimestamp\n      blockNumber\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetThanksTokens($where: ThanksToken_filter, $first: Int = 100) {\n    thanksTokens(\n      where: $where\n      first: $first\n    ) {\n      workspaceId\n    }\n  }\n"): (typeof documents)["\n  query GetThanksTokens($where: ThanksToken_filter, $first: Int = 100) {\n    thanksTokens(\n      where: $where\n      first: $first\n    ) {\n      workspaceId\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetWorkspace($workspaceId: ID!) {\n    workspace(id: $workspaceId) {\n      id\n      minterHatId\n      operatorHatId\n      owner\n      splitCreator\n      topHatId\n      hatterHatId\n      hatsTimeFrameModule\n      hatsHatCreatorModule\n      creator\n      creatorHatId\n      blockTimestamp\n      blockNumber\n      hatsFractionTokenModule {\n        id\n      }\n      thanksToken {\n        id\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetWorkspace($workspaceId: ID!) {\n    workspace(id: $workspaceId) {\n      id\n      minterHatId\n      operatorHatId\n      owner\n      splitCreator\n      topHatId\n      hatterHatId\n      hatsTimeFrameModule\n      hatsHatCreatorModule\n      creator\n      creatorHatId\n      blockTimestamp\n      blockNumber\n      hatsFractionTokenModule {\n        id\n      }\n      thanksToken {\n        id\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetWorkspaces($where: Workspace_filter, $first: Int = 100) {\n    workspaces(where: $where, first: $first) {\n      id\n      minterHatId\n      operatorHatId\n      owner\n      splitCreator\n      topHatId\n      hatterHatId\n      hatsTimeFrameModule\n      hatsHatCreatorModule\n      creator\n      creatorHatId\n      blockTimestamp\n      blockNumber\n      hatsFractionTokenModule {\n        id\n      }\n      thanksToken {\n        id\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetWorkspaces($where: Workspace_filter, $first: Int = 100) {\n    workspaces(where: $where, first: $first) {\n      id\n      minterHatId\n      operatorHatId\n      owner\n      splitCreator\n      topHatId\n      hatterHatId\n      hatsTimeFrameModule\n      hatsHatCreatorModule\n      creator\n      creatorHatId\n      blockTimestamp\n      blockNumber\n      hatsFractionTokenModule {\n        id\n      }\n      thanksToken {\n        id\n      }\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;