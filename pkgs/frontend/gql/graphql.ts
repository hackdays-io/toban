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
  /** 8 bytes signed integer */
  Int8: { input: any; output: any; }
  /** A string representation of microseconds UNIX timestamp (16 digits) */
  Timestamp: { input: any; output: any; }
};

/** Indicates whether the current, partially filled bucket should be included in the response. Defaults to `exclude` */
export enum Aggregation_Current {
  /** Exclude the current, partially filled bucket from the response */
  Exclude = 'exclude',
  /** Include the current, partially filled bucket in the response */
  Include = 'include'
}

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

export type EscrowedRoleShare = {
  __typename?: 'EscrowedRoleShare';
  amount: Scalars['BigInt']['output'];
  creator: Scalars['String']['output'];
  hatId: Scalars['BigInt']['output'];
  id: Scalars['ID']['output'];
  updatedAt: Scalars['BigInt']['output'];
  wearer: Scalars['String']['output'];
  workspace: Workspace;
};

export type EscrowedRoleShare_Filter = {
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
  and?: InputMaybe<Array<InputMaybe<EscrowedRoleShare_Filter>>>;
  creator?: InputMaybe<Scalars['String']['input']>;
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
  hatId?: InputMaybe<Scalars['BigInt']['input']>;
  hatId_gt?: InputMaybe<Scalars['BigInt']['input']>;
  hatId_gte?: InputMaybe<Scalars['BigInt']['input']>;
  hatId_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  hatId_lt?: InputMaybe<Scalars['BigInt']['input']>;
  hatId_lte?: InputMaybe<Scalars['BigInt']['input']>;
  hatId_not?: InputMaybe<Scalars['BigInt']['input']>;
  hatId_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  or?: InputMaybe<Array<InputMaybe<EscrowedRoleShare_Filter>>>;
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
  workspace?: InputMaybe<Scalars['String']['input']>;
  workspace_?: InputMaybe<Workspace_Filter>;
  workspace_contains?: InputMaybe<Scalars['String']['input']>;
  workspace_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  workspace_ends_with?: InputMaybe<Scalars['String']['input']>;
  workspace_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  workspace_gt?: InputMaybe<Scalars['String']['input']>;
  workspace_gte?: InputMaybe<Scalars['String']['input']>;
  workspace_in?: InputMaybe<Array<Scalars['String']['input']>>;
  workspace_lt?: InputMaybe<Scalars['String']['input']>;
  workspace_lte?: InputMaybe<Scalars['String']['input']>;
  workspace_not?: InputMaybe<Scalars['String']['input']>;
  workspace_not_contains?: InputMaybe<Scalars['String']['input']>;
  workspace_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  workspace_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  workspace_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  workspace_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  workspace_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  workspace_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  workspace_starts_with?: InputMaybe<Scalars['String']['input']>;
  workspace_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
};

export enum EscrowedRoleShare_OrderBy {
  Amount = 'amount',
  Creator = 'creator',
  HatId = 'hatId',
  Id = 'id',
  UpdatedAt = 'updatedAt',
  Wearer = 'wearer',
  Workspace = 'workspace',
  WorkspaceBlockNumber = 'workspace__blockNumber',
  WorkspaceBlockTimestamp = 'workspace__blockTimestamp',
  WorkspaceCreator = 'workspace__creator',
  WorkspaceCreatorHatId = 'workspace__creatorHatId',
  WorkspaceHatsHatCreatorModule = 'workspace__hatsHatCreatorModule',
  WorkspaceHatsQuestModule = 'workspace__hatsQuestModule',
  WorkspaceHatsTimeFrameModule = 'workspace__hatsTimeFrameModule',
  WorkspaceHatterHatId = 'workspace__hatterHatId',
  WorkspaceId = 'workspace__id',
  WorkspaceMemberHatId = 'workspace__memberHatId',
  WorkspaceMinterHatId = 'workspace__minterHatId',
  WorkspaceOperatorHatId = 'workspace__operatorHatId',
  WorkspaceOwner = 'workspace__owner',
  WorkspaceSplitCreator = 'workspace__splitCreator',
  WorkspaceTopHatId = 'workspace__topHatId'
}

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

export type HatsQuestModule = {
  __typename?: 'HatsQuestModule';
  id: Scalars['ID']['output'];
  quests: Array<Quest>;
  workspaceId: Scalars['ID']['output'];
};


export type HatsQuestModuleQuestsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Quest_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<Quest_Filter>;
};

export type HatsQuestModule_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<HatsQuestModule_Filter>>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  or?: InputMaybe<Array<InputMaybe<HatsQuestModule_Filter>>>;
  quests_?: InputMaybe<Quest_Filter>;
  workspaceId?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_gt?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_gte?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  workspaceId_lt?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_lte?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_not?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
};

export enum HatsQuestModule_OrderBy {
  Id = 'id',
  Quests = 'quests',
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
  data: Scalars['Bytes']['output'];
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
  data?: InputMaybe<Scalars['Bytes']['input']>;
  data_contains?: InputMaybe<Scalars['Bytes']['input']>;
  data_gt?: InputMaybe<Scalars['Bytes']['input']>;
  data_gte?: InputMaybe<Scalars['Bytes']['input']>;
  data_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  data_lt?: InputMaybe<Scalars['Bytes']['input']>;
  data_lte?: InputMaybe<Scalars['Bytes']['input']>;
  data_not?: InputMaybe<Scalars['Bytes']['input']>;
  data_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  data_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
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
  Data = 'data',
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
  escrowedRoleShare?: Maybe<EscrowedRoleShare>;
  escrowedRoleShares: Array<EscrowedRoleShare>;
  hatsFractionTokenModule?: Maybe<HatsFractionTokenModule>;
  hatsFractionTokenModules: Array<HatsFractionTokenModule>;
  hatsQuestModule?: Maybe<HatsQuestModule>;
  hatsQuestModules: Array<HatsQuestModule>;
  initializedFractionToken?: Maybe<InitializedFractionToken>;
  initializedFractionTokens: Array<InitializedFractionToken>;
  mintThanksToken?: Maybe<MintThanksToken>;
  mintThanksTokens: Array<MintThanksToken>;
  quest?: Maybe<Quest>;
  questApproval?: Maybe<QuestApproval>;
  questApprovals: Array<QuestApproval>;
  quests: Array<Quest>;
  submissionAttempt?: Maybe<SubmissionAttempt>;
  submissionAttempts: Array<SubmissionAttempt>;
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


export type QueryEscrowedRoleShareArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryEscrowedRoleSharesArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<EscrowedRoleShare_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<EscrowedRoleShare_Filter>;
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


export type QueryHatsQuestModuleArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryHatsQuestModulesArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<HatsQuestModule_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<HatsQuestModule_Filter>;
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


export type QueryQuestArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryQuestApprovalArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryQuestApprovalsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<QuestApproval_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<QuestApproval_Filter>;
};


