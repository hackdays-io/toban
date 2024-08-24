export const SplitCreatorABI = [
  {
    inputs: [
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
      {
        internalType: "address",
        name: "_trustedForwarder",
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
        indexed: false,
        internalType: "address",
        name: "split",
        type: "address",
      },
    ],
    name: "SplitCreated",
    type: "event",
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
        internalType: "struct SplitCreator.SplitInfo[]",
        name: "_splitInfos",
        type: "tuple[]",
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
] as const;
