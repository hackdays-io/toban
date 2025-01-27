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
    "\n  query GetTransferFractionTokens($where: TransferFractionToken_filter = {}, $orderBy: TransferFractionToken_orderBy, $orderDirection: OrderDirection = asc, $first: Int = 10) {\n    transferFractionTokens(where: $where, orderBy: $orderBy, orderDirection: $orderDirection, first: $first) {\n      amount\n      from\n      to\n      tokenId\n      blockNumber\n      blockTimestamp\n      hatId\n      id\n      wearer\n      workspaceId\n    }\n  }\n": types.GetTransferFractionTokensDocument,
    "\n  query GetWorkspaces($where: Workspace_filter) {\n    workspaces(where: $where) {\n      creator\n      topHatId\n      splitCreator\n      id\n      hatterHatId\n      hatsTimeFrameModule\n      hatsHatCreatorModule\n      blockTimestamp\n      blockNumber\n    }\n  }\n": types.GetWorkspacesDocument,
    "\n  query GetWorkspace($workspaceId: ID!) {\n    workspace(id: $workspaceId) {\n      creator\n      hatsTimeFrameModule\n      hatsHatCreatorModule\n      hatterHatId\n      id\n      splitCreator\n      topHatId\n      blockTimestamp\n      blockNumber\n    }\n  }\n": types.GetWorkspaceDocument,
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
export function graphql(source: "\n  query GetTransferFractionTokens($where: TransferFractionToken_filter = {}, $orderBy: TransferFractionToken_orderBy, $orderDirection: OrderDirection = asc, $first: Int = 10) {\n    transferFractionTokens(where: $where, orderBy: $orderBy, orderDirection: $orderDirection, first: $first) {\n      amount\n      from\n      to\n      tokenId\n      blockNumber\n      blockTimestamp\n      hatId\n      id\n      wearer\n      workspaceId\n    }\n  }\n"): (typeof documents)["\n  query GetTransferFractionTokens($where: TransferFractionToken_filter = {}, $orderBy: TransferFractionToken_orderBy, $orderDirection: OrderDirection = asc, $first: Int = 10) {\n    transferFractionTokens(where: $where, orderBy: $orderBy, orderDirection: $orderDirection, first: $first) {\n      amount\n      from\n      to\n      tokenId\n      blockNumber\n      blockTimestamp\n      hatId\n      id\n      wearer\n      workspaceId\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetWorkspaces($where: Workspace_filter) {\n    workspaces(where: $where) {\n      creator\n      topHatId\n      splitCreator\n      id\n      hatterHatId\n      hatsTimeFrameModule\n      hatsHatCreatorModule\n      blockTimestamp\n      blockNumber\n    }\n  }\n"): (typeof documents)["\n  query GetWorkspaces($where: Workspace_filter) {\n    workspaces(where: $where) {\n      creator\n      topHatId\n      splitCreator\n      id\n      hatterHatId\n      hatsTimeFrameModule\n      hatsHatCreatorModule\n      blockTimestamp\n      blockNumber\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetWorkspace($workspaceId: ID!) {\n    workspace(id: $workspaceId) {\n      creator\n      hatsTimeFrameModule\n      hatsHatCreatorModule\n      hatterHatId\n      id\n      splitCreator\n      topHatId\n      blockTimestamp\n      blockNumber\n    }\n  }\n"): (typeof documents)["\n  query GetWorkspace($workspaceId: ID!) {\n    workspace(id: $workspaceId) {\n      creator\n      hatsTimeFrameModule\n      hatsHatCreatorModule\n      hatterHatId\n      id\n      splitCreator\n      topHatId\n      blockTimestamp\n      blockNumber\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;