export type QueryQuestsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Quest_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Quest_Filter>;
};


export type QuerySubmissionAttemptArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QuerySubmissionAttemptsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<SubmissionAttempt_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<SubmissionAttempt_Filter>;
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

export type Quest = {
  __typename?: 'Quest';
  amount: Scalars['BigInt']['output'];
  approvalCount: Scalars['Int']['output'];
  attemptCount: Scalars['Int']['output'];
  attempts: Array<SubmissionAttempt>;
  blockNumber: Scalars['BigInt']['output'];
  blockTimestamp: Scalars['BigInt']['output'];
  cancelledAt?: Maybe<Scalars['BigInt']['output']>;
  completedAt?: Maybe<Scalars['BigInt']['output']>;
  createdAt: Scalars['BigInt']['output'];
  creator: Scalars['String']['output'];
  hatId: Scalars['BigInt']['output'];
  id: Scalars['ID']['output'];
  metadataHash: Scalars['Bytes']['output'];
  questId: Scalars['BigInt']['output'];
  questModule: Scalars['String']['output'];
  questModuleEntity: HatsQuestModule;
  status: QuestStatus;
  submittedAt?: Maybe<Scalars['BigInt']['output']>;
  submitter?: Maybe<Scalars['String']['output']>;
  txHash: Scalars['Bytes']['output'];
  wearer: Scalars['String']['output'];
  workspace: Workspace;
};


export type QuestAttemptsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<SubmissionAttempt_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<SubmissionAttempt_Filter>;
};

export type QuestApproval = {
  __typename?: 'QuestApproval';
  approvedAt: Scalars['BigInt']['output'];
  approver: Scalars['String']['output'];
  attempt: SubmissionAttempt;
  blockNumber: Scalars['BigInt']['output'];
  id: Scalars['ID']['output'];
  quest: Quest;
  txHash: Scalars['Bytes']['output'];
};

export type QuestApproval_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<QuestApproval_Filter>>>;
  approvedAt?: InputMaybe<Scalars['BigInt']['input']>;
  approvedAt_gt?: InputMaybe<Scalars['BigInt']['input']>;
  approvedAt_gte?: InputMaybe<Scalars['BigInt']['input']>;
  approvedAt_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  approvedAt_lt?: InputMaybe<Scalars['BigInt']['input']>;
  approvedAt_lte?: InputMaybe<Scalars['BigInt']['input']>;
  approvedAt_not?: InputMaybe<Scalars['BigInt']['input']>;
  approvedAt_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  approver?: InputMaybe<Scalars['String']['input']>;
  approver_contains?: InputMaybe<Scalars['String']['input']>;
  approver_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  approver_ends_with?: InputMaybe<Scalars['String']['input']>;
  approver_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  approver_gt?: InputMaybe<Scalars['String']['input']>;
  approver_gte?: InputMaybe<Scalars['String']['input']>;
  approver_in?: InputMaybe<Array<Scalars['String']['input']>>;
  approver_lt?: InputMaybe<Scalars['String']['input']>;
  approver_lte?: InputMaybe<Scalars['String']['input']>;
  approver_not?: InputMaybe<Scalars['String']['input']>;
  approver_not_contains?: InputMaybe<Scalars['String']['input']>;
  approver_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  approver_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  approver_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  approver_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  approver_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  approver_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  approver_starts_with?: InputMaybe<Scalars['String']['input']>;
  approver_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  attempt?: InputMaybe<Scalars['String']['input']>;
  attempt_?: InputMaybe<SubmissionAttempt_Filter>;
  attempt_contains?: InputMaybe<Scalars['String']['input']>;
  attempt_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  attempt_ends_with?: InputMaybe<Scalars['String']['input']>;
  attempt_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  attempt_gt?: InputMaybe<Scalars['String']['input']>;
  attempt_gte?: InputMaybe<Scalars['String']['input']>;
  attempt_in?: InputMaybe<Array<Scalars['String']['input']>>;
  attempt_lt?: InputMaybe<Scalars['String']['input']>;
  attempt_lte?: InputMaybe<Scalars['String']['input']>;
  attempt_not?: InputMaybe<Scalars['String']['input']>;
  attempt_not_contains?: InputMaybe<Scalars['String']['input']>;
  attempt_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  attempt_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  attempt_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  attempt_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  attempt_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  attempt_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  attempt_starts_with?: InputMaybe<Scalars['String']['input']>;
  attempt_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  blockNumber?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  or?: InputMaybe<Array<InputMaybe<QuestApproval_Filter>>>;
  quest?: InputMaybe<Scalars['String']['input']>;
  quest_?: InputMaybe<Quest_Filter>;
  quest_contains?: InputMaybe<Scalars['String']['input']>;
  quest_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  quest_ends_with?: InputMaybe<Scalars['String']['input']>;
  quest_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  quest_gt?: InputMaybe<Scalars['String']['input']>;
  quest_gte?: InputMaybe<Scalars['String']['input']>;
  quest_in?: InputMaybe<Array<Scalars['String']['input']>>;
  quest_lt?: InputMaybe<Scalars['String']['input']>;
  quest_lte?: InputMaybe<Scalars['String']['input']>;
  quest_not?: InputMaybe<Scalars['String']['input']>;
  quest_not_contains?: InputMaybe<Scalars['String']['input']>;
  quest_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  quest_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  quest_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  quest_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  quest_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  quest_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  quest_starts_with?: InputMaybe<Scalars['String']['input']>;
  quest_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  txHash?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_contains?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_gt?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_gte?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  txHash_lt?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_lte?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_not?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
};

