/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  BigDecimal: { input: any; output: any; }
  BigInt: { input: any; output: any; }
  Bytes: { input: any; output: any; }
  /**
   * 8 bytes signed integer
   *
   */
  Int8: { input: any; output: any; }
  /**
   * A string representation of microseconds UNIX timestamp (16 digits)
   *
   */
  Timestamp: { input: any; output: any; }
};

export enum Aggregation_Interval {
  Day = 'day',
  Hour = 'hour'
}

export type AmountOfMintThanksToken = {
  __typename?: 'AmountOfMintThanksToken';
  amount: Scalars['BigInt']['output'];
  id: Scalars['ID']['output'];
  sender: Scalars['String']['output'];
  thanksToken: ThanksToken;
  updatedAt: Scalars['BigInt']['output'];
  workspaceId: Scalars['ID']['output'];
};

export type AmountOfMintThanksToken_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  amount?: InputMaybe<Scalars['BigInt']['input']>;
  amount_gt?: InputMaybe<Scalars['BigInt']['input']>;
  amount_gte?: InputMaybe<Scalars['BigInt']['input']>;
  amount_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  amount_lt?: InputMaybe<Scalars['BigInt']['input']>;
  amount_lte?: InputMaybe<Scalars['BigInt']['input']>;
  amount_not?: InputMaybe<Scalars['BigInt']['input']>;
  amount_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  and?: InputMaybe<Array<InputMaybe<AmountOfMintThanksToken_Filter>>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  or?: InputMaybe<Array<InputMaybe<AmountOfMintThanksToken_Filter>>>;
  sender?: InputMaybe<Scalars['String']['input']>;
  sender_contains?: InputMaybe<Scalars['String']['input']>;
  sender_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  sender_ends_with?: InputMaybe<Scalars['String']['input']>;
  sender_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  sender_gt?: InputMaybe<Scalars['String']['input']>;
  sender_gte?: InputMaybe<Scalars['String']['input']>;
  sender_in?: InputMaybe<Array<Scalars['String']['input']>>;
  sender_lt?: InputMaybe<Scalars['String']['input']>;
  sender_lte?: InputMaybe<Scalars['String']['input']>;
  sender_not?: InputMaybe<Scalars['String']['input']>;
  sender_not_contains?: InputMaybe<Scalars['String']['input']>;
  sender_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  sender_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  sender_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  sender_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  sender_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  sender_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  sender_starts_with?: InputMaybe<Scalars['String']['input']>;
  sender_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  thanksToken?: InputMaybe<Scalars['String']['input']>;
  thanksToken_?: InputMaybe<ThanksToken_Filter>;
  thanksToken_contains?: InputMaybe<Scalars['String']['input']>;
  thanksToken_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  thanksToken_ends_with?: InputMaybe<Scalars['String']['input']>;
  thanksToken_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  thanksToken_gt?: InputMaybe<Scalars['String']['input']>;
  thanksToken_gte?: InputMaybe<Scalars['String']['input']>;
  thanksToken_in?: InputMaybe<Array<Scalars['String']['input']>>;
  thanksToken_lt?: InputMaybe<Scalars['String']['input']>;
  thanksToken_lte?: InputMaybe<Scalars['String']['input']>;
  thanksToken_not?: InputMaybe<Scalars['String']['input']>;
  thanksToken_not_contains?: InputMaybe<Scalars['String']['input']>;
  thanksToken_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  thanksToken_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  thanksToken_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  thanksToken_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  thanksToken_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  thanksToken_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  thanksToken_starts_with?: InputMaybe<Scalars['String']['input']>;
  thanksToken_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  updatedAt?: InputMaybe<Scalars['BigInt']['input']>;
  updatedAt_gt?: InputMaybe<Scalars['BigInt']['input']>;
  updatedAt_gte?: InputMaybe<Scalars['BigInt']['input']>;
  updatedAt_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  updatedAt_lt?: InputMaybe<Scalars['BigInt']['input']>;
  updatedAt_lte?: InputMaybe<Scalars['BigInt']['input']>;
  updatedAt_not?: InputMaybe<Scalars['BigInt']['input']>;
  updatedAt_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  workspaceId?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_gt?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_gte?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  workspaceId_lt?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_lte?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_not?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
};

export enum AmountOfMintThanksToken_OrderBy {
  Amount = 'amount',
  Id = 'id',
  Sender = 'sender',
  ThanksToken = 'thanksToken',
  ThanksTokenId = 'thanksToken__id',
  ThanksTokenWorkspaceId = 'thanksToken__workspaceId',
  UpdatedAt = 'updatedAt',
  WorkspaceId = 'workspaceId'
}

export type BalanceOfFractionToken = {
  __typename?: 'BalanceOfFractionToken';
  balance: Scalars['BigInt']['output'];
  hatId: Scalars['BigInt']['output'];
  hatsFractionTokenModule: HatsFractionTokenModule;
  id: Scalars['ID']['output'];
  owner: Scalars['String']['output'];
  tokenId: Scalars['BigInt']['output'];
  updatedAt: Scalars['BigInt']['output'];
  wearer: Scalars['String']['output'];
  workspaceId: Scalars['ID']['output'];
};

export type BalanceOfFractionToken_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<BalanceOfFractionToken_Filter>>>;
  balance?: InputMaybe<Scalars['BigInt']['input']>;
  balance_gt?: InputMaybe<Scalars['BigInt']['input']>;
  balance_gte?: InputMaybe<Scalars['BigInt']['input']>;
  balance_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  balance_lt?: InputMaybe<Scalars['BigInt']['input']>;
  balance_lte?: InputMaybe<Scalars['BigInt']['input']>;
  balance_not?: InputMaybe<Scalars['BigInt']['input']>;
  balance_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  hatId?: InputMaybe<Scalars['BigInt']['input']>;
  hatId_gt?: InputMaybe<Scalars['BigInt']['input']>;
  hatId_gte?: InputMaybe<Scalars['BigInt']['input']>;
  hatId_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  hatId_lt?: InputMaybe<Scalars['BigInt']['input']>;
  hatId_lte?: InputMaybe<Scalars['BigInt']['input']>;
  hatId_not?: InputMaybe<Scalars['BigInt']['input']>;
  hatId_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  hatsFractionTokenModule?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_?: InputMaybe<HatsFractionTokenModule_Filter>;
  hatsFractionTokenModule_contains?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_ends_with?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_gt?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_gte?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_in?: InputMaybe<Array<Scalars['String']['input']>>;
  hatsFractionTokenModule_lt?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_lte?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_not?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_not_contains?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  hatsFractionTokenModule_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_starts_with?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  or?: InputMaybe<Array<InputMaybe<BalanceOfFractionToken_Filter>>>;
  owner?: InputMaybe<Scalars['String']['input']>;
  owner_contains?: InputMaybe<Scalars['String']['input']>;
  owner_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  owner_ends_with?: InputMaybe<Scalars['String']['input']>;
  owner_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  owner_gt?: InputMaybe<Scalars['String']['input']>;
  owner_gte?: InputMaybe<Scalars['String']['input']>;
  owner_in?: InputMaybe<Array<Scalars['String']['input']>>;
  owner_lt?: InputMaybe<Scalars['String']['input']>;
  owner_lte?: InputMaybe<Scalars['String']['input']>;
  owner_not?: InputMaybe<Scalars['String']['input']>;
  owner_not_contains?: InputMaybe<Scalars['String']['input']>;
  owner_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  owner_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  owner_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  owner_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  owner_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  owner_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  owner_starts_with?: InputMaybe<Scalars['String']['input']>;
  owner_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  tokenId?: InputMaybe<Scalars['BigInt']['input']>;
  tokenId_gt?: InputMaybe<Scalars['BigInt']['input']>;
  tokenId_gte?: InputMaybe<Scalars['BigInt']['input']>;
  tokenId_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  tokenId_lt?: InputMaybe<Scalars['BigInt']['input']>;
  tokenId_lte?: InputMaybe<Scalars['BigInt']['input']>;
  tokenId_not?: InputMaybe<Scalars['BigInt']['input']>;
  tokenId_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  updatedAt?: InputMaybe<Scalars['BigInt']['input']>;
  updatedAt_gt?: InputMaybe<Scalars['BigInt']['input']>;
  updatedAt_gte?: InputMaybe<Scalars['BigInt']['input']>;
  updatedAt_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  updatedAt_lt?: InputMaybe<Scalars['BigInt']['input']>;
  updatedAt_lte?: InputMaybe<Scalars['BigInt']['input']>;
  updatedAt_not?: InputMaybe<Scalars['BigInt']['input']>;
  updatedAt_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  wearer?: InputMaybe<Scalars['String']['input']>;
  wearer_contains?: InputMaybe<Scalars['String']['input']>;
  wearer_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  wearer_ends_with?: InputMaybe<Scalars['String']['input']>;
  wearer_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  wearer_gt?: InputMaybe<Scalars['String']['input']>;
  wearer_gte?: InputMaybe<Scalars['String']['input']>;
  wearer_in?: InputMaybe<Array<Scalars['String']['input']>>;
  wearer_lt?: InputMaybe<Scalars['String']['input']>;
  wearer_lte?: InputMaybe<Scalars['String']['input']>;
  wearer_not?: InputMaybe<Scalars['String']['input']>;
  wearer_not_contains?: InputMaybe<Scalars['String']['input']>;
  wearer_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  wearer_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  wearer_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  wearer_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  wearer_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  wearer_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  wearer_starts_with?: InputMaybe<Scalars['String']['input']>;
  wearer_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  workspaceId?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_gt?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_gte?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  workspaceId_lt?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_lte?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_not?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
};

