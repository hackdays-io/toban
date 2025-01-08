import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import type { Hex } from "viem";
import { privateKeyToAccount, privateKeyToAddress } from "viem/accounts";
import { setWallet } from "../modules/viem";

export interface Profile {
  name: string;
  privateKey: Hex;
}

const profilesPath = path.join(__dirname, "profiles.json");

export const getProfiles = () => {
  if (!existsSync(profilesPath)) {
    writeFileSync(profilesPath, JSON.stringify([]));
  }
  const data = readFileSync(profilesPath, "utf8");
  return JSON.parse(data) as Profile[];
};

export const getAccount = (name?: string) => {
  const profiles = getProfiles();
  const profile = profiles.find((p) => p.name === name) || profiles[0];

  if (!profile)
    throw "Profile not found. Please add a profile with wallet add command.";

  return privateKeyToAccount(profile.privateKey);
};

export const getWalletClient = (
  name?: string,
  chainId?: number | undefined,
) => {
  const account = getAccount(name);

  return setWallet(account, chainId);
};

export const saveProfile = (params: Profile) => {
  if (!params.privateKey.match(/^0x[0-9a-f]{64}$/)) {
    console.log("Invalid private key.");
    return;
  }

  const profiles: Profile[] = getProfiles();
  if (
    profiles.find(
      (p) => p.privateKey.toLowerCase() === params.privateKey.toLowerCase(),
    ) ||
    profiles.find((p) => p.name === params.name)
  ) {
    console.log("Already exists.");
    return;
  }

  profiles.push(params);

  writeFileSync(profilesPath, JSON.stringify(profiles, null, 2));
  console.log(`Profile ${params.name} with private key has been saved.`);
};

export const deleteProfile = (params: { name: string }) => {
  const profiles = getProfiles();
  const index = profiles.findIndex((p) => p.name === params.name);

  if (index === -1) throw "Profile not found.";

  profiles.splice(index, 1);

  writeFileSync(profilesPath, JSON.stringify(profiles, null, 2));
  console.log(`Profile "${params.name}" with private key has been deleted.`);
};

export const listProfiles = () => {
  const profiles = getProfiles();
  for (const profile of profiles) {
    console.log(`${profile.name}: ${privateKeyToAddress(profile.privateKey)}`);
  }
};