export enum QuestApproval_OrderBy {
  ApprovedAt = 'approvedAt',
  Approver = 'approver',
  Attempt = 'attempt',
  AttemptApprovedAt = 'attempt__approvedAt',
  AttemptAttemptIndex = 'attempt__attemptIndex',
  AttemptId = 'attempt__id',
  AttemptOutcome = 'attempt__outcome',
  AttemptRejectedAt = 'attempt__rejectedAt',
  AttemptSubmittedAt = 'attempt__submittedAt',
  AttemptSubmitter = 'attempt__submitter',
  AttemptWithdrawnAt = 'attempt__withdrawnAt',
  BlockNumber = 'blockNumber',
  Id = 'id',
  Quest = 'quest',
  QuestAmount = 'quest__amount',
  QuestApprovalCount = 'quest__approvalCount',
  QuestAttemptCount = 'quest__attemptCount',
  QuestBlockNumber = 'quest__blockNumber',
  QuestBlockTimestamp = 'quest__blockTimestamp',
  QuestCancelledAt = 'quest__cancelledAt',
  QuestCompletedAt = 'quest__completedAt',
  QuestCreatedAt = 'quest__createdAt',
  QuestCreator = 'quest__creator',
  QuestHatId = 'quest__hatId',
  QuestId = 'quest__id',
  QuestMetadataHash = 'quest__metadataHash',
  QuestQuestId = 'quest__questId',
  QuestQuestModule = 'quest__questModule',
  QuestStatus = 'quest__status',
  QuestSubmittedAt = 'quest__submittedAt',
  QuestSubmitter = 'quest__submitter',
  QuestTxHash = 'quest__txHash',
  QuestWearer = 'quest__wearer',
  TxHash = 'txHash'
}

export enum QuestStatus {
  Cancelled = 'Cancelled',
  Completed = 'Completed',
  Open = 'Open',
  PendingReview = 'PendingReview'
}

export type Quest_Filter = {
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
  and?: InputMaybe<Array<InputMaybe<Quest_Filter>>>;
  approvalCount?: InputMaybe<Scalars['Int']['input']>;
  approvalCount_gt?: InputMaybe<Scalars['Int']['input']>;
  approvalCount_gte?: InputMaybe<Scalars['Int']['input']>;
  approvalCount_in?: InputMaybe<Array<Scalars['Int']['input']>>;
  approvalCount_lt?: InputMaybe<Scalars['Int']['input']>;
  approvalCount_lte?: InputMaybe<Scalars['Int']['input']>;
  approvalCount_not?: InputMaybe<Scalars['Int']['input']>;
  approvalCount_not_in?: InputMaybe<Array<Scalars['Int']['input']>>;
  attemptCount?: InputMaybe<Scalars['Int']['input']>;
  attemptCount_gt?: InputMaybe<Scalars['Int']['input']>;
  attemptCount_gte?: InputMaybe<Scalars['Int']['input']>;
  attemptCount_in?: InputMaybe<Array<Scalars['Int']['input']>>;
  attemptCount_lt?: InputMaybe<Scalars['Int']['input']>;
  attemptCount_lte?: InputMaybe<Scalars['Int']['input']>;
  attemptCount_not?: InputMaybe<Scalars['Int']['input']>;
  attemptCount_not_in?: InputMaybe<Array<Scalars['Int']['input']>>;
  attempts_?: InputMaybe<SubmissionAttempt_Filter>;
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
  cancelledAt?: InputMaybe<Scalars['BigInt']['input']>;
  cancelledAt_gt?: InputMaybe<Scalars['BigInt']['input']>;
  cancelledAt_gte?: InputMaybe<Scalars['BigInt']['input']>;
  cancelledAt_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  cancelledAt_lt?: InputMaybe<Scalars['BigInt']['input']>;
  cancelledAt_lte?: InputMaybe<Scalars['BigInt']['input']>;
  cancelledAt_not?: InputMaybe<Scalars['BigInt']['input']>;
  cancelledAt_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  completedAt?: InputMaybe<Scalars['BigInt']['input']>;
  completedAt_gt?: InputMaybe<Scalars['BigInt']['input']>;
  completedAt_gte?: InputMaybe<Scalars['BigInt']['input']>;
  completedAt_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  completedAt_lt?: InputMaybe<Scalars['BigInt']['input']>;
  completedAt_lte?: InputMaybe<Scalars['BigInt']['input']>;
  completedAt_not?: InputMaybe<Scalars['BigInt']['input']>;
  completedAt_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  createdAt?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_gt?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_gte?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  createdAt_lt?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_lte?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_not?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  creator?: InputMaybe<Scalars['String']['input']>;
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
  hatId?: InputMaybe<Scalars['BigInt']['input']>;
  hatId_gt?: InputMaybe<Scalars['BigInt']['input']>;
  hatId_gte?: InputMaybe<Scalars['BigInt']['input']>;
  hatId_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  hatId_lt?: InputMaybe<Scalars['BigInt']['input']>;
  hatId_lte?: InputMaybe<Scalars['BigInt']['input']>;
  hatId_not?: InputMaybe<Scalars['BigInt']['input']>;
  hatId_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  metadataHash?: InputMaybe<Scalars['Bytes']['input']>;
  metadataHash_contains?: InputMaybe<Scalars['Bytes']['input']>;
  metadataHash_gt?: InputMaybe<Scalars['Bytes']['input']>;
  metadataHash_gte?: InputMaybe<Scalars['Bytes']['input']>;
  metadataHash_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  metadataHash_lt?: InputMaybe<Scalars['Bytes']['input']>;
  metadataHash_lte?: InputMaybe<Scalars['Bytes']['input']>;
  metadataHash_not?: InputMaybe<Scalars['Bytes']['input']>;
  metadataHash_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  metadataHash_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  or?: InputMaybe<Array<InputMaybe<Quest_Filter>>>;
  questId?: InputMaybe<Scalars['BigInt']['input']>;
  questId_gt?: InputMaybe<Scalars['BigInt']['input']>;
  questId_gte?: InputMaybe<Scalars['BigInt']['input']>;
  questId_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  questId_lt?: InputMaybe<Scalars['BigInt']['input']>;
  questId_lte?: InputMaybe<Scalars['BigInt']['input']>;
  questId_not?: InputMaybe<Scalars['BigInt']['input']>;
  questId_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  questModule?: InputMaybe<Scalars['String']['input']>;
  questModuleEntity?: InputMaybe<Scalars['String']['input']>;
  questModuleEntity_?: InputMaybe<HatsQuestModule_Filter>;
  questModuleEntity_contains?: InputMaybe<Scalars['String']['input']>;
  questModuleEntity_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  questModuleEntity_ends_with?: InputMaybe<Scalars['String']['input']>;
  questModuleEntity_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  questModuleEntity_gt?: InputMaybe<Scalars['String']['input']>;
  questModuleEntity_gte?: InputMaybe<Scalars['String']['input']>;
  questModuleEntity_in?: InputMaybe<Array<Scalars['String']['input']>>;
  questModuleEntity_lt?: InputMaybe<Scalars['String']['input']>;
  questModuleEntity_lte?: InputMaybe<Scalars['String']['input']>;
  questModuleEntity_not?: InputMaybe<Scalars['String']['input']>;
  questModuleEntity_not_contains?: InputMaybe<Scalars['String']['input']>;
  questModuleEntity_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  questModuleEntity_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  questModuleEntity_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  questModuleEntity_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  questModuleEntity_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  questModuleEntity_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  questModuleEntity_starts_with?: InputMaybe<Scalars['String']['input']>;
  questModuleEntity_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  questModule_contains?: InputMaybe<Scalars['String']['input']>;
  questModule_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  questModule_ends_with?: InputMaybe<Scalars['String']['input']>;
  questModule_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  questModule_gt?: InputMaybe<Scalars['String']['input']>;
  questModule_gte?: InputMaybe<Scalars['String']['input']>;
  questModule_in?: InputMaybe<Array<Scalars['String']['input']>>;
  questModule_lt?: InputMaybe<Scalars['String']['input']>;
  questModule_lte?: InputMaybe<Scalars['String']['input']>;
  questModule_not?: InputMaybe<Scalars['String']['input']>;
  questModule_not_contains?: InputMaybe<Scalars['String']['input']>;
  questModule_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  questModule_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  questModule_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  questModule_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  questModule_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  questModule_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  questModule_starts_with?: InputMaybe<Scalars['String']['input']>;
  questModule_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<QuestStatus>;
  status_in?: InputMaybe<Array<QuestStatus>>;
  status_not?: InputMaybe<QuestStatus>;
  status_not_in?: InputMaybe<Array<QuestStatus>>;
  submittedAt?: InputMaybe<Scalars['BigInt']['input']>;
  submittedAt_gt?: InputMaybe<Scalars['BigInt']['input']>;
  submittedAt_gte?: InputMaybe<Scalars['BigInt']['input']>;
  submittedAt_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  submittedAt_lt?: InputMaybe<Scalars['BigInt']['input']>;
  submittedAt_lte?: InputMaybe<Scalars['BigInt']['input']>;
  submittedAt_not?: InputMaybe<Scalars['BigInt']['input']>;
  submittedAt_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  submitter?: InputMaybe<Scalars['String']['input']>;
  submitter_contains?: InputMaybe<Scalars['String']['input']>;
  submitter_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  submitter_ends_with?: InputMaybe<Scalars['String']['input']>;
  submitter_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  submitter_gt?: InputMaybe<Scalars['String']['input']>;
  submitter_gte?: InputMaybe<Scalars['String']['input']>;
  submitter_in?: InputMaybe<Array<Scalars['String']['input']>>;
  submitter_lt?: InputMaybe<Scalars['String']['input']>;
  submitter_lte?: InputMaybe<Scalars['String']['input']>;
  submitter_not?: InputMaybe<Scalars['String']['input']>;
  submitter_not_contains?: InputMaybe<Scalars['String']['input']>;
  submitter_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  submitter_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  submitter_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  submitter_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  submitter_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  submitter_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  submitter_starts_with?: InputMaybe<Scalars['String']['input']>;
  submitter_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  txHash?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_contains?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_gt?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_gte?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  txHash_lt?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_lte?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_not?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  txHash_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
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
  workspace?: InputMaybe<Scalars['String']['input']>;
  workspace_?: InputMaybe<Workspace_Filter>;
  workspace_contains?: InputMaybe<Scalars['String']['input']>;
  workspace_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  workspace_ends_with?: InputMaybe<Scalars['String']['input']>;
  workspace_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  workspace_gt?: InputMaybe<Scalars['String']['input']>;
  workspace_gte?: InputMaybe<Scalars['String']['input']>;
  workspace_in?: InputMaybe<Array<Scalars['String']['input']>>;
  workspace_lt?: InputMaybe<Scalars['String']['input']>;
  workspace_lte?: InputMaybe<Scalars['String']['input']>;
  workspace_not?: InputMaybe<Scalars['String']['input']>;
  workspace_not_contains?: InputMaybe<Scalars['String']['input']>;
  workspace_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  workspace_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  workspace_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  workspace_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  workspace_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  workspace_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  workspace_starts_with?: InputMaybe<Scalars['String']['input']>;
  workspace_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
};