export enum BalanceOfFractionToken_OrderBy {
  Balance = 'balance',
  HatId = 'hatId',
  HatsFractionTokenModule = 'hatsFractionTokenModule',
  HatsFractionTokenModuleId = 'hatsFractionTokenModule__id',
  HatsFractionTokenModuleWorkspaceId = 'hatsFractionTokenModule__workspaceId',
  Id = 'id',
  Owner = 'owner',
  TokenId = 'tokenId',
  UpdatedAt = 'updatedAt',
  Wearer = 'wearer',
  WorkspaceId = 'workspaceId'
}

export type BalanceOfThanksToken = {
  __typename?: 'BalanceOfThanksToken';
  balance: Scalars['BigInt']['output'];
  id: Scalars['ID']['output'];
  owner: Scalars['String']['output'];
  thanksToken: ThanksToken;
  updatedAt: Scalars['BigInt']['output'];
  workspaceId: Scalars['ID']['output'];
};

export type BalanceOfThanksToken_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<BalanceOfThanksToken_Filter>>>;
  balance?: InputMaybe<Scalars['BigInt']['input']>;
  balance_gt?: InputMaybe<Scalars['BigInt']['input']>;
  balance_gte?: InputMaybe<Scalars['BigInt']['input']>;
  balance_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  balance_lt?: InputMaybe<Scalars['BigInt']['input']>;
  balance_lte?: InputMaybe<Scalars['BigInt']['input']>;
  balance_not?: InputMaybe<Scalars['BigInt']['input']>;
  balance_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  or?: InputMaybe<Array<InputMaybe<BalanceOfThanksToken_Filter>>>;
  owner?: InputMaybe<Scalars['String']['input']>;
  owner_contains?: InputMaybe<Scalars['String']['input']>;
  owner_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  owner_ends_with?: InputMaybe<Scalars['String']['input']>;
  owner_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  owner_gt?: InputMaybe<Scalars['String']['input']>;
  owner_gte?: InputMaybe<Scalars['String']['input']>;
  owner_in?: InputMaybe<Array<Scalars['String']['input']>>;
  owner_lt?: InputMaybe<Scalars['String']['input']>;
  owner_lte?: InputMaybe<Scalars['String']['input']>;
  owner_not?: InputMaybe<Scalars['String']['input']>;
  owner_not_contains?: InputMaybe<Scalars['String']['input']>;
  owner_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  owner_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  owner_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  owner_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  owner_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  owner_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  owner_starts_with?: InputMaybe<Scalars['String']['input']>;
  owner_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  thanksToken?: InputMaybe<Scalars['String']['input']>;
  thanksToken_?: InputMaybe<ThanksToken_Filter>;
  thanksToken_contains?: InputMaybe<Scalars['String']['input']>;
  thanksToken_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  thanksToken_ends_with?: InputMaybe<Scalars['String']['input']>;
  thanksToken_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  thanksToken_gt?: InputMaybe<Scalars['String']['input']>;
  thanksToken_gte?: InputMaybe<Scalars['String']['input']>;
  thanksToken_in?: InputMaybe<Array<Scalars['String']['input']>>;
  thanksToken_lt?: InputMaybe<Scalars['String']['input']>;
  thanksToken_lte?: InputMaybe<Scalars['String']['input']>;
  thanksToken_not?: InputMaybe<Scalars['String']['input']>;
  thanksToken_not_contains?: InputMaybe<Scalars['String']['input']>;
  thanksToken_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  thanksToken_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  thanksToken_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  thanksToken_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  thanksToken_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  thanksToken_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  thanksToken_starts_with?: InputMaybe<Scalars['String']['input']>;
  thanksToken_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  updatedAt?: InputMaybe<Scalars['BigInt']['input']>;
  updatedAt_gt?: InputMaybe<Scalars['BigInt']['input']>;
  updatedAt_gte?: InputMaybe<Scalars['BigInt']['input']>;
  updatedAt_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  updatedAt_lt?: InputMaybe<Scalars['BigInt']['input']>;
  updatedAt_lte?: InputMaybe<Scalars['BigInt']['input']>;
  updatedAt_not?: InputMaybe<Scalars['BigInt']['input']>;
  updatedAt_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  workspaceId?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_gt?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_gte?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  workspaceId_lt?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_lte?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_not?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
};

export enum BalanceOfThanksToken_OrderBy {
  Balance = 'balance',
  Id = 'id',
  Owner = 'owner',
  ThanksToken = 'thanksToken',
  ThanksTokenId = 'thanksToken__id',
  ThanksTokenWorkspaceId = 'thanksToken__workspaceId',
  UpdatedAt = 'updatedAt',
  WorkspaceId = 'workspaceId'
}

export type BlockChangedFilter = {
  number_gte: Scalars['Int']['input'];
};

export type Block_Height = {
  hash?: InputMaybe<Scalars['Bytes']['input']>;
  number?: InputMaybe<Scalars['Int']['input']>;
  number_gte?: InputMaybe<Scalars['Int']['input']>;
};

export type HatsFractionTokenModule = {
  __typename?: 'HatsFractionTokenModule';
  balances: Array<BalanceOfFractionToken>;
  id: Scalars['ID']['output'];
  initializedTokens: Array<InitializedFractionToken>;
  transfers: Array<TransferFractionToken>;
  workspaceId: Scalars['ID']['output'];
};


export type HatsFractionTokenModuleBalancesArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<BalanceOfFractionToken_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<BalanceOfFractionToken_Filter>;
};


export type HatsFractionTokenModuleInitializedTokensArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<InitializedFractionToken_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<InitializedFractionToken_Filter>;
};


export type HatsFractionTokenModuleTransfersArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<TransferFractionToken_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<TransferFractionToken_Filter>;
};

export type HatsFractionTokenModule_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<HatsFractionTokenModule_Filter>>>;
  balances_?: InputMaybe<BalanceOfFractionToken_Filter>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  initializedTokens_?: InputMaybe<InitializedFractionToken_Filter>;
  or?: InputMaybe<Array<InputMaybe<HatsFractionTokenModule_Filter>>>;
  transfers_?: InputMaybe<TransferFractionToken_Filter>;
  workspaceId?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_gt?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_gte?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  workspaceId_lt?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_lte?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_not?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
};

export enum HatsFractionTokenModule_OrderBy {
  Balances = 'balances',
  Id = 'id',
  InitializedTokens = 'initializedTokens',
  Transfers = 'transfers',
  WorkspaceId = 'workspaceId'
}

export type InitializedFractionToken = {
  __typename?: 'InitializedFractionToken';
  blockNumber: Scalars['BigInt']['output'];
  blockTimestamp: Scalars['BigInt']['output'];
  hatId: Scalars['BigInt']['output'];
  hatsFractionTokenModule: HatsFractionTokenModule;
  id: Scalars['ID']['output'];
  tokenId: Scalars['BigInt']['output'];
  wearer: Scalars['String']['output'];
  workspaceId: Scalars['ID']['output'];
};

