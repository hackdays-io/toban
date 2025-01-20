export const BIGBANG_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_trustedForwarder",
        type: "address",
      },
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
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
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
      {
        internalType: "address",
        name: "_trustedForwarder",
        type: "address",
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
    inputs: [],
    name: "fractionToken",
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
        name: "forwarder",
        type: "address",
      },
    ],
    name: "isTrustedForwarder",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "splitFactoryV2",
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
    name: "trustedForwarder",
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
] as const;