export enum Quest_OrderBy {
  Amount = 'amount',
  ApprovalCount = 'approvalCount',
  AttemptCount = 'attemptCount',
  Attempts = 'attempts',
  BlockNumber = 'blockNumber',
  BlockTimestamp = 'blockTimestamp',
  CancelledAt = 'cancelledAt',
  CompletedAt = 'completedAt',
  CreatedAt = 'createdAt',
  Creator = 'creator',
  HatId = 'hatId',
  Id = 'id',
  MetadataHash = 'metadataHash',
  QuestId = 'questId',
  QuestModule = 'questModule',
  QuestModuleEntity = 'questModuleEntity',
  QuestModuleEntityId = 'questModuleEntity__id',
  QuestModuleEntityWorkspaceId = 'questModuleEntity__workspaceId',
  Status = 'status',
  SubmittedAt = 'submittedAt',
  Submitter = 'submitter',
  TxHash = 'txHash',
  Wearer = 'wearer',
  Workspace = 'workspace',
  WorkspaceBlockNumber = 'workspace__blockNumber',
  WorkspaceBlockTimestamp = 'workspace__blockTimestamp',
  WorkspaceCreator = 'workspace__creator',
  WorkspaceCreatorHatId = 'workspace__creatorHatId',
  WorkspaceHatsHatCreatorModule = 'workspace__hatsHatCreatorModule',
  WorkspaceHatsQuestModule = 'workspace__hatsQuestModule',
  WorkspaceHatsTimeFrameModule = 'workspace__hatsTimeFrameModule',
  WorkspaceHatterHatId = 'workspace__hatterHatId',
  WorkspaceId = 'workspace__id',
  WorkspaceMemberHatId = 'workspace__memberHatId',
  WorkspaceMinterHatId = 'workspace__minterHatId',
  WorkspaceOperatorHatId = 'workspace__operatorHatId',
  WorkspaceOwner = 'workspace__owner',
  WorkspaceSplitCreator = 'workspace__splitCreator',
  WorkspaceTopHatId = 'workspace__topHatId'
}

