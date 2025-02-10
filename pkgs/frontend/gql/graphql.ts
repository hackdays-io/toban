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

export type BalanceOfFractionToken = {
  __typename?: 'BalanceOfFractionToken';
  balance: Scalars['BigInt']['output'];
  hatId?: Maybe<Scalars['BigInt']['output']>;
  id: Scalars['ID']['output'];
  owner: Scalars['String']['output'];
  tokenId: Scalars['BigInt']['output'];
  updatedAt: Scalars['BigInt']['output'];
  wearer?: Maybe<Scalars['String']['output']>;
  workspaceId?: Maybe<Scalars['ID']['output']>;
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
  Id = 'id',
  Owner = 'owner',
  TokenId = 'tokenId',
  UpdatedAt = 'updatedAt',
  Wearer = 'wearer',
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

export type HatsHatCreatorModule = {
  __typename?: 'HatsHatCreatorModule';
  authorities: Array<HatsHatCreatorModuleAuthority>;
  id: Scalars['ID']['output'];
  workspaceId: Scalars['ID']['output'];
};


export type HatsHatCreatorModuleAuthoritiesArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<HatsHatCreatorModuleAuthority_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<HatsHatCreatorModuleAuthority_Filter>;
};

export type HatsHatCreatorModuleAuthority = {
  __typename?: 'HatsHatCreatorModuleAuthority';
  address: Scalars['String']['output'];
  authorised: Scalars['Boolean']['output'];
  blockNumber: Scalars['BigInt']['output'];
  blockTimestamp: Scalars['BigInt']['output'];
  hatsHatCreatorModule: HatsHatCreatorModule;
  id: Scalars['ID']['output'];
  workspaceId: Scalars['ID']['output'];
};

export type HatsHatCreatorModuleAuthority_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  address?: InputMaybe<Scalars['String']['input']>;
  address_contains?: InputMaybe<Scalars['String']['input']>;
  address_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  address_ends_with?: InputMaybe<Scalars['String']['input']>;
  address_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  address_gt?: InputMaybe<Scalars['String']['input']>;
  address_gte?: InputMaybe<Scalars['String']['input']>;
  address_in?: InputMaybe<Array<Scalars['String']['input']>>;
  address_lt?: InputMaybe<Scalars['String']['input']>;
  address_lte?: InputMaybe<Scalars['String']['input']>;
  address_not?: InputMaybe<Scalars['String']['input']>;
  address_not_contains?: InputMaybe<Scalars['String']['input']>;
  address_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  address_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  address_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  address_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  address_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  address_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  address_starts_with?: InputMaybe<Scalars['String']['input']>;
  address_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  and?: InputMaybe<Array<InputMaybe<HatsHatCreatorModuleAuthority_Filter>>>;
  authorised?: InputMaybe<Scalars['Boolean']['input']>;
  authorised_in?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  authorised_not?: InputMaybe<Scalars['Boolean']['input']>;
  authorised_not_in?: InputMaybe<Array<Scalars['Boolean']['input']>>;
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
  hatsHatCreatorModule?: InputMaybe<Scalars['String']['input']>;
  hatsHatCreatorModule_?: InputMaybe<HatsHatCreatorModule_Filter>;
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
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  or?: InputMaybe<Array<InputMaybe<HatsHatCreatorModuleAuthority_Filter>>>;
  workspaceId?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_gt?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_gte?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  workspaceId_lt?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_lte?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_not?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
};

export enum HatsHatCreatorModuleAuthority_OrderBy {
  Address = 'address',
  Authorised = 'authorised',
  BlockNumber = 'blockNumber',
  BlockTimestamp = 'blockTimestamp',
  HatsHatCreatorModule = 'hatsHatCreatorModule',
  HatsHatCreatorModuleId = 'hatsHatCreatorModule__id',
  HatsHatCreatorModuleWorkspaceId = 'hatsHatCreatorModule__workspaceId',
  Id = 'id',
  WorkspaceId = 'workspaceId'
}

export type HatsHatCreatorModule_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<HatsHatCreatorModule_Filter>>>;
  authorities_?: InputMaybe<HatsHatCreatorModuleAuthority_Filter>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  or?: InputMaybe<Array<InputMaybe<HatsHatCreatorModule_Filter>>>;
  workspaceId?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_gt?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_gte?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  workspaceId_lt?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_lte?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_not?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
};