export type InitializedFractionToken_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<InitializedFractionToken_Filter>>>;
  blockNumber?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  blockTimestamp?: InputMaybe<Scalars['BigInt']['input']>;
  blockTimestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  blockTimestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  blockTimestamp_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  blockTimestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  blockTimestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  blockTimestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  blockTimestamp_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  hatId?: InputMaybe<Scalars['BigInt']['input']>;
  hatId_gt?: InputMaybe<Scalars['BigInt']['input']>;
  hatId_gte?: InputMaybe<Scalars['BigInt']['input']>;
  hatId_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  hatId_lt?: InputMaybe<Scalars['BigInt']['input']>;
  hatId_lte?: InputMaybe<Scalars['BigInt']['input']>;
  hatId_not?: InputMaybe<Scalars['BigInt']['input']>;
  hatId_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  hatsFractionTokenModule?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_?: InputMaybe<HatsFractionTokenModule_Filter>;
  hatsFractionTokenModule_contains?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_ends_with?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_gt?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_gte?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_in?: InputMaybe<Array<Scalars['String']['input']>>;
  hatsFractionTokenModule_lt?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_lte?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_not?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_not_contains?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  hatsFractionTokenModule_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_starts_with?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  or?: InputMaybe<Array<InputMaybe<InitializedFractionToken_Filter>>>;
  tokenId?: InputMaybe<Scalars['BigInt']['input']>;
  tokenId_gt?: InputMaybe<Scalars['BigInt']['input']>;
  tokenId_gte?: InputMaybe<Scalars['BigInt']['input']>;
  tokenId_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  tokenId_lt?: InputMaybe<Scalars['BigInt']['input']>;
  tokenId_lte?: InputMaybe<Scalars['BigInt']['input']>;
  tokenId_not?: InputMaybe<Scalars['BigInt']['input']>;
  tokenId_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  wearer?: InputMaybe<Scalars['String']['input']>;
  wearer_contains?: InputMaybe<Scalars['String']['input']>;
  wearer_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  wearer_ends_with?: InputMaybe<Scalars['String']['input']>;
  wearer_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  wearer_gt?: InputMaybe<Scalars['String']['input']>;
  wearer_gte?: InputMaybe<Scalars['String']['input']>;
  wearer_in?: InputMaybe<Array<Scalars['String']['input']>>;
  wearer_lt?: InputMaybe<Scalars['String']['input']>;
  wearer_lte?: InputMaybe<Scalars['String']['input']>;
  wearer_not?: InputMaybe<Scalars['String']['input']>;
  wearer_not_contains?: InputMaybe<Scalars['String']['input']>;
  wearer_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  wearer_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  wearer_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  wearer_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  wearer_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  wearer_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  wearer_starts_with?: InputMaybe<Scalars['String']['input']>;
  wearer_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  workspaceId?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_gt?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_gte?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  workspaceId_lt?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_lte?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_not?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
};

export enum InitializedFractionToken_OrderBy {
  BlockNumber = 'blockNumber',
  BlockTimestamp = 'blockTimestamp',
  HatId = 'hatId',
  HatsFractionTokenModule = 'hatsFractionTokenModule',
  HatsFractionTokenModuleId = 'hatsFractionTokenModule__id',
  HatsFractionTokenModuleWorkspaceId = 'hatsFractionTokenModule__workspaceId',
  Id = 'id',
  TokenId = 'tokenId',
  Wearer = 'wearer',
  WorkspaceId = 'workspaceId'
}

export type MintThanksToken = {
  __typename?: 'MintThanksToken';
  amount: Scalars['BigInt']['output'];
  blockNumber: Scalars['BigInt']['output'];
  blockTimestamp: Scalars['BigInt']['output'];
  from: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  thanksToken: ThanksToken;
  to: Scalars['String']['output'];
  workspaceId: Scalars['ID']['output'];
};

export type MintThanksToken_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  amount?: InputMaybe<Scalars['BigInt']['input']>;
  amount_gt?: InputMaybe<Scalars['BigInt']['input']>;
  amount_gte?: InputMaybe<Scalars['BigInt']['input']>;
  amount_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  amount_lt?: InputMaybe<Scalars['BigInt']['input']>;
  amount_lte?: InputMaybe<Scalars['BigInt']['input']>;
  amount_not?: InputMaybe<Scalars['BigInt']['input']>;
  amount_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  and?: InputMaybe<Array<InputMaybe<MintThanksToken_Filter>>>;
  blockNumber?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  blockTimestamp?: InputMaybe<Scalars['BigInt']['input']>;
  blockTimestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  blockTimestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  blockTimestamp_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  blockTimestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  blockTimestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  blockTimestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  blockTimestamp_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  from?: InputMaybe<Scalars['String']['input']>;
  from_contains?: InputMaybe<Scalars['String']['input']>;
  from_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  from_ends_with?: InputMaybe<Scalars['String']['input']>;
  from_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  from_gt?: InputMaybe<Scalars['String']['input']>;
  from_gte?: InputMaybe<Scalars['String']['input']>;
  from_in?: InputMaybe<Array<Scalars['String']['input']>>;
  from_lt?: InputMaybe<Scalars['String']['input']>;
  from_lte?: InputMaybe<Scalars['String']['input']>;
  from_not?: InputMaybe<Scalars['String']['input']>;
  from_not_contains?: InputMaybe<Scalars['String']['input']>;
  from_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  from_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  from_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  from_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  from_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  from_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  from_starts_with?: InputMaybe<Scalars['String']['input']>;
  from_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  or?: InputMaybe<Array<InputMaybe<MintThanksToken_Filter>>>;
  thanksToken?: InputMaybe<Scalars['String']['input']>;
  thanksToken_?: InputMaybe<ThanksToken_Filter>;
  thanksToken_contains?: InputMaybe<Scalars['String']['input']>;
  thanksToken_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  thanksToken_ends_with?: InputMaybe<Scalars['String']['input']>;
  thanksToken_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  thanksToken_gt?: InputMaybe<Scalars['String']['input']>;
  thanksToken_gte?: InputMaybe<Scalars['String']['input']>;
  thanksToken_in?: InputMaybe<Array<Scalars['String']['input']>>;
  thanksToken_lt?: InputMaybe<Scalars['String']['input']>;
  thanksToken_lte?: InputMaybe<Scalars['String']['input']>;
  thanksToken_not?: InputMaybe<Scalars['String']['input']>;
  thanksToken_not_contains?: InputMaybe<Scalars['String']['input']>;
  thanksToken_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  thanksToken_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  thanksToken_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  thanksToken_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  thanksToken_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  thanksToken_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  thanksToken_starts_with?: InputMaybe<Scalars['String']['input']>;
  thanksToken_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  to?: InputMaybe<Scalars['String']['input']>;
  to_contains?: InputMaybe<Scalars['String']['input']>;
  to_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  to_ends_with?: InputMaybe<Scalars['String']['input']>;
  to_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  to_gt?: InputMaybe<Scalars['String']['input']>;
  to_gte?: InputMaybe<Scalars['String']['input']>;
  to_in?: InputMaybe<Array<Scalars['String']['input']>>;
  to_lt?: InputMaybe<Scalars['String']['input']>;
  to_lte?: InputMaybe<Scalars['String']['input']>;
  to_not?: InputMaybe<Scalars['String']['input']>;
  to_not_contains?: InputMaybe<Scalars['String']['input']>;
  to_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  to_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  to_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  to_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  to_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  to_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  to_starts_with?: InputMaybe<Scalars['String']['input']>;
  to_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  workspaceId?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_gt?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_gte?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  workspaceId_lt?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_lte?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_not?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
};

export enum MintThanksToken_OrderBy {
  Amount = 'amount',
  BlockNumber = 'blockNumber',
  BlockTimestamp = 'blockTimestamp',
  From = 'from',
  Id = 'id',
  ThanksToken = 'thanksToken',
  ThanksTokenId = 'thanksToken__id',
  ThanksTokenWorkspaceId = 'thanksToken__workspaceId',
  To = 'to',
  WorkspaceId = 'workspaceId'
}