export type SubmissionAttempt = {
  __typename?: 'SubmissionAttempt';
  approvals: Array<QuestApproval>;
  approvedAt?: Maybe<Scalars['BigInt']['output']>;
  attemptIndex: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  outcome: SubmissionOutcome;
  quest: Quest;
  rejectedAt?: Maybe<Scalars['BigInt']['output']>;
  submittedAt: Scalars['BigInt']['output'];
  submitter: Scalars['String']['output'];
  withdrawnAt?: Maybe<Scalars['BigInt']['output']>;
};


export type SubmissionAttemptApprovalsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<QuestApproval_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<QuestApproval_Filter>;
};

export type SubmissionAttempt_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<SubmissionAttempt_Filter>>>;
  approvals_?: InputMaybe<QuestApproval_Filter>;
  approvedAt?: InputMaybe<Scalars['BigInt']['input']>;
  approvedAt_gt?: InputMaybe<Scalars['BigInt']['input']>;
  approvedAt_gte?: InputMaybe<Scalars['BigInt']['input']>;
  approvedAt_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  approvedAt_lt?: InputMaybe<Scalars['BigInt']['input']>;
  approvedAt_lte?: InputMaybe<Scalars['BigInt']['input']>;
  approvedAt_not?: InputMaybe<Scalars['BigInt']['input']>;
  approvedAt_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  attemptIndex?: InputMaybe<Scalars['Int']['input']>;
  attemptIndex_gt?: InputMaybe<Scalars['Int']['input']>;
  attemptIndex_gte?: InputMaybe<Scalars['Int']['input']>;
  attemptIndex_in?: InputMaybe<Array<Scalars['Int']['input']>>;
  attemptIndex_lt?: InputMaybe<Scalars['Int']['input']>;
  attemptIndex_lte?: InputMaybe<Scalars['Int']['input']>;
  attemptIndex_not?: InputMaybe<Scalars['Int']['input']>;
  attemptIndex_not_in?: InputMaybe<Array<Scalars['Int']['input']>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  or?: InputMaybe<Array<InputMaybe<SubmissionAttempt_Filter>>>;
  outcome?: InputMaybe<SubmissionOutcome>;
  outcome_in?: InputMaybe<Array<SubmissionOutcome>>;
  outcome_not?: InputMaybe<SubmissionOutcome>;
  outcome_not_in?: InputMaybe<Array<SubmissionOutcome>>;
  quest?: InputMaybe<Scalars['String']['input']>;
  quest_?: InputMaybe<Quest_Filter>;
  quest_contains?: InputMaybe<Scalars['String']['input']>;
  quest_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  quest_ends_with?: InputMaybe<Scalars['String']['input']>;
  quest_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  quest_gt?: InputMaybe<Scalars['String']['input']>;
  quest_gte?: InputMaybe<Scalars['String']['input']>;
  quest_in?: InputMaybe<Array<Scalars['String']['input']>>;
  quest_lt?: InputMaybe<Scalars['String']['input']>;
  quest_lte?: InputMaybe<Scalars['String']['input']>;
  quest_not?: InputMaybe<Scalars['String']['input']>;
  quest_not_contains?: InputMaybe<Scalars['String']['input']>;
  quest_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  quest_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  quest_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  quest_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  quest_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  quest_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  quest_starts_with?: InputMaybe<Scalars['String']['input']>;
  quest_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  rejectedAt?: InputMaybe<Scalars['BigInt']['input']>;
  rejectedAt_gt?: InputMaybe<Scalars['BigInt']['input']>;
  rejectedAt_gte?: InputMaybe<Scalars['BigInt']['input']>;
  rejectedAt_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  rejectedAt_lt?: InputMaybe<Scalars['BigInt']['input']>;
  rejectedAt_lte?: InputMaybe<Scalars['BigInt']['input']>;
  rejectedAt_not?: InputMaybe<Scalars['BigInt']['input']>;
  rejectedAt_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  submittedAt?: InputMaybe<Scalars['BigInt']['input']>;
  submittedAt_gt?: InputMaybe<Scalars['BigInt']['input']>;
  submittedAt_gte?: InputMaybe<Scalars['BigInt']['input']>;
  submittedAt_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  submittedAt_lt?: InputMaybe<Scalars['BigInt']['input']>;
  submittedAt_lte?: InputMaybe<Scalars['BigInt']['input']>;
  submittedAt_not?: InputMaybe<Scalars['BigInt']['input']>;
  submittedAt_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  submitter?: InputMaybe<Scalars['String']['input']>;
  submitter_contains?: InputMaybe<Scalars['String']['input']>;
  submitter_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  submitter_ends_with?: InputMaybe<Scalars['String']['input']>;
  submitter_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  submitter_gt?: InputMaybe<Scalars['String']['input']>;
  submitter_gte?: InputMaybe<Scalars['String']['input']>;
  submitter_in?: InputMaybe<Array<Scalars['String']['input']>>;
  submitter_lt?: InputMaybe<Scalars['String']['input']>;
  submitter_lte?: InputMaybe<Scalars['String']['input']>;
  submitter_not?: InputMaybe<Scalars['String']['input']>;
  submitter_not_contains?: InputMaybe<Scalars['String']['input']>;
  submitter_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  submitter_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  submitter_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  submitter_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  submitter_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  submitter_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  submitter_starts_with?: InputMaybe<Scalars['String']['input']>;
  submitter_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  withdrawnAt?: InputMaybe<Scalars['BigInt']['input']>;
  withdrawnAt_gt?: InputMaybe<Scalars['BigInt']['input']>;
  withdrawnAt_gte?: InputMaybe<Scalars['BigInt']['input']>;
  withdrawnAt_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  withdrawnAt_lt?: InputMaybe<Scalars['BigInt']['input']>;
  withdrawnAt_lte?: InputMaybe<Scalars['BigInt']['input']>;
  withdrawnAt_not?: InputMaybe<Scalars['BigInt']['input']>;
  withdrawnAt_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
};

