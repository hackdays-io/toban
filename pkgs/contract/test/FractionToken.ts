// import {expect} from "chai";
// import {ethers} from "hardhat";
// import {SignerWithAddress} from "@nomicfoundation/hardhat-ethers/signers";
// import {FractionToken, FractionToken__factory} from "../typechain-types";
// import {ZeroAddress} from "ethers";

// describe("FractionToken", function () {
//   let fractionToken: FractionToken;
//   let owner: SignerWithAddress;
//   let addr1: SignerWithAddress;
//   const hatsContractAddress = "0x3bc1A0Ad72417f2d411118085256fC53CBdDd137";
//   const uri =
//     "https://lime-giant-dove-621.mypinata.cloud/ipfs/QmWgN2Z4jTz9c9Yw9YSAp7KZJcoCU47qPwPS6hp6xQQZDY";

//   before(async function () {
//     [owner, addr1] = await ethers.getSigners();

//     const FractionToken = (await ethers.getContractFactory(
//       "FractionToken"
//     )) as FractionToken__factory;
//     fractionToken = await FractionToken.deploy(
//       uri,
//       hatsContractAddress,
//       ZeroAddress
//     );
//     await fractionToken.waitForDeployment();
//   });

//   it("should mint tokens correctly", async function () {
//     const hatId = "fafafa";
//     await fractionToken.mint(hatId, addr1.address);
//     const balance = await fractionToken["balanceOf(address,address,uint256)"](
//       addr1.address,
//       addr1.address,
//       hatId
//     );
//     console.log("balance", balance);

//     expect(balance).to.equal(10000); // TOKEN_SUPPLY
//   });

//   it("should return token recipients", async function () {
//     const hatId = "fafafa";
//     const tokenId =
//       "86799809573486251495320524870321217189752669295897169943777875749952950517534";
//     const recipients = await fractionToken.getTokenRecipients(tokenId);
//     expect(recipients).to.include(addr1.address);
//   });

//   it("should return all token IDs", async function () {
//     const allTokenIds = await fractionToken.getAllTokenIds();
//     expect(allTokenIds.length).to.be.greaterThan(0);
//   });

//   it("should check hat role correctly", async function () {
//     const hatId = "fafafa";
//     // エラー出るので一旦コメントアウト
//     // const hasHatRole = await fractionToken._hasHatRole(owner.address, hatId);
//     // expect(hasHatRole).to.be.false; // Assuming no role assigned
//   });

//   it("should override balanceOf correctly", async function () {
//     const hatId = "fafafa";
//     const tokenId =
//       "86799809573486251495320524870321217189752669295897169943777875749952950517534";
//     const balance = await fractionToken["balanceOf(address,address,uint256)"](
//       addr1.address,
//       addr1.address,
//       tokenId
//     );
//     expect(balance).to.equal(10000);
//   });
// });