export enum HatsHatCreatorModule_OrderBy {
  Authorities = 'authorities',
  Id = 'id',
  WorkspaceId = 'workspaceId'
}

export type HatsTimeFrameModule = {
  __typename?: 'HatsTimeFrameModule';
  authorities: Array<HatsTimeFrameModuleAuthority>;
  id: Scalars['ID']['output'];
  workspaceId: Scalars['ID']['output'];
};


export type HatsTimeFrameModuleAuthoritiesArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<HatsTimeFrameModuleAuthority_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<HatsTimeFrameModuleAuthority_Filter>;
};

export type HatsTimeFrameModuleAuthority = {
  __typename?: 'HatsTimeFrameModuleAuthority';
  address: Scalars['String']['output'];
  authorised: Scalars['Boolean']['output'];
  blockNumber: Scalars['BigInt']['output'];
  blockTimestamp: Scalars['BigInt']['output'];
  hatsTimeFrameModule: HatsTimeFrameModule;
  id: Scalars['ID']['output'];
  workspaceId: Scalars['ID']['output'];
};

export type HatsTimeFrameModuleAuthority_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  address?: InputMaybe<Scalars['String']['input']>;
  address_contains?: InputMaybe<Scalars['String']['input']>;
  address_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  address_ends_with?: InputMaybe<Scalars['String']['input']>;
  address_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  address_gt?: InputMaybe<Scalars['String']['input']>;
  address_gte?: InputMaybe<Scalars['String']['input']>;
  address_in?: InputMaybe<Array<Scalars['String']['input']>>;
  address_lt?: InputMaybe<Scalars['String']['input']>;
  address_lte?: InputMaybe<Scalars['String']['input']>;
  address_not?: InputMaybe<Scalars['String']['input']>;
  address_not_contains?: InputMaybe<Scalars['String']['input']>;
  address_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  address_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  address_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  address_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  address_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  address_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  address_starts_with?: InputMaybe<Scalars['String']['input']>;
  address_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  and?: InputMaybe<Array<InputMaybe<HatsTimeFrameModuleAuthority_Filter>>>;
  authorised?: InputMaybe<Scalars['Boolean']['input']>;
  authorised_in?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  authorised_not?: InputMaybe<Scalars['Boolean']['input']>;
  authorised_not_in?: InputMaybe<Array<Scalars['Boolean']['input']>>;
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
  hatsTimeFrameModule?: InputMaybe<Scalars['String']['input']>;
  hatsTimeFrameModule_?: InputMaybe<HatsTimeFrameModule_Filter>;
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
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  or?: InputMaybe<Array<InputMaybe<HatsTimeFrameModuleAuthority_Filter>>>;
  workspaceId?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_gt?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_gte?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  workspaceId_lt?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_lte?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_not?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
};

export enum HatsTimeFrameModuleAuthority_OrderBy {
  Address = 'address',
  Authorised = 'authorised',
  BlockNumber = 'blockNumber',
  BlockTimestamp = 'blockTimestamp',
  HatsTimeFrameModule = 'hatsTimeFrameModule',
  HatsTimeFrameModuleId = 'hatsTimeFrameModule__id',
  HatsTimeFrameModuleWorkspaceId = 'hatsTimeFrameModule__workspaceId',
  Id = 'id',
  WorkspaceId = 'workspaceId'
}

export type HatsTimeFrameModule_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<HatsTimeFrameModule_Filter>>>;
  authorities_?: InputMaybe<HatsTimeFrameModuleAuthority_Filter>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  or?: InputMaybe<Array<InputMaybe<HatsTimeFrameModule_Filter>>>;
  workspaceId?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_gt?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_gte?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  workspaceId_lt?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_lte?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_not?: InputMaybe<Scalars['ID']['input']>;
  workspaceId_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
};

export enum HatsTimeFrameModule_OrderBy {
  Authorities = 'authorities',
  Id = 'id',
  WorkspaceId = 'workspaceId'
}