/** Defines the order direction, either ascending or descending */
export enum OrderDirection {
  Asc = 'asc',
  Desc = 'desc'
}

export type Query = {
  __typename?: 'Query';
  /** Access to subgraph metadata */
  _meta?: Maybe<_Meta_>;
  amountOfMintThanksToken?: Maybe<AmountOfMintThanksToken>;
  amountOfMintThanksTokens: Array<AmountOfMintThanksToken>;
  balanceOfFractionToken?: Maybe<BalanceOfFractionToken>;
  balanceOfFractionTokens: Array<BalanceOfFractionToken>;
  balanceOfThanksToken?: Maybe<BalanceOfThanksToken>;
  balanceOfThanksTokens: Array<BalanceOfThanksToken>;
  hatsFractionTokenModule?: Maybe<HatsFractionTokenModule>;
  hatsFractionTokenModules: Array<HatsFractionTokenModule>;
  initializedFractionToken?: Maybe<InitializedFractionToken>;
  initializedFractionTokens: Array<InitializedFractionToken>;
  mintThanksToken?: Maybe<MintThanksToken>;
  mintThanksTokens: Array<MintThanksToken>;
  thanksToken?: Maybe<ThanksToken>;
  thanksTokens: Array<ThanksToken>;
  transferFractionToken?: Maybe<TransferFractionToken>;
  transferFractionTokens: Array<TransferFractionToken>;
  transferThanksToken?: Maybe<TransferThanksToken>;
  transferThanksTokens: Array<TransferThanksToken>;
  workspace?: Maybe<Workspace>;
  workspaces: Array<Workspace>;
};


export type Query_MetaArgs = {
  block?: InputMaybe<Block_Height>;
};


export type QueryAmountOfMintThanksTokenArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryAmountOfMintThanksTokensArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<AmountOfMintThanksToken_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<AmountOfMintThanksToken_Filter>;
};


export type QueryBalanceOfFractionTokenArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryBalanceOfFractionTokensArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<BalanceOfFractionToken_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<BalanceOfFractionToken_Filter>;
};


export type QueryBalanceOfThanksTokenArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryBalanceOfThanksTokensArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<BalanceOfThanksToken_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<BalanceOfThanksToken_Filter>;
};


export type QueryHatsFractionTokenModuleArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryHatsFractionTokenModulesArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<HatsFractionTokenModule_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<HatsFractionTokenModule_Filter>;
};


export type QueryInitializedFractionTokenArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryInitializedFractionTokensArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<InitializedFractionToken_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<InitializedFractionToken_Filter>;
};


export type QueryMintThanksTokenArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryMintThanksTokensArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<MintThanksToken_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<MintThanksToken_Filter>;
};


export type QueryThanksTokenArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryThanksTokensArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<ThanksToken_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<ThanksToken_Filter>;
};


export type QueryTransferFractionTokenArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryTransferFractionTokensArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<TransferFractionToken_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<TransferFractionToken_Filter>;
};


export type QueryTransferThanksTokenArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryTransferThanksTokensArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<TransferThanksToken_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<TransferThanksToken_Filter>;
};


export type QueryWorkspaceArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryWorkspacesArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Workspace_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Workspace_Filter>;
};

export type Subscription = {
  __typename?: 'Subscription';
  /** Access to subgraph metadata */
  _meta?: Maybe<_Meta_>;
  amountOfMintThanksToken?: Maybe<AmountOfMintThanksToken>;
  amountOfMintThanksTokens: Array<AmountOfMintThanksToken>;
  balanceOfFractionToken?: Maybe<BalanceOfFractionToken>;
  balanceOfFractionTokens: Array<BalanceOfFractionToken>;
  balanceOfThanksToken?: Maybe<BalanceOfThanksToken>;
  balanceOfThanksTokens: Array<BalanceOfThanksToken>;
  hatsFractionTokenModule?: Maybe<HatsFractionTokenModule>;
  hatsFractionTokenModules: Array<HatsFractionTokenModule>;
  initializedFractionToken?: Maybe<InitializedFractionToken>;
  initializedFractionTokens: Array<InitializedFractionToken>;
  mintThanksToken?: Maybe<MintThanksToken>;
  mintThanksTokens: Array<MintThanksToken>;
  thanksToken?: Maybe<ThanksToken>;
  thanksTokens: Array<ThanksToken>;
  transferFractionToken?: Maybe<TransferFractionToken>;
  transferFractionTokens: Array<TransferFractionToken>;
  transferThanksToken?: Maybe<TransferThanksToken>;
  transferThanksTokens: Array<TransferThanksToken>;
  workspace?: Maybe<Workspace>;
  workspaces: Array<Workspace>;
};


export type Subscription_MetaArgs = {
  block?: InputMaybe<Block_Height>;
};


export type SubscriptionAmountOfMintThanksTokenArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionAmountOfMintThanksTokensArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<AmountOfMintThanksToken_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<AmountOfMintThanksToken_Filter>;
};


export type SubscriptionBalanceOfFractionTokenArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionBalanceOfFractionTokensArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<BalanceOfFractionToken_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<BalanceOfFractionToken_Filter>;
};


export type SubscriptionBalanceOfThanksTokenArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionBalanceOfThanksTokensArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<BalanceOfThanksToken_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<BalanceOfThanksToken_Filter>;
};


export type SubscriptionHatsFractionTokenModuleArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionHatsFractionTokenModulesArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<HatsFractionTokenModule_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<HatsFractionTokenModule_Filter>;
};


export type SubscriptionInitializedFractionTokenArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionInitializedFractionTokensArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<InitializedFractionToken_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<InitializedFractionToken_Filter>;
};


export type SubscriptionMintThanksTokenArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionMintThanksTokensArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<MintThanksToken_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<MintThanksToken_Filter>;
};


export type SubscriptionThanksTokenArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionThanksTokensArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<ThanksToken_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<ThanksToken_Filter>;
};


export type SubscriptionTransferFractionTokenArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionTransferFractionTokensArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<TransferFractionToken_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<TransferFractionToken_Filter>;
};


export type SubscriptionTransferThanksTokenArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionTransferThanksTokensArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<TransferThanksToken_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<TransferThanksToken_Filter>;
};


export type SubscriptionWorkspaceArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionWorkspacesArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Workspace_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Workspace_Filter>;
};

export type ThanksToken = {
  __typename?: 'ThanksToken';
  balances: Array<BalanceOfThanksToken>;
  id: Scalars['ID']['output'];
  mintAmounts: Array<AmountOfMintThanksToken>;
  mints: Array<MintThanksToken>;
  transfers: Array<TransferThanksToken>;
  workspaceId: Scalars['ID']['output'];
};


export type ThanksTokenBalancesArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<BalanceOfThanksToken_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<BalanceOfThanksToken_Filter>;
};


export type ThanksTokenMintAmountsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<AmountOfMintThanksToken_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<AmountOfMintThanksToken_Filter>;
};


export type ThanksTokenMintsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<MintThanksToken_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<MintThanksToken_Filter>;
};


export type ThanksTokenTransfersArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<TransferThanksToken_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<TransferThanksToken_Filter>;
};

export type ThanksToken_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<ThanksToken_Filter>>>;
  balances_?: InputMaybe<BalanceOfThanksToken_Filter>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  mintAmounts_?: InputMaybe<AmountOfMintThanksToken_Filter>;
  mints_?: InputMaybe<MintThanksToken_Filter>;
  or?: InputMaybe<Array<InputMaybe<ThanksToken_Filter>>>;
  transfers_?: InputMaybe<TransferThanksToken_Filter>;
  workspaceId?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_gt?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_gte?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  workspaceId_lt?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_lte?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_not?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
};

export enum ThanksToken_OrderBy {
  Balances = 'balances',
  Id = 'id',
  MintAmounts = 'mintAmounts',
  Mints = 'mints',
  Transfers = 'transfers',
  WorkspaceId = 'workspaceId'
}

