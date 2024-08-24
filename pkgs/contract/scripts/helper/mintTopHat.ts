import {ethers} from "hardhat";

const main = async () => {
  // Hats contract address
  const hatsAddress = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
  // Admin of Top Hat
  const adminAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

  const Hats = await ethers.getContractAt("Hats", hatsAddress);

  const txData = Hats.interface.encodeFunctionData("mintTopHat", [
    adminAddress,
    "Description",
    "https://zettshop.net/img/item/Z/Z-BH121-2900.jpg",
  ]);

  const [signer] = await ethers.getSigners();
  const tx = await signer.sendTransaction({
    to: hatsAddress,
    data: txData,
  });

  const receipt = await tx.wait();

  for (const log of receipt?.logs || []) {
    const parsedLog = Hats.interface.parseLog(log);
    if (parsedLog && parsedLog.name === "HatCreated") {
      console.log("TopHatId: ", parsedLog.args[0]);
    }
  }
};

main();