export type InitializedFractionToken = {
  __typename?: 'InitializedFractionToken';
  blockNumber: Scalars['BigInt']['output'];
  blockTimestamp: Scalars['BigInt']['output'];
  hatId: Scalars['BigInt']['output'];
  id: Scalars['ID']['output'];
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
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  or?: InputMaybe<Array<InputMaybe<InitializedFractionToken_Filter>>>;
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
  Id = 'id',
  Wearer = 'wearer',
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
  balanceOfFractionToken?: Maybe<BalanceOfFractionToken>;
  balanceOfFractionTokens: Array<BalanceOfFractionToken>;
  hatsHatCreatorModule?: Maybe<HatsHatCreatorModule>;
  hatsHatCreatorModuleAuthorities: Array<HatsHatCreatorModuleAuthority>;
  hatsHatCreatorModuleAuthority?: Maybe<HatsHatCreatorModuleAuthority>;
  hatsHatCreatorModules: Array<HatsHatCreatorModule>;
  hatsTimeFrameModule?: Maybe<HatsTimeFrameModule>;
  hatsTimeFrameModuleAuthorities: Array<HatsTimeFrameModuleAuthority>;
  hatsTimeFrameModuleAuthority?: Maybe<HatsTimeFrameModuleAuthority>;
  hatsTimeFrameModules: Array<HatsTimeFrameModule>;
  initializedFractionToken?: Maybe<InitializedFractionToken>;
  initializedFractionTokens: Array<InitializedFractionToken>;
  transferFractionToken?: Maybe<TransferFractionToken>;
  transferFractionTokens: Array<TransferFractionToken>;
  workspace?: Maybe<Workspace>;
  workspaces: Array<Workspace>;
};


export type Query_MetaArgs = {
  block?: InputMaybe<Block_Height>;
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


export type QueryHatsHatCreatorModuleArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryHatsHatCreatorModuleAuthoritiesArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<HatsHatCreatorModuleAuthority_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<HatsHatCreatorModuleAuthority_Filter>;
};


export type QueryHatsHatCreatorModuleAuthorityArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryHatsHatCreatorModulesArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<HatsHatCreatorModule_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<HatsHatCreatorModule_Filter>;
};


export type QueryHatsTimeFrameModuleArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryHatsTimeFrameModuleAuthoritiesArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<HatsTimeFrameModuleAuthority_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<HatsTimeFrameModuleAuthority_Filter>;
};


export type QueryHatsTimeFrameModuleAuthorityArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryHatsTimeFrameModulesArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<HatsTimeFrameModule_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<HatsTimeFrameModule_Filter>;
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
  balanceOfFractionToken?: Maybe<BalanceOfFractionToken>;
  balanceOfFractionTokens: Array<BalanceOfFractionToken>;
  hatsHatCreatorModule?: Maybe<HatsHatCreatorModule>;
  hatsHatCreatorModuleAuthorities: Array<HatsHatCreatorModuleAuthority>;
  hatsHatCreatorModuleAuthority?: Maybe<HatsHatCreatorModuleAuthority>;
  hatsHatCreatorModules: Array<HatsHatCreatorModule>;
  hatsTimeFrameModule?: Maybe<HatsTimeFrameModule>;
  hatsTimeFrameModuleAuthorities: Array<HatsTimeFrameModuleAuthority>;
  hatsTimeFrameModuleAuthority?: Maybe<HatsTimeFrameModuleAuthority>;
  hatsTimeFrameModules: Array<HatsTimeFrameModule>;
  initializedFractionToken?: Maybe<InitializedFractionToken>;
  initializedFractionTokens: Array<InitializedFractionToken>;
  transferFractionToken?: Maybe<TransferFractionToken>;
  transferFractionTokens: Array<TransferFractionToken>;
  workspace?: Maybe<Workspace>;
  workspaces: Array<Workspace>;
};


export type Subscription_MetaArgs = {
  block?: InputMaybe<Block_Height>;
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


export type SubscriptionHatsHatCreatorModuleArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionHatsHatCreatorModuleAuthoritiesArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<HatsHatCreatorModuleAuthority_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<HatsHatCreatorModuleAuthority_Filter>;
};


export type SubscriptionHatsHatCreatorModuleAuthorityArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionHatsHatCreatorModulesArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<HatsHatCreatorModule_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<HatsHatCreatorModule_Filter>;
};


export type SubscriptionHatsTimeFrameModuleArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionHatsTimeFrameModuleAuthoritiesArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<HatsTimeFrameModuleAuthority_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<HatsTimeFrameModuleAuthority_Filter>;
};


export type SubscriptionHatsTimeFrameModuleAuthorityArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionHatsTimeFrameModulesArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<HatsTimeFrameModule_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<HatsTimeFrameModule_Filter>;
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