export type TransferFractionToken = {
  __typename?: 'TransferFractionToken';
  amount: Scalars['BigInt']['output'];
  blockNumber: Scalars['BigInt']['output'];
  blockTimestamp: Scalars['BigInt']['output'];
  from: Scalars['String']['output'];
  hatsFractionTokenModule: HatsFractionTokenModule;
  id: Scalars['ID']['output'];
  to: Scalars['String']['output'];
  tokenId: Scalars['BigInt']['output'];
  workspaceId: Scalars['ID']['output'];
};

export type TransferFractionToken_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  amount?: InputMaybe<Scalars['BigInt']['input']>;
  amount_gt?: InputMaybe<Scalars['BigInt']['input']>;
  amount_gte?: InputMaybe<Scalars['BigInt']['input']>;
  amount_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  amount_lt?: InputMaybe<Scalars['BigInt']['input']>;
  amount_lte?: InputMaybe<Scalars['BigInt']['input']>;
  amount_not?: InputMaybe<Scalars['BigInt']['input']>;
  amount_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  and?: InputMaybe<Array<InputMaybe<TransferFractionToken_Filter>>>;
  blockNumber?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  blockTimestamp?: InputMaybe<Scalars['BigInt']['input']>;
  blockTimestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  blockTimestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  blockTimestamp_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  blockTimestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  blockTimestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  blockTimestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  blockTimestamp_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  from?: InputMaybe<Scalars['String']['input']>;
  from_contains?: InputMaybe<Scalars['String']['input']>;
  from_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  from_ends_with?: InputMaybe<Scalars['String']['input']>;
  from_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  from_gt?: InputMaybe<Scalars['String']['input']>;
  from_gte?: InputMaybe<Scalars['String']['input']>;
  from_in?: InputMaybe<Array<Scalars['String']['input']>>;
  from_lt?: InputMaybe<Scalars['String']['input']>;
  from_lte?: InputMaybe<Scalars['String']['input']>;
  from_not?: InputMaybe<Scalars['String']['input']>;
  from_not_contains?: InputMaybe<Scalars['String']['input']>;
  from_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  from_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  from_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  from_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  from_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  from_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  from_starts_with?: InputMaybe<Scalars['String']['input']>;
  from_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_?: InputMaybe<HatsFractionTokenModule_Filter>;
  hatsFractionTokenModule_contains?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_ends_with?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_gt?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_gte?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_in?: InputMaybe<Array<Scalars['String']['input']>>;
  hatsFractionTokenModule_lt?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_lte?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_not?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_not_contains?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  hatsFractionTokenModule_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_starts_with?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  or?: InputMaybe<Array<InputMaybe<TransferFractionToken_Filter>>>;
  to?: InputMaybe<Scalars['String']['input']>;
  to_contains?: InputMaybe<Scalars['String']['input']>;
  to_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  to_ends_with?: InputMaybe<Scalars['String']['input']>;
  to_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  to_gt?: InputMaybe<Scalars['String']['input']>;
  to_gte?: InputMaybe<Scalars['String']['input']>;
  to_in?: InputMaybe<Array<Scalars['String']['input']>>;
  to_lt?: InputMaybe<Scalars['String']['input']>;
  to_lte?: InputMaybe<Scalars['String']['input']>;
  to_not?: InputMaybe<Scalars['String']['input']>;
  to_not_contains?: InputMaybe<Scalars['String']['input']>;
  to_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  to_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  to_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  to_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  to_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  to_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  to_starts_with?: InputMaybe<Scalars['String']['input']>;
  to_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  tokenId?: InputMaybe<Scalars['BigInt']['input']>;
  tokenId_gt?: InputMaybe<Scalars['BigInt']['input']>;
  tokenId_gte?: InputMaybe<Scalars['BigInt']['input']>;
  tokenId_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  tokenId_lt?: InputMaybe<Scalars['BigInt']['input']>;
  tokenId_lte?: InputMaybe<Scalars['BigInt']['input']>;
  tokenId_not?: InputMaybe<Scalars['BigInt']['input']>;
  tokenId_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  workspaceId?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_gt?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_gte?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  workspaceId_lt?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_lte?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_not?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
};

export enum TransferFractionToken_OrderBy {
  Amount = 'amount',
  BlockNumber = 'blockNumber',
  BlockTimestamp = 'blockTimestamp',
  From = 'from',
  HatsFractionTokenModule = 'hatsFractionTokenModule',
  HatsFractionTokenModuleId = 'hatsFractionTokenModule__id',
  HatsFractionTokenModuleWorkspaceId = 'hatsFractionTokenModule__workspaceId',
  Id = 'id',
  To = 'to',
  TokenId = 'tokenId',
  WorkspaceId = 'workspaceId'
}

export type TransferThanksToken = {
  __typename?: 'TransferThanksToken';
  amount: Scalars['BigInt']['output'];
  blockNumber: Scalars['BigInt']['output'];
  blockTimestamp: Scalars['BigInt']['output'];
  from: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  thanksToken: ThanksToken;
  to: Scalars['String']['output'];
  workspaceId: Scalars['ID']['output'];
};

export type TransferThanksToken_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  amount?: InputMaybe<Scalars['BigInt']['input']>;
  amount_gt?: InputMaybe<Scalars['BigInt']['input']>;
  amount_gte?: InputMaybe<Scalars['BigInt']['input']>;
  amount_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  amount_lt?: InputMaybe<Scalars['BigInt']['input']>;
  amount_lte?: InputMaybe<Scalars['BigInt']['input']>;
  amount_not?: InputMaybe<Scalars['BigInt']['input']>;
  amount_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  and?: InputMaybe<Array<InputMaybe<TransferThanksToken_Filter>>>;
  blockNumber?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  blockTimestamp?: InputMaybe<Scalars['BigInt']['input']>;
  blockTimestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  blockTimestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  blockTimestamp_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  blockTimestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  blockTimestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  blockTimestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  blockTimestamp_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  from?: InputMaybe<Scalars['String']['input']>;
  from_contains?: InputMaybe<Scalars['String']['input']>;
  from_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  from_ends_with?: InputMaybe<Scalars['String']['input']>;
  from_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  from_gt?: InputMaybe<Scalars['String']['input']>;
  from_gte?: InputMaybe<Scalars['String']['input']>;
  from_in?: InputMaybe<Array<Scalars['String']['input']>>;
  from_lt?: InputMaybe<Scalars['String']['input']>;
  from_lte?: InputMaybe<Scalars['String']['input']>;
  from_not?: InputMaybe<Scalars['String']['input']>;
  from_not_contains?: InputMaybe<Scalars['String']['input']>;
  from_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  from_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  from_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  from_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  from_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  from_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  from_starts_with?: InputMaybe<Scalars['String']['input']>;
  from_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  or?: InputMaybe<Array<InputMaybe<TransferThanksToken_Filter>>>;
  thanksToken?: InputMaybe<Scalars['String']['input']>;
  thanksToken_?: InputMaybe<ThanksToken_Filter>;
  thanksToken_contains?: InputMaybe<Scalars['String']['input']>;
  thanksToken_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  thanksToken_ends_with?: InputMaybe<Scalars['String']['input']>;
  thanksToken_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  thanksToken_gt?: InputMaybe<Scalars['String']['input']>;
  thanksToken_gte?: InputMaybe<Scalars['String']['input']>;
  thanksToken_in?: InputMaybe<Array<Scalars['String']['input']>>;
  thanksToken_lt?: InputMaybe<Scalars['String']['input']>;
  thanksToken_lte?: InputMaybe<Scalars['String']['input']>;
  thanksToken_not?: InputMaybe<Scalars['String']['input']>;
  thanksToken_not_contains?: InputMaybe<Scalars['String']['input']>;
  thanksToken_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  thanksToken_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  thanksToken_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  thanksToken_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  thanksToken_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  thanksToken_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  thanksToken_starts_with?: InputMaybe<Scalars['String']['input']>;
  thanksToken_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  to?: InputMaybe<Scalars['String']['input']>;
  to_contains?: InputMaybe<Scalars['String']['input']>;
  to_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  to_ends_with?: InputMaybe<Scalars['String']['input']>;
  to_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  to_gt?: InputMaybe<Scalars['String']['input']>;
  to_gte?: InputMaybe<Scalars['String']['input']>;
  to_in?: InputMaybe<Array<Scalars['String']['input']>>;
  to_lt?: InputMaybe<Scalars['String']['input']>;
  to_lte?: InputMaybe<Scalars['String']['input']>;
  to_not?: InputMaybe<Scalars['String']['input']>;
  to_not_contains?: InputMaybe<Scalars['String']['input']>;
  to_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  to_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  to_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  to_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  to_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  to_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  to_starts_with?: InputMaybe<Scalars['String']['input']>;
  to_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  workspaceId?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_gt?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_gte?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  workspaceId_lt?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_lte?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_not?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
};

