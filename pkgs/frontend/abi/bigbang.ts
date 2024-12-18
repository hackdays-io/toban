export const BIGBANG_ABI = [
  {
    inputs: [],
    name: "InvalidInitialization",
    type: "error",
  },
  {
    inputs: [],
    name: "NotInitializing",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "OwnableInvalidOwner",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "OwnableUnauthorizedAccount",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "creator",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "topHatId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "hatterHatId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "hatsTimeFrameModule",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "splitCreator",
        type: "address",
      },
    ],
    name: "Executed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint64",
        name: "version",
        type: "uint64",
      },
    ],
    name: "Initialized",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    inputs: [],
    name: "FractionToken",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "Hats",
    outputs: [
      {
        internalType: "contract IHats",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "HatsModuleFactory",
    outputs: [
      {
        internalType: "contract IHatsModuleFactory",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "HatsTimeFrameModule_IMPL",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "SplitsCreatorFactory",
    outputs: [
      {
        internalType: "contract ISplitsCreatorFactory",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "SplitsFactoryV2",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_owner",
        type: "address",
      },
      {
        internalType: "string",
        name: "_topHatDetails",
        type: "string",
      },
      {
        internalType: "string",
        name: "_topHatImageURI",
        type: "string",
      },
      {
        internalType: "string",
        name: "_hatterHatDetails",
        type: "string",
      },
      {
        internalType: "string",
        name: "_hatterHatImageURI",
        type: "string",
      },
    ],
    name: "bigbang",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_hatsAddress",
        type: "address",
      },
      {
        internalType: "address",
        name: "_hatsModuleFactory",
        type: "address",
      },
      {
        internalType: "address",
        name: "_hatsTimeFrameModule_IMPL",
        type: "address",
      },
      {
        internalType: "address",
        name: "_splitsCreatorFactory",
        type: "address",
      },
      {
        internalType: "address",
        name: "_splitFactoryV2",
        type: "address",
      },
      {
        internalType: "address",
        name: "_fractionToken",
        type: "address",
      },
    ],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_fractionToken",
        type: "address",
      },
    ],
    name: "setFractionToken",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_hats",
        type: "address",
      },
    ],
    name: "setHats",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_hatsModuleFactory",
        type: "address",
      },
    ],
    name: "setHatsModuleFactory",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_hatsTimeFrameModuleImpl",
        type: "address",
      },
    ],
    name: "setHatsTimeFrameModuleImpl",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_splitsCreatorFactory",
        type: "address",
      },
    ],
    name: "setSplitsCreatorFactory",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_splitsFactoryV2",
        type: "address",
      },
    ],
    name: "setSplitsFactoryV2",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
