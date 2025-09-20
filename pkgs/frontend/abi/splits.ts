export const SPLITS_CREATOR_ABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "split",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address[]",
        name: "shareHolders",
        type: "address[]",
      },
      {
        indexed: false,
        internalType: "uint256[]",
        name: "allocations",
        type: "uint256[]",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "totalAllocation",
        type: "uint256",
      },
    ],
    name: "SplitsCreated",
    type: "event",
  },
  {
    inputs: [],
    name: "FRACTION_TOKEN",
    outputs: [
      {
        internalType: "contract IHatsFractionTokenModule",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "HATS",
    outputs: [
      {
        internalType: "contract IHats",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "HATS_TIME_FRAME_MODULE",
    outputs: [
      {
        internalType: "contract IHatsTimeFrameModule",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "SPLIT_FACTORY_V2",
    outputs: [
      {
        internalType: "contract ISplitFactoryV2",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "THANKS_TOKEN",
    outputs: [
      {
        internalType: "contract IThanksToken",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "hatId",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "multiplierBottom",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "multiplierTop",
            type: "uint256",
          },
          {
            internalType: "address[]",
            name: "wearers",
            type: "address[]",
          },
        ],
        internalType: "struct ISplitsCreator.SplitsInfo[]",
        name: "_splitsInfo",
        type: "tuple[]",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "roleWeight",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "thanksTokenWeight",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "thanksTokenReceivedWeight",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "thanksTokenSentWeight",
            type: "uint256",
          },
        ],
        internalType: "struct ISplitsCreator.WeightsInfo",
        name: "_weightsInfo",
        type: "tuple",
      },
    ],
    name: "create",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "hatId",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "multiplierBottom",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "multiplierTop",
            type: "uint256",
          },
          {
            internalType: "address[]",
            name: "wearers",
            type: "address[]",
          },
        ],
        internalType: "struct ISplitsCreator.SplitsInfo[]",
        name: "_splitsInfo",
        type: "tuple[]",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "roleWeight",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "thanksTokenWeight",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "thanksTokenReceivedWeight",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "thanksTokenSentWeight",
            type: "uint256",
          },
        ],
        internalType: "struct ISplitsCreator.WeightsInfo",
        name: "_weightsInfo",
        type: "tuple",
      },
    ],
    name: "preview",
    outputs: [
      {
        internalType: "address[]",
        name: "shareHolders",
        type: "address[]",
      },
      {
        internalType: "uint256[]",
        name: "allocations",
        type: "uint256[]",
      },
      {
        internalType: "uint256",
        name: "totalAllocation",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;