export enum TransferThanksToken_OrderBy {
  Amount = 'amount',
  BlockNumber = 'blockNumber',
  BlockTimestamp = 'blockTimestamp',
  From = 'from',
  Id = 'id',
  ThanksToken = 'thanksToken',
  ThanksTokenId = 'thanksToken__id',
  ThanksTokenWorkspaceId = 'thanksToken__workspaceId',
  To = 'to',
  WorkspaceId = 'workspaceId'
}

export type Workspace = {
  __typename?: 'Workspace';
  blockNumber: Scalars['BigInt']['output'];
  blockTimestamp: Scalars['BigInt']['output'];
  creator: Scalars['String']['output'];
  creatorHatId: Scalars['BigInt']['output'];
  hatsFractionTokenModule?: Maybe<HatsFractionTokenModule>;
  hatsHatCreatorModule: Scalars['String']['output'];
  hatsTimeFrameModule: Scalars['String']['output'];
  hatterHatId: Scalars['BigInt']['output'];
  id: Scalars['ID']['output'];
  minterHatId: Scalars['BigInt']['output'];
  operatorHatId: Scalars['BigInt']['output'];
  owner: Scalars['String']['output'];
  splitCreator: Scalars['String']['output'];
  thanksToken: ThanksToken;
  topHatId: Scalars['BigInt']['output'];
};

export type Workspace_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<Workspace_Filter>>>;
  blockNumber?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  blockTimestamp?: InputMaybe<Scalars['BigInt']['input']>;
  blockTimestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  blockTimestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  blockTimestamp_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  blockTimestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  blockTimestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  blockTimestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  blockTimestamp_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  creator?: InputMaybe<Scalars['String']['input']>;
  creatorHatId?: InputMaybe<Scalars['BigInt']['input']>;
  creatorHatId_gt?: InputMaybe<Scalars['BigInt']['input']>;
  creatorHatId_gte?: InputMaybe<Scalars['BigInt']['input']>;
  creatorHatId_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  creatorHatId_lt?: InputMaybe<Scalars['BigInt']['input']>;
  creatorHatId_lte?: InputMaybe<Scalars['BigInt']['input']>;
  creatorHatId_not?: InputMaybe<Scalars['BigInt']['input']>;
  creatorHatId_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  creator_contains?: InputMaybe<Scalars['String']['input']>;
  creator_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  creator_ends_with?: InputMaybe<Scalars['String']['input']>;
  creator_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  creator_gt?: InputMaybe<Scalars['String']['input']>;
  creator_gte?: InputMaybe<Scalars['String']['input']>;
  creator_in?: InputMaybe<Array<Scalars['String']['input']>>;
  creator_lt?: InputMaybe<Scalars['String']['input']>;
  creator_lte?: InputMaybe<Scalars['String']['input']>;
  creator_not?: InputMaybe<Scalars['String']['input']>;
  creator_not_contains?: InputMaybe<Scalars['String']['input']>;
  creator_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  creator_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  creator_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  creator_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  creator_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  creator_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  creator_starts_with?: InputMaybe<Scalars['String']['input']>;
  creator_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_?: InputMaybe<HatsFractionTokenModule_Filter>;
  hatsFractionTokenModule_contains?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_ends_with?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_gt?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_gte?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_in?: InputMaybe<Array<Scalars['String']['input']>>;
  hatsFractionTokenModule_lt?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_lte?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_not?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_not_contains?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  hatsFractionTokenModule_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_starts_with?: InputMaybe<Scalars['String']['input']>;
  hatsFractionTokenModule_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  hatsHatCreatorModule?: InputMaybe<Scalars['String']['input']>;
  hatsHatCreatorModule_contains?: InputMaybe<Scalars['String']['input']>;
  hatsHatCreatorModule_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  hatsHatCreatorModule_ends_with?: InputMaybe<Scalars['String']['input']>;
  hatsHatCreatorModule_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  hatsHatCreatorModule_gt?: InputMaybe<Scalars['String']['input']>;
  hatsHatCreatorModule_gte?: InputMaybe<Scalars['String']['input']>;
  hatsHatCreatorModule_in?: InputMaybe<Array<Scalars['String']['input']>>;
  hatsHatCreatorModule_lt?: InputMaybe<Scalars['String']['input']>;
  hatsHatCreatorModule_lte?: InputMaybe<Scalars['String']['input']>;
  hatsHatCreatorModule_not?: InputMaybe<Scalars['String']['input']>;
  hatsHatCreatorModule_not_contains?: InputMaybe<Scalars['String']['input']>;
  hatsHatCreatorModule_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  hatsHatCreatorModule_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  hatsHatCreatorModule_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  hatsHatCreatorModule_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  hatsHatCreatorModule_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  hatsHatCreatorModule_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  hatsHatCreatorModule_starts_with?: InputMaybe<Scalars['String']['input']>;
  hatsHatCreatorModule_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  hatsTimeFrameModule?: InputMaybe<Scalars['String']['input']>;
  hatsTimeFrameModule_contains?: InputMaybe<Scalars['String']['input']>;
  hatsTimeFrameModule_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  hatsTimeFrameModule_ends_with?: InputMaybe<Scalars['String']['input']>;
  hatsTimeFrameModule_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  hatsTimeFrameModule_gt?: InputMaybe<Scalars['String']['input']>;
  hatsTimeFrameModule_gte?: InputMaybe<Scalars['String']['input']>;
  hatsTimeFrameModule_in?: InputMaybe<Array<Scalars['String']['input']>>;
  hatsTimeFrameModule_lt?: InputMaybe<Scalars['String']['input']>;
  hatsTimeFrameModule_lte?: InputMaybe<Scalars['String']['input']>;
  hatsTimeFrameModule_not?: InputMaybe<Scalars['String']['input']>;
  hatsTimeFrameModule_not_contains?: InputMaybe<Scalars['String']['input']>;
  hatsTimeFrameModule_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  hatsTimeFrameModule_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  hatsTimeFrameModule_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  hatsTimeFrameModule_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  hatsTimeFrameModule_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  hatsTimeFrameModule_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  hatsTimeFrameModule_starts_with?: InputMaybe<Scalars['String']['input']>;
  hatsTimeFrameModule_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  hatterHatId?: InputMaybe<Scalars['BigInt']['input']>;
  hatterHatId_gt?: InputMaybe<Scalars['BigInt']['input']>;
  hatterHatId_gte?: InputMaybe<Scalars['BigInt']['input']>;
  hatterHatId_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  hatterHatId_lt?: InputMaybe<Scalars['BigInt']['input']>;
  hatterHatId_lte?: InputMaybe<Scalars['BigInt']['input']>;
  hatterHatId_not?: InputMaybe<Scalars['BigInt']['input']>;
  hatterHatId_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  minterHatId?: InputMaybe<Scalars['BigInt']['input']>;
  minterHatId_gt?: InputMaybe<Scalars['BigInt']['input']>;
  minterHatId_gte?: InputMaybe<Scalars['BigInt']['input']>;
  minterHatId_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  minterHatId_lt?: InputMaybe<Scalars['BigInt']['input']>;
  minterHatId_lte?: InputMaybe<Scalars['BigInt']['input']>;
  minterHatId_not?: InputMaybe<Scalars['BigInt']['input']>;
  minterHatId_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  operatorHatId?: InputMaybe<Scalars['BigInt']['input']>;
  operatorHatId_gt?: InputMaybe<Scalars['BigInt']['input']>;
  operatorHatId_gte?: InputMaybe<Scalars['BigInt']['input']>;
  operatorHatId_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  operatorHatId_lt?: InputMaybe<Scalars['BigInt']['input']>;
  operatorHatId_lte?: InputMaybe<Scalars['BigInt']['input']>;
  operatorHatId_not?: InputMaybe<Scalars['BigInt']['input']>;
  operatorHatId_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  or?: InputMaybe<Array<InputMaybe<Workspace_Filter>>>;
  owner?: InputMaybe<Scalars['String']['input']>;
  owner_contains?: InputMaybe<Scalars['String']['input']>;
  owner_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  owner_ends_with?: InputMaybe<Scalars['String']['input']>;
  owner_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  owner_gt?: InputMaybe<Scalars['String']['input']>;
  owner_gte?: InputMaybe<Scalars['String']['input']>;
  owner_in?: InputMaybe<Array<Scalars['String']['input']>>;
  owner_lt?: InputMaybe<Scalars['String']['input']>;
  owner_lte?: InputMaybe<Scalars['String']['input']>;
  owner_not?: InputMaybe<Scalars['String']['input']>;
  owner_not_contains?: InputMaybe<Scalars['String']['input']>;
  owner_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  owner_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  owner_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  owner_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  owner_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  owner_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  owner_starts_with?: InputMaybe<Scalars['String']['input']>;
  owner_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  splitCreator?: InputMaybe<Scalars['String']['input']>;
  splitCreator_contains?: InputMaybe<Scalars['String']['input']>;
  splitCreator_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  splitCreator_ends_with?: InputMaybe<Scalars['String']['input']>;
  splitCreator_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  splitCreator_gt?: InputMaybe<Scalars['String']['input']>;
  splitCreator_gte?: InputMaybe<Scalars['String']['input']>;
  splitCreator_in?: InputMaybe<Array<Scalars['String']['input']>>;
  splitCreator_lt?: InputMaybe<Scalars['String']['input']>;
  splitCreator_lte?: InputMaybe<Scalars['String']['input']>;
  splitCreator_not?: InputMaybe<Scalars['String']['input']>;
  splitCreator_not_contains?: InputMaybe<Scalars['String']['input']>;
  splitCreator_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  splitCreator_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  splitCreator_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  splitCreator_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  splitCreator_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  splitCreator_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  splitCreator_starts_with?: InputMaybe<Scalars['String']['input']>;
  splitCreator_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  thanksToken?: InputMaybe<Scalars['String']['input']>;
  thanksToken_?: InputMaybe<ThanksToken_Filter>;
  thanksToken_contains?: InputMaybe<Scalars['String']['input']>;
  thanksToken_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  thanksToken_ends_with?: InputMaybe<Scalars['String']['input']>;
  thanksToken_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  thanksToken_gt?: InputMaybe<Scalars['String']['input']>;
  thanksToken_gte?: InputMaybe<Scalars['String']['input']>;
  thanksToken_in?: InputMaybe<Array<Scalars['String']['input']>>;
  thanksToken_lt?: InputMaybe<Scalars['String']['input']>;
  thanksToken_lte?: InputMaybe<Scalars['String']['input']>;
  thanksToken_not?: InputMaybe<Scalars['String']['input']>;
  thanksToken_not_contains?: InputMaybe<Scalars['String']['input']>;
  thanksToken_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  thanksToken_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  thanksToken_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  thanksToken_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  thanksToken_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  thanksToken_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  thanksToken_starts_with?: InputMaybe<Scalars['String']['input']>;
  thanksToken_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  topHatId?: InputMaybe<Scalars['BigInt']['input']>;
  topHatId_gt?: InputMaybe<Scalars['BigInt']['input']>;
  topHatId_gte?: InputMaybe<Scalars['BigInt']['input']>;
  topHatId_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  topHatId_lt?: InputMaybe<Scalars['BigInt']['input']>;
  topHatId_lte?: InputMaybe<Scalars['BigInt']['input']>;
  topHatId_not?: InputMaybe<Scalars['BigInt']['input']>;
  topHatId_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
};