export enum SubmissionAttempt_OrderBy {
  Approvals = 'approvals',
  ApprovedAt = 'approvedAt',
  AttemptIndex = 'attemptIndex',
  Id = 'id',
  Outcome = 'outcome',
  Quest = 'quest',
  QuestAmount = 'quest__amount',
  QuestApprovalCount = 'quest__approvalCount',
  QuestAttemptCount = 'quest__attemptCount',
  QuestBlockNumber = 'quest__blockNumber',
  QuestBlockTimestamp = 'quest__blockTimestamp',
  QuestCancelledAt = 'quest__cancelledAt',
  QuestCompletedAt = 'quest__completedAt',
  QuestCreatedAt = 'quest__createdAt',
  QuestCreator = 'quest__creator',
  QuestHatId = 'quest__hatId',
  QuestId = 'quest__id',
  QuestMetadataHash = 'quest__metadataHash',
  QuestQuestId = 'quest__questId',
  QuestQuestModule = 'quest__questModule',
  QuestStatus = 'quest__status',
  QuestSubmittedAt = 'quest__submittedAt',
  QuestSubmitter = 'quest__submitter',
  QuestTxHash = 'quest__txHash',
  QuestWearer = 'quest__wearer',
  RejectedAt = 'rejectedAt',
  SubmittedAt = 'submittedAt',
  Submitter = 'submitter',
  WithdrawnAt = 'withdrawnAt'
}

export enum SubmissionOutcome {
  Approved = 'Approved',
  Pending = 'Pending',
  Rejected = 'Rejected',
  Withdrawn = 'Withdrawn'
}

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
  escrowedRoleShares: Array<EscrowedRoleShare>;
  hatsFractionTokenModule: HatsFractionTokenModule;
  hatsHatCreatorModule: Scalars['String']['output'];
  hatsQuestModule: Scalars['String']['output'];
  hatsTimeFrameModule: Scalars['String']['output'];
  hatterHatId: Scalars['BigInt']['output'];
  id: Scalars['ID']['output'];
  memberHatId: Scalars['BigInt']['output'];
  minterHatId: Scalars['BigInt']['output'];
  operatorHatId: Scalars['BigInt']['output'];
  owner: Scalars['String']['output'];
  quests: Array<Quest>;
  splitCreator: Scalars['String']['output'];
  thanksToken: ThanksToken;
  topHatId: Scalars['BigInt']['output'];
};


export type WorkspaceEscrowedRoleSharesArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<EscrowedRoleShare_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<EscrowedRoleShare_Filter>;
};


export type WorkspaceQuestsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Quest_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<Quest_Filter>;
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
  escrowedRoleShares_?: InputMaybe<EscrowedRoleShare_Filter>;
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
  hatsQuestModule?: InputMaybe<Scalars['String']['input']>;
  hatsQuestModule_contains?: InputMaybe<Scalars['String']['input']>;
  hatsQuestModule_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  hatsQuestModule_ends_with?: InputMaybe<Scalars['String']['input']>;
  hatsQuestModule_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  hatsQuestModule_gt?: InputMaybe<Scalars['String']['input']>;
  hatsQuestModule_gte?: InputMaybe<Scalars['String']['input']>;
  hatsQuestModule_in?: InputMaybe<Array<Scalars['String']['input']>>;
  hatsQuestModule_lt?: InputMaybe<Scalars['String']['input']>;
  hatsQuestModule_lte?: InputMaybe<Scalars['String']['input']>;
  hatsQuestModule_not?: InputMaybe<Scalars['String']['input']>;
  hatsQuestModule_not_contains?: InputMaybe<Scalars['String']['input']>;
  hatsQuestModule_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  hatsQuestModule_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  hatsQuestModule_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  hatsQuestModule_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  hatsQuestModule_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  hatsQuestModule_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  hatsQuestModule_starts_with?: InputMaybe<Scalars['String']['input']>;
  hatsQuestModule_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
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
  memberHatId?: InputMaybe<Scalars['BigInt']['input']>;
  memberHatId_gt?: InputMaybe<Scalars['BigInt']['input']>;
  memberHatId_gte?: InputMaybe<Scalars['BigInt']['input']>;
  memberHatId_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  memberHatId_lt?: InputMaybe<Scalars['BigInt']['input']>;
  memberHatId_lte?: InputMaybe<Scalars['BigInt']['input']>;
  memberHatId_not?: InputMaybe<Scalars['BigInt']['input']>;
  memberHatId_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
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
  quests_?: InputMaybe<Quest_Filter>;
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
  EscrowedRoleShares = 'escrowedRoleShares',
  HatsFractionTokenModule = 'hatsFractionTokenModule',
  HatsFractionTokenModuleId = 'hatsFractionTokenModule__id',
  HatsFractionTokenModuleWorkspaceId = 'hatsFractionTokenModule__workspaceId',
  HatsHatCreatorModule = 'hatsHatCreatorModule',
  HatsQuestModule = 'hatsQuestModule',
  HatsTimeFrameModule = 'hatsTimeFrameModule',
  HatterHatId = 'hatterHatId',
  Id = 'id',
  MemberHatId = 'memberHatId',
  MinterHatId = 'minterHatId',
  OperatorHatId = 'operatorHatId',
  Owner = 'owner',
  Quests = 'quests',
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


export type GetTransferFractionTokensQuery = { __typename?: 'Query', transferFractionTokens: Array<{ __typename?: 'TransferFractionToken', id: string, from: string, to: string, tokenId: any, workspaceId: string, blockTimestamp: any, blockNumber: any, amount: any, hatsFractionTokenModule: { __typename?: 'HatsFractionTokenModule', id: string } }> };

export type BalanceOfFractionTokensQueryVariables = Exact<{
  where?: InputMaybe<BalanceOfFractionToken_Filter>;
  orderBy?: InputMaybe<BalanceOfFractionToken_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  first?: InputMaybe<Scalars['Int']['input']>;
}>;


export type BalanceOfFractionTokensQuery = { __typename?: 'Query', balanceOfFractionTokens: Array<{ __typename?: 'BalanceOfFractionToken', tokenId: any, balance: any, owner: string, workspaceId: string, hatId: any, id: string, updatedAt: any, wearer: string }> };

export type GetQuestsForWorkspaceQueryVariables = Exact<{
  workspaceId: Scalars['String']['input'];
  first?: InputMaybe<Scalars['Int']['input']>;
  statuses?: InputMaybe<Array<QuestStatus> | QuestStatus>;
}>;


export type GetQuestsForWorkspaceQuery = { __typename?: 'Query', quests: Array<{ __typename?: 'Quest', id: string, questId: any, hatId: any, wearer: string, creator: string, submitter?: string | null, amount: any, status: QuestStatus, metadataHash: any, approvalCount: number, attemptCount: number, createdAt: any, blockTimestamp: any }> };

