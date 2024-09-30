import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { Hex } from "viem";
import { privateKeyToAccount, privateKeyToAddress } from "viem/accounts";
const profilesPath = path.join(__dirname, "profiles.json");

export interface Profile {
	name: string;
	privateKey: Hex;
}

export const getProfiles = () => {
	if (!existsSync(profilesPath)) {
		writeFileSync(profilesPath, JSON.stringify([]));
	}
	const data = readFileSync(profilesPath, "utf8");
	return JSON.parse(data) as Profile[];
};

export const getWallet = (name?: string) => {
	const profiles = getProfiles();
	const profile = profiles.find((p) => p.name === name) || profiles[0];

	if (!profile) throw "Profile not found.";

	return privateKeyToAccount(profile.privateKey);
};

export const saveProfile = (params: Profile) => {
	if (!params.privateKey.match(/^0x[0-9a-f]{64}$/)) {
		console.log("Invalid private key.");
		return;
	}

	const profiles: Profile[] = getProfiles();
	if (
		profiles.find(
			(p) => p.privateKey.toLowerCase() === params.privateKey.toLowerCase()
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

export const listProfiles = () => {
	const profiles = getProfiles();
	for (const profile of profiles) {
		console.log(`${profile.name}: ${privateKeyToAddress(profile.privateKey)}`);
	}
};