export enum Workspace_OrderBy {
  BlockNumber = 'blockNumber',
  BlockTimestamp = 'blockTimestamp',
  Creator = 'creator',
  CreatorHatId = 'creatorHatId',
  HatsFractionTokenModule = 'hatsFractionTokenModule',
  HatsFractionTokenModuleId = 'hatsFractionTokenModule__id',
  HatsFractionTokenModuleWorkspaceId = 'hatsFractionTokenModule__workspaceId',
  HatsHatCreatorModule = 'hatsHatCreatorModule',
  HatsTimeFrameModule = 'hatsTimeFrameModule',
  HatterHatId = 'hatterHatId',
  Id = 'id',
  MinterHatId = 'minterHatId',
  OperatorHatId = 'operatorHatId',
  Owner = 'owner',
  SplitCreator = 'splitCreator',
  ThanksToken = 'thanksToken',
  ThanksTokenId = 'thanksToken__id',
  ThanksTokenWorkspaceId = 'thanksToken__workspaceId',
  TopHatId = 'topHatId'
}

export type _Block_ = {
  __typename?: '_Block_';
  /** The hash of the block */
  hash?: Maybe<Scalars['Bytes']['output']>;
  /** The block number */
  number: Scalars['Int']['output'];
  /** The hash of the parent block */
  parentHash?: Maybe<Scalars['Bytes']['output']>;
  /** Integer representation of the timestamp stored in blocks for the chain */
  timestamp?: Maybe<Scalars['Int']['output']>;
};

/** The type for the top-level _meta field */
export type _Meta_ = {
  __typename?: '_Meta_';
  /**
   * Information about a specific subgraph block. The hash of the block
   * will be null if the _meta field has a block constraint that asks for
   * a block number. It will be filled if the _meta field has no block constraint
   * and therefore asks for the latest  block
   *
   */
  block: _Block_;
  /** The deployment ID */
  deployment: Scalars['String']['output'];
  /** If `true`, the subgraph encountered indexing errors at some past block */
  hasIndexingErrors: Scalars['Boolean']['output'];
};

export enum _SubgraphErrorPolicy_ {
  /** Data will be returned even if the subgraph has indexing errors */
  Allow = 'allow',
  /** If the subgraph has indexing errors, data will be omitted. The default. */
  Deny = 'deny'
}