export type GetQuestDetailQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetQuestDetailQuery = { __typename?: 'Query', quest?: { __typename?: 'Quest', id: string, questId: any, hatId: any, wearer: string, creator: string, submitter?: string | null, amount: any, status: QuestStatus, metadataHash: any, approvalCount: number, attemptCount: number, createdAt: any, submittedAt?: any | null, completedAt?: any | null, cancelledAt?: any | null, questModule: string, attempts: Array<{ __typename?: 'SubmissionAttempt', id: string, attemptIndex: number, submitter: string, submittedAt: any, outcome: SubmissionOutcome, approvals: Array<{ __typename?: 'QuestApproval', id: string, approver: string, approvedAt: any }> }> } | null };

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


export type GetThanksTokenMintsQuery = { __typename?: 'Query', mintThanksTokens: Array<{ __typename?: 'MintThanksToken', id: string, from: string, to: string, data: any, amount: any, workspaceId: string, blockTimestamp: any, blockNumber: any, thanksToken: { __typename?: 'ThanksToken', id: string, workspaceId: string } }> };

export type GetThanksTokenTransfersQueryVariables = Exact<{
  where?: InputMaybe<TransferThanksToken_Filter>;
  orderBy?: InputMaybe<TransferThanksToken_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  first?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetThanksTokenTransfersQuery = { __typename?: 'Query', transferThanksTokens: Array<{ __typename?: 'TransferThanksToken', id: string, from: string, to: string, amount: any, workspaceId: string, blockTimestamp: any, blockNumber: any, thanksToken: { __typename?: 'ThanksToken', id: string, workspaceId: string } }> };

export type GetThanksTokensQueryVariables = Exact<{
  where?: InputMaybe<ThanksToken_Filter>;
  first?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetThanksTokensQuery = { __typename?: 'Query', thanksTokens: Array<{ __typename?: 'ThanksToken', workspaceId: string }> };

export type GetWorkspaceQueryVariables = Exact<{
  workspaceId: Scalars['ID']['input'];
}>;


export type GetWorkspaceQuery = { __typename?: 'Query', workspace?: { __typename?: 'Workspace', id: string, minterHatId: any, operatorHatId: any, owner: string, splitCreator: string, topHatId: any, hatterHatId: any, hatsTimeFrameModule: string, hatsHatCreatorModule: string, hatsQuestModule: string, creator: string, creatorHatId: any, blockTimestamp: any, blockNumber: any, hatsFractionTokenModule: { __typename?: 'HatsFractionTokenModule', id: string }, thanksToken: { __typename?: 'ThanksToken', id: string } } | null };

export type GetWorkspacesQueryVariables = Exact<{
  where?: InputMaybe<Workspace_Filter>;
  first?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetWorkspacesQuery = { __typename?: 'Query', workspaces: Array<{ __typename?: 'Workspace', id: string, minterHatId: any, operatorHatId: any, owner: string, splitCreator: string, topHatId: any, hatterHatId: any, hatsTimeFrameModule: string, hatsHatCreatorModule: string, hatsQuestModule: string, creator: string, creatorHatId: any, blockTimestamp: any, blockNumber: any, hatsFractionTokenModule: { __typename?: 'HatsFractionTokenModule', id: string }, thanksToken: { __typename?: 'ThanksToken', id: string } }> };


export const GetTransferFractionTokensDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTransferFractionTokens"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"TransferFractionToken_filter"}},"defaultValue":{"kind":"ObjectValue","fields":[]}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"TransferFractionToken_orderBy"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"OrderDirection"}},"defaultValue":{"kind":"EnumValue","value":"asc"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"10"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"transferFractionTokens"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderDirection"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"from"}},{"kind":"Field","name":{"kind":"Name","value":"to"}},{"kind":"Field","name":{"kind":"Name","value":"tokenId"}},{"kind":"Field","name":{"kind":"Name","value":"workspaceId"}},{"kind":"Field","name":{"kind":"Name","value":"blockTimestamp"}},{"kind":"Field","name":{"kind":"Name","value":"blockNumber"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"hatsFractionTokenModule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<GetTransferFractionTokensQuery, GetTransferFractionTokensQueryVariables>;
export const BalanceOfFractionTokensDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"BalanceOfFractionTokens"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"BalanceOfFractionToken_filter"}},"defaultValue":{"kind":"ObjectValue","fields":[]}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"BalanceOfFractionToken_orderBy"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"OrderDirection"}},"defaultValue":{"kind":"EnumValue","value":"asc"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"100"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"balanceOfFractionTokens"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderDirection"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"tokenId"}},{"kind":"Field","name":{"kind":"Name","value":"balance"}},{"kind":"Field","name":{"kind":"Name","value":"owner"}},{"kind":"Field","name":{"kind":"Name","value":"workspaceId"}},{"kind":"Field","name":{"kind":"Name","value":"hatId"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"wearer"}}]}}]}}]} as unknown as DocumentNode<BalanceOfFractionTokensQuery, BalanceOfFractionTokensQueryVariables>;
export const GetQuestsForWorkspaceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetQuestsForWorkspace"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"10"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"statuses"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"QuestStatus"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"quests"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"workspace"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"status_in"},"value":{"kind":"Variable","name":{"kind":"Name","value":"statuses"}}}]}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"EnumValue","value":"createdAt"}},{"kind":"Argument","name":{"kind":"Name","value":"orderDirection"},"value":{"kind":"EnumValue","value":"desc"}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"questId"}},{"kind":"Field","name":{"kind":"Name","value":"hatId"}},{"kind":"Field","name":{"kind":"Name","value":"wearer"}},{"kind":"Field","name":{"kind":"Name","value":"creator"}},{"kind":"Field","name":{"kind":"Name","value":"submitter"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"metadataHash"}},{"kind":"Field","name":{"kind":"Name","value":"approvalCount"}},{"kind":"Field","name":{"kind":"Name","value":"attemptCount"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"blockTimestamp"}}]}}]}}]} as unknown as DocumentNode<GetQuestsForWorkspaceQuery, GetQuestsForWorkspaceQueryVariables>;
export const GetQuestDetailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetQuestDetail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"quest"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"questId"}},{"kind":"Field","name":{"kind":"Name","value":"hatId"}},{"kind":"Field","name":{"kind":"Name","value":"wearer"}},{"kind":"Field","name":{"kind":"Name","value":"creator"}},{"kind":"Field","name":{"kind":"Name","value":"submitter"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"metadataHash"}},{"kind":"Field","name":{"kind":"Name","value":"approvalCount"}},{"kind":"Field","name":{"kind":"Name","value":"attemptCount"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"submittedAt"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}},{"kind":"Field","name":{"kind":"Name","value":"cancelledAt"}},{"kind":"Field","name":{"kind":"Name","value":"questModule"}},{"kind":"Field","name":{"kind":"Name","value":"attempts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"EnumValue","value":"attemptIndex"}},{"kind":"Argument","name":{"kind":"Name","value":"orderDirection"},"value":{"kind":"EnumValue","value":"desc"}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"attemptIndex"}},{"kind":"Field","name":{"kind":"Name","value":"submitter"}},{"kind":"Field","name":{"kind":"Name","value":"submittedAt"}},{"kind":"Field","name":{"kind":"Name","value":"outcome"}},{"kind":"Field","name":{"kind":"Name","value":"approvals"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"EnumValue","value":"approvedAt"}},{"kind":"Argument","name":{"kind":"Name","value":"orderDirection"},"value":{"kind":"EnumValue","value":"asc"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"approver"}},{"kind":"Field","name":{"kind":"Name","value":"approvedAt"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetQuestDetailQuery, GetQuestDetailQueryVariables>;
export const GetThanksTokenBalancesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetThanksTokenBalances"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"BalanceOfThanksToken_filter"}},"defaultValue":{"kind":"ObjectValue","fields":[]}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"BalanceOfThanksToken_orderBy"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"OrderDirection"}},"defaultValue":{"kind":"EnumValue","value":"asc"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"100"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"balanceOfThanksTokens"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderDirection"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"thanksToken"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"workspaceId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"owner"}},{"kind":"Field","name":{"kind":"Name","value":"balance"}},{"kind":"Field","name":{"kind":"Name","value":"workspaceId"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<GetThanksTokenBalancesQuery, GetThanksTokenBalancesQueryVariables>;
export const GetThanksTokenMintsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetThanksTokenMints"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"MintThanksToken_filter"}},"defaultValue":{"kind":"ObjectValue","fields":[]}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"MintThanksToken_orderBy"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"OrderDirection"}},"defaultValue":{"kind":"EnumValue","value":"asc"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"10"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mintThanksTokens"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderDirection"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"thanksToken"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"workspaceId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"from"}},{"kind":"Field","name":{"kind":"Name","value":"to"}},{"kind":"Field","name":{"kind":"Name","value":"data"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"workspaceId"}},{"kind":"Field","name":{"kind":"Name","value":"blockTimestamp"}},{"kind":"Field","name":{"kind":"Name","value":"blockNumber"}}]}}]}}]} as unknown as DocumentNode<GetThanksTokenMintsQuery, GetThanksTokenMintsQueryVariables>;
export const GetThanksTokenTransfersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetThanksTokenTransfers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"TransferThanksToken_filter"}},"defaultValue":{"kind":"ObjectValue","fields":[]}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"TransferThanksToken_orderBy"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"OrderDirection"}},"defaultValue":{"kind":"EnumValue","value":"asc"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"10"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"transferThanksTokens"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderDirection"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"thanksToken"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"workspaceId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"from"}},{"kind":"Field","name":{"kind":"Name","value":"to"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"workspaceId"}},{"kind":"Field","name":{"kind":"Name","value":"blockTimestamp"}},{"kind":"Field","name":{"kind":"Name","value":"blockNumber"}}]}}]}}]} as unknown as DocumentNode<GetThanksTokenTransfersQuery, GetThanksTokenTransfersQueryVariables>;
export const GetThanksTokensDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetThanksTokens"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ThanksToken_filter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"100"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"thanksTokens"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspaceId"}}]}}]}}]} as unknown as DocumentNode<GetThanksTokensQuery, GetThanksTokensQueryVariables>;
export const GetWorkspaceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetWorkspace"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"minterHatId"}},{"kind":"Field","name":{"kind":"Name","value":"operatorHatId"}},{"kind":"Field","name":{"kind":"Name","value":"owner"}},{"kind":"Field","name":{"kind":"Name","value":"splitCreator"}},{"kind":"Field","name":{"kind":"Name","value":"topHatId"}},{"kind":"Field","name":{"kind":"Name","value":"hatterHatId"}},{"kind":"Field","name":{"kind":"Name","value":"hatsTimeFrameModule"}},{"kind":"Field","name":{"kind":"Name","value":"hatsHatCreatorModule"}},{"kind":"Field","name":{"kind":"Name","value":"hatsQuestModule"}},{"kind":"Field","name":{"kind":"Name","value":"creator"}},{"kind":"Field","name":{"kind":"Name","value":"creatorHatId"}},{"kind":"Field","name":{"kind":"Name","value":"blockTimestamp"}},{"kind":"Field","name":{"kind":"Name","value":"blockNumber"}},{"kind":"Field","name":{"kind":"Name","value":"hatsFractionTokenModule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"thanksToken"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<GetWorkspaceQuery, GetWorkspaceQueryVariables>;
export const GetWorkspacesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetWorkspaces"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Workspace_filter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"100"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspaces"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"minterHatId"}},{"kind":"Field","name":{"kind":"Name","value":"operatorHatId"}},{"kind":"Field","name":{"kind":"Name","value":"owner"}},{"kind":"Field","name":{"kind":"Name","value":"splitCreator"}},{"kind":"Field","name":{"kind":"Name","value":"topHatId"}},{"kind":"Field","name":{"kind":"Name","value":"hatterHatId"}},{"kind":"Field","name":{"kind":"Name","value":"hatsTimeFrameModule"}},{"kind":"Field","name":{"kind":"Name","value":"hatsHatCreatorModule"}},{"kind":"Field","name":{"kind":"Name","value":"hatsQuestModule"}},{"kind":"Field","name":{"kind":"Name","value":"creator"}},{"kind":"Field","name":{"kind":"Name","value":"creatorHatId"}},{"kind":"Field","name":{"kind":"Name","value":"blockTimestamp"}},{"kind":"Field","name":{"kind":"Name","value":"blockNumber"}},{"kind":"Field","name":{"kind":"Name","value":"hatsFractionTokenModule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"thanksToken"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<GetWorkspacesQuery, GetWorkspacesQueryVariables>;