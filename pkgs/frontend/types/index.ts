export interface IHatWearer {
  id: `0x${string}`;
  ensName?: string | null;
}

export interface Authority {
  label: string;
  link: string;
  gate: string;
  description: string;
}

export interface Responsibility {
  label: string;
  description: string;
  link: string;
}

export interface EligibilityToggle {
  manual: boolean;
  criteria: any[];
}

export interface IpfsDetails {
  name: string;
  description: string;
  guilds: any[]; // @TODO: type this
  spaces: any[]; // @TODO: type this
  responsibilities: Responsibility[];
  authorities: Authority[];
  eligibility: EligibilityToggle;
  toggle: EligibilityToggle;
}

export const ForwardRequest = [
  {name: "from", type: "address"},
  {name: "to", type: "address"},
  {name: "value", type: "uint256"},
  {name: "gas", type: "uint256"},
  {name: "nonce", type: "uint256"},
  //{name: "deadline", type: "uint48"},
  {name: "data", type: "bytes"},
];