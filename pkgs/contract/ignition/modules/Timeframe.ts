const {ethers} = require("hardhat");

// npx hardhat run ignition/modules/Timeframe.ts --network sepolia
// npx hardhat verify --network sepolia 0x939f6252E33697F0E07deE56D55d1404Ea203E08 0x3bc1A0Ad72417f2d411118085256fC53CBdDd137
async function main() {
  const Timeframe = await ethers.getContractFactory("Timeframe");
  const trustedForwarderAddress = "0x3bc1A0Ad72417f2d411118085256fC53CBdDd137";
  const timeframe = await Timeframe.deploy(trustedForwarderAddress);

  console.log(
    "Timeframe deployed to:",
    `https://sepolia.etherscan.io/address/${timeframe.target}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
