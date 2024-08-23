const { ethers } = require("hardhat");

// npx hardhat run ignition/modules/FractionToken.ts --network sepolia
// npx hardhat verify --network sepolia 0xe512bD5060E900C6B23afC9A276F7012B1C65510 https://lime-giant-dove-621.mypinata.cloud/ipfs/QmWgN2Z4jTz9c9Yw9YSAp7KZJcoCU47qPwPS6hp6xQQZDY
async function main() {
  const FractionToken = await ethers.getContractFactory("FractionToken");
  const uri = "https://lime-giant-dove-621.mypinata.cloud/ipfs/QmWgN2Z4jTz9c9Yw9YSAp7KZJcoCU47qPwPS6hp6xQQZDY"
  const fractionToken = await FractionToken.deploy(uri);

  console.log("FractionToken deployed to:", `https://sepolia.etherscan.io/address/${fractionToken.target}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});