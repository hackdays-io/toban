import { viem } from "hardhat";

export type Hats = Awaited<ReturnType<typeof deployHatsProtocol>>["Hats"];

export const deployHatsProtocol = async () => {
	const Hats = await viem.deployContract("Hats", ["test", "https://test.com"]);

	return { Hats };
};
