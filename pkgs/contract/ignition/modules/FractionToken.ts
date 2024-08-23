const { ethers } = require("hardhat");

// npx hardhat run ignition/modules/FractionToken.ts --network sepolia
// npx hardhat verify --network sepolia 0x9b77A0cb4843dFAb108997928C840484C5247589 https://lime-giant-dove-621.mypinata.cloud/ipfs/QmWgN2Z4jTz9c9Yw9YSAp7KZJcoCU47qPwPS6hp6xQQZDY
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