export type GetTransferFractionTokensQueryVariables = Exact<{
  where?: InputMaybe<TransferFractionToken_Filter>;
  orderBy?: InputMaybe<TransferFractionToken_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  first?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetTransferFractionTokensQuery = { __typename?: 'Query', transferFractionTokens: Array<{ __typename?: 'TransferFractionToken', id: string, to: string, tokenId: any, workspaceId: string, from: string, blockTimestamp: any, blockNumber: any, amount: any }> };

export type BalanceOfFractionTokensQueryVariables = Exact<{
  where?: InputMaybe<BalanceOfFractionToken_Filter>;
  orderBy?: InputMaybe<BalanceOfFractionToken_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  first?: InputMaybe<Scalars['Int']['input']>;
}>;


export type BalanceOfFractionTokensQuery = { __typename?: 'Query', balanceOfFractionTokens: Array<{ __typename?: 'BalanceOfFractionToken', tokenId: any, balance: any, owner: string, workspaceId: string, hatId: any, id: string, updatedAt: any, wearer: string }> };

export type GetThanksTokenBalancesQueryVariables = Exact<{
  where?: InputMaybe<BalanceOfThanksToken_Filter>;
  orderBy?: InputMaybe<BalanceOfThanksToken_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  first?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetThanksTokenBalancesQuery = { __typename?: 'Query', balanceOfThanksTokens: Array<{ __typename?: 'BalanceOfThanksToken', id: string, owner: string, balance: any, workspaceId: string, updatedAt: any, thanksToken: { __typename?: 'ThanksToken', id: string, workspaceId: string } }> };

export type GetThanksTokenMintsQueryVariables = Exact<{
  where?: InputMaybe<MintThanksToken_Filter>;
  orderBy?: InputMaybe<MintThanksToken_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  first?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetThanksTokenMintsQuery = { __typename?: 'Query', mintThanksTokens: Array<{ __typename?: 'MintThanksToken', id: string, from: string, to: string, amount: any, workspaceId: string, blockTimestamp: any, blockNumber: any, thanksToken: { __typename?: 'ThanksToken', id: string, workspaceId: string } }> };

export type GetThanksTokenTransfersQueryVariables = Exact<{
  where?: InputMaybe<TransferThanksToken_Filter>;
  orderBy?: InputMaybe<TransferThanksToken_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  first?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetThanksTokenTransfersQuery = { __typename?: 'Query', transferThanksTokens: Array<{ __typename?: 'TransferThanksToken', id: string, from: string, to: string, amount: any, workspaceId: string, blockTimestamp: any, blockNumber: any, thanksToken: { __typename?: 'ThanksToken', id: string, workspaceId: string } }> };

export type GetWorkspacesQueryVariables = Exact<{
  where?: InputMaybe<Workspace_Filter>;
}>;


export type GetWorkspacesQuery = { __typename?: 'Query', workspaces: Array<{ __typename?: 'Workspace', id: string, minterHatId: any, operatorHatId: any, owner: string, splitCreator: string, topHatId: any, hatterHatId: any, hatsTimeFrameModule: string, hatsHatCreatorModule: string, creator: string, creatorHatId: any, blockTimestamp: any, blockNumber: any, hatsFractionTokenModule?: { __typename?: 'HatsFractionTokenModule', id: string } | null, thanksToken: { __typename?: 'ThanksToken', id: string } }> };

export type GetWorkspaceQueryVariables = Exact<{
  workspaceId: Scalars['ID']['input'];
}>;


export type GetWorkspaceQuery = { __typename?: 'Query', workspace?: { __typename?: 'Workspace', id: string, minterHatId: any, operatorHatId: any, owner: string, splitCreator: string, topHatId: any, hatterHatId: any, hatsTimeFrameModule: string, hatsHatCreatorModule: string, creator: string, creatorHatId: any, blockTimestamp: any, blockNumber: any, hatsFractionTokenModule?: { __typename?: 'HatsFractionTokenModule', id: string } | null, thanksToken: { __typename?: 'ThanksToken', id: string } } | null };


export const GetTransferFractionTokensDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTransferFractionTokens"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"TransferFractionToken_filter"}},"defaultValue":{"kind":"ObjectValue","fields":[]}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"TransferFractionToken_orderBy"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"OrderDirection"}},"defaultValue":{"kind":"EnumValue","value":"asc"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"10"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"transferFractionTokens"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderDirection"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"to"}},{"kind":"Field","name":{"kind":"Name","value":"tokenId"}},{"kind":"Field","name":{"kind":"Name","value":"workspaceId"}},{"kind":"Field","name":{"kind":"Name","value":"from"}},{"kind":"Field","name":{"kind":"Name","value":"blockTimestamp"}},{"kind":"Field","name":{"kind":"Name","value":"blockNumber"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}}]}}]}}]} as unknown as DocumentNode<GetTransferFractionTokensQuery, GetTransferFractionTokensQueryVariables>;
export const BalanceOfFractionTokensDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"BalanceOfFractionTokens"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"BalanceOfFractionToken_filter"}},"defaultValue":{"kind":"ObjectValue","fields":[]}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"BalanceOfFractionToken_orderBy"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"OrderDirection"}},"defaultValue":{"kind":"EnumValue","value":"asc"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"100"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"balanceOfFractionTokens"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderDirection"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"tokenId"}},{"kind":"Field","name":{"kind":"Name","value":"balance"}},{"kind":"Field","name":{"kind":"Name","value":"owner"}},{"kind":"Field","name":{"kind":"Name","value":"workspaceId"}},{"kind":"Field","name":{"kind":"Name","value":"hatId"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"wearer"}}]}}]}}]} as unknown as DocumentNode<BalanceOfFractionTokensQuery, BalanceOfFractionTokensQueryVariables>;
export const GetThanksTokenBalancesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetThanksTokenBalances"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"BalanceOfThanksToken_filter"}},"defaultValue":{"kind":"ObjectValue","fields":[]}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"BalanceOfThanksToken_orderBy"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"OrderDirection"}},"defaultValue":{"kind":"EnumValue","value":"asc"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"100"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"balanceOfThanksTokens"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderDirection"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"thanksToken"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"workspaceId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"owner"}},{"kind":"Field","name":{"kind":"Name","value":"balance"}},{"kind":"Field","name":{"kind":"Name","value":"workspaceId"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<GetThanksTokenBalancesQuery, GetThanksTokenBalancesQueryVariables>;
export const GetThanksTokenMintsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetThanksTokenMints"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"MintThanksToken_filter"}},"defaultValue":{"kind":"ObjectValue","fields":[]}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"MintThanksToken_orderBy"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"OrderDirection"}},"defaultValue":{"kind":"EnumValue","value":"asc"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"10"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mintThanksTokens"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderDirection"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"thanksToken"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"workspaceId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"from"}},{"kind":"Field","name":{"kind":"Name","value":"to"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"workspaceId"}},{"kind":"Field","name":{"kind":"Name","value":"blockTimestamp"}},{"kind":"Field","name":{"kind":"Name","value":"blockNumber"}}]}}]}}]} as unknown as DocumentNode<GetThanksTokenMintsQuery, GetThanksTokenMintsQueryVariables>;
export const GetThanksTokenTransfersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetThanksTokenTransfers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"TransferThanksToken_filter"}},"defaultValue":{"kind":"ObjectValue","fields":[]}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"TransferThanksToken_orderBy"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"OrderDirection"}},"defaultValue":{"kind":"EnumValue","value":"asc"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"10"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"transferThanksTokens"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderDirection"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"thanksToken"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"workspaceId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"from"}},{"kind":"Field","name":{"kind":"Name","value":"to"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"workspaceId"}},{"kind":"Field","name":{"kind":"Name","value":"blockTimestamp"}},{"kind":"Field","name":{"kind":"Name","value":"blockNumber"}}]}}]}}]} as unknown as DocumentNode<GetThanksTokenTransfersQuery, GetThanksTokenTransfersQueryVariables>;
export const GetWorkspacesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetWorkspaces"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Workspace_filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspaces"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"minterHatId"}},{"kind":"Field","name":{"kind":"Name","value":"operatorHatId"}},{"kind":"Field","name":{"kind":"Name","value":"owner"}},{"kind":"Field","name":{"kind":"Name","value":"splitCreator"}},{"kind":"Field","name":{"kind":"Name","value":"topHatId"}},{"kind":"Field","name":{"kind":"Name","value":"hatterHatId"}},{"kind":"Field","name":{"kind":"Name","value":"hatsTimeFrameModule"}},{"kind":"Field","name":{"kind":"Name","value":"hatsHatCreatorModule"}},{"kind":"Field","name":{"kind":"Name","value":"creator"}},{"kind":"Field","name":{"kind":"Name","value":"creatorHatId"}},{"kind":"Field","name":{"kind":"Name","value":"blockTimestamp"}},{"kind":"Field","name":{"kind":"Name","value":"blockNumber"}},{"kind":"Field","name":{"kind":"Name","value":"hatsFractionTokenModule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"thanksToken"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<GetWorkspacesQuery, GetWorkspacesQueryVariables>;
export const GetWorkspaceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetWorkspace"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"minterHatId"}},{"kind":"Field","name":{"kind":"Name","value":"operatorHatId"}},{"kind":"Field","name":{"kind":"Name","value":"owner"}},{"kind":"Field","name":{"kind":"Name","value":"splitCreator"}},{"kind":"Field","name":{"kind":"Name","value":"topHatId"}},{"kind":"Field","name":{"kind":"Name","value":"hatterHatId"}},{"kind":"Field","name":{"kind":"Name","value":"hatsTimeFrameModule"}},{"kind":"Field","name":{"kind":"Name","value":"hatsHatCreatorModule"}},{"kind":"Field","name":{"kind":"Name","value":"creator"}},{"kind":"Field","name":{"kind":"Name","value":"creatorHatId"}},{"kind":"Field","name":{"kind":"Name","value":"blockTimestamp"}},{"kind":"Field","name":{"kind":"Name","value":"blockNumber"}},{"kind":"Field","name":{"kind":"Name","value":"hatsFractionTokenModule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"thanksToken"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<GetWorkspaceQuery, GetWorkspaceQueryVariables>;