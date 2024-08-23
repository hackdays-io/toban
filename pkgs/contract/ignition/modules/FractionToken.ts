const {ethers} = require("hardhat");

// npx hardhat run ignition/modules/FractionToken.ts --network sepolia
// npx hardhat verify --network sepolia 0x89ba4d26d9cf02D8edF9d7B46d1376E40A422B60 https://lime-giant-dove-621.mypinata.cloud/ipfs/QmWgN2Z4jTz9c9Yw9YSAp7KZJcoCU47qPwPS6hp6xQQZDY 0x3bc1A0Ad72417f2d411118085256fC53CBdDd137
async function main() {
  const FractionToken = await ethers.getContractFactory("FractionToken");
  const uri =
    "https://lime-giant-dove-621.mypinata.cloud/ipfs/QmWgN2Z4jTz9c9Yw9YSAp7KZJcoCU47qPwPS6hp6xQQZDY";
  const hatsAddress = "0x3bc1A0Ad72417f2d411118085256fC53CBdDd137";
  const fractionToken = await FractionToken.deploy(uri, hatsAddress);

  console.log(
    "FractionToken deployed to:",
    `https://sepolia.etherscan.io/address/${fractionToken.target}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