export type TransferFractionToken = {
  __typename?: 'TransferFractionToken';
  amount: Scalars['BigInt']['output'];
  blockNumber: Scalars['BigInt']['output'];
  blockTimestamp: Scalars['BigInt']['output'];
  from: Scalars['String']['output'];
  hatId?: Maybe<Scalars['BigInt']['output']>;
  id: Scalars['ID']['output'];
  to: Scalars['String']['output'];
  tokenId: Scalars['BigInt']['output'];
  wearer?: Maybe<Scalars['String']['output']>;
  workspaceId?: Maybe<Scalars['ID']['output']>;
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

export enum TransferFractionToken_OrderBy {
  Amount = 'amount',
  BlockNumber = 'blockNumber',
  BlockTimestamp = 'blockTimestamp',
  From = 'from',
  HatId = 'hatId',
  Id = 'id',
  To = 'to',
  TokenId = 'tokenId',
  Wearer = 'wearer',
  WorkspaceId = 'workspaceId'
}

export type Workspace = {
  __typename?: 'Workspace';
  blockNumber: Scalars['BigInt']['output'];
  blockTimestamp: Scalars['BigInt']['output'];
  creator: Scalars['String']['output'];
  hatsHatCreatorModule?: Maybe<HatsHatCreatorModule>;
  hatsTimeFrameModule?: Maybe<HatsTimeFrameModule>;
  hatterHatId: Scalars['BigInt']['output'];
  id: Scalars['ID']['output'];
  splitCreator: Scalars['String']['output'];
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
  hatsHatCreatorModule?: InputMaybe<Scalars['String']['input']>;
  hatsHatCreatorModule_?: InputMaybe<HatsHatCreatorModule_Filter>;
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
  hatsTimeFrameModule_?: InputMaybe<HatsTimeFrameModule_Filter>;
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
  or?: InputMaybe<Array<InputMaybe<Workspace_Filter>>>;
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
  HatsHatCreatorModule = 'hatsHatCreatorModule',
  HatsHatCreatorModuleId = 'hatsHatCreatorModule__id',
  HatsHatCreatorModuleWorkspaceId = 'hatsHatCreatorModule__workspaceId',
  HatsTimeFrameModule = 'hatsTimeFrameModule',
  HatsTimeFrameModuleId = 'hatsTimeFrameModule__id',
  HatsTimeFrameModuleWorkspaceId = 'hatsTimeFrameModule__workspaceId',
  HatterHatId = 'hatterHatId',
  Id = 'id',
  SplitCreator = 'splitCreator',
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


export type GetTransferFractionTokensQuery = { __typename?: 'Query', transferFractionTokens: Array<{ __typename?: 'TransferFractionToken', amount: any, from: string, to: string, tokenId: any, blockNumber: any, blockTimestamp: any, hatId?: any | null, id: string, wearer?: string | null, workspaceId?: string | null }> };

export type BalanceOfFractionTokensQueryVariables = Exact<{
  where?: InputMaybe<BalanceOfFractionToken_Filter>;
  orderBy?: InputMaybe<BalanceOfFractionToken_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  first?: InputMaybe<Scalars['Int']['input']>;
}>;


export type BalanceOfFractionTokensQuery = { __typename?: 'Query', balanceOfFractionTokens: Array<{ __typename?: 'BalanceOfFractionToken', tokenId: any, balance: any, owner: string, workspaceId?: string | null, hatId?: any | null, id: string, updatedAt: any, wearer?: string | null }> };

export type GetWorkspacesQueryVariables = Exact<{
  where?: InputMaybe<Workspace_Filter>;
}>;


export type GetWorkspacesQuery = { __typename?: 'Query', workspaces: Array<{ __typename?: 'Workspace', creator: string, topHatId: any, splitCreator: string, id: string, hatterHatId: any, blockTimestamp: any, blockNumber: any, hatsTimeFrameModule?: { __typename?: 'HatsTimeFrameModule', id: string } | null, hatsHatCreatorModule?: { __typename?: 'HatsHatCreatorModule', id: string } | null }> };

export type GetWorkspaceQueryVariables = Exact<{
  workspaceId: Scalars['ID']['input'];
  hatsHatCreatorModuleAuthority_filter?: InputMaybe<HatsHatCreatorModuleAuthority_Filter>;
  hatsTimeFrameModuleAuthority_filter?: InputMaybe<HatsTimeFrameModuleAuthority_Filter>;
}>;


export type GetWorkspaceQuery = { __typename?: 'Query', workspace?: { __typename?: 'Workspace', blockNumber: any, blockTimestamp: any, creator: string, hatterHatId: any, id: string, splitCreator: string, topHatId: any, hatsHatCreatorModule?: { __typename?: 'HatsHatCreatorModule', id: string, authorities: Array<{ __typename?: 'HatsHatCreatorModuleAuthority', address: string, authorised: boolean, blockNumber: any, blockTimestamp: any, id: string, workspaceId: string }> } | null, hatsTimeFrameModule?: { __typename?: 'HatsTimeFrameModule', id: string, authorities: Array<{ __typename?: 'HatsTimeFrameModuleAuthority', address: string, authorised: boolean, blockNumber: any, blockTimestamp: any, id: string, workspaceId: string }> } | null } | null };


export const GetTransferFractionTokensDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTransferFractionTokens"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"TransferFractionToken_filter"}},"defaultValue":{"kind":"ObjectValue","fields":[]}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"TransferFractionToken_orderBy"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"OrderDirection"}},"defaultValue":{"kind":"EnumValue","value":"asc"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"10"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"transferFractionTokens"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderDirection"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"from"}},{"kind":"Field","name":{"kind":"Name","value":"to"}},{"kind":"Field","name":{"kind":"Name","value":"tokenId"}},{"kind":"Field","name":{"kind":"Name","value":"blockNumber"}},{"kind":"Field","name":{"kind":"Name","value":"blockTimestamp"}},{"kind":"Field","name":{"kind":"Name","value":"hatId"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"wearer"}},{"kind":"Field","name":{"kind":"Name","value":"workspaceId"}}]}}]}}]} as unknown as DocumentNode<GetTransferFractionTokensQuery, GetTransferFractionTokensQueryVariables>;
export const BalanceOfFractionTokensDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"BalanceOfFractionTokens"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"BalanceOfFractionToken_filter"}},"defaultValue":{"kind":"ObjectValue","fields":[]}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"BalanceOfFractionToken_orderBy"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"OrderDirection"}},"defaultValue":{"kind":"EnumValue","value":"asc"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"100"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"balanceOfFractionTokens"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderDirection"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"tokenId"}},{"kind":"Field","name":{"kind":"Name","value":"balance"}},{"kind":"Field","name":{"kind":"Name","value":"owner"}},{"kind":"Field","name":{"kind":"Name","value":"workspaceId"}},{"kind":"Field","name":{"kind":"Name","value":"hatId"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"wearer"}}]}}]}}]} as unknown as DocumentNode<BalanceOfFractionTokensQuery, BalanceOfFractionTokensQueryVariables>;
export const GetWorkspacesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetWorkspaces"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Workspace_filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspaces"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"creator"}},{"kind":"Field","name":{"kind":"Name","value":"topHatId"}},{"kind":"Field","name":{"kind":"Name","value":"splitCreator"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"hatterHatId"}},{"kind":"Field","name":{"kind":"Name","value":"hatsTimeFrameModule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"hatsHatCreatorModule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"blockTimestamp"}},{"kind":"Field","name":{"kind":"Name","value":"blockNumber"}}]}}]}}]} as unknown as DocumentNode<GetWorkspacesQuery, GetWorkspacesQueryVariables>;
export const GetWorkspaceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetWorkspace"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"hatsHatCreatorModuleAuthority_filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"HatsHatCreatorModuleAuthority_filter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"hatsTimeFrameModuleAuthority_filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"HatsTimeFrameModuleAuthority_filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"blockNumber"}},{"kind":"Field","name":{"kind":"Name","value":"blockTimestamp"}},{"kind":"Field","name":{"kind":"Name","value":"creator"}},{"kind":"Field","name":{"kind":"Name","value":"hatterHatId"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"splitCreator"}},{"kind":"Field","name":{"kind":"Name","value":"topHatId"}},{"kind":"Field","name":{"kind":"Name","value":"hatsHatCreatorModule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"authorities"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"hatsHatCreatorModuleAuthority_filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"authorised"}},{"kind":"Field","name":{"kind":"Name","value":"blockNumber"}},{"kind":"Field","name":{"kind":"Name","value":"blockTimestamp"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"workspaceId"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"hatsTimeFrameModule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"authorities"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"hatsTimeFrameModuleAuthority_filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"authorised"}},{"kind":"Field","name":{"kind":"Name","value":"blockNumber"}},{"kind":"Field","name":{"kind":"Name","value":"blockTimestamp"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"workspaceId"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetWorkspaceQuery, GetWorkspaceQueryVariables>;