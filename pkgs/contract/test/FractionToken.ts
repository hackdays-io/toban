import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers"
import { FractionToken } from "../typechain-types";
import { AbiCoder } from "@ethersproject/abi";

describe("FractionToken", function () {
    let fractionToken: FractionToken;
    let owner: SignerWithAddress;
    let addr1: SignerWithAddress;
    let addr2: SignerWithAddress;

    beforeEach(async function () {
        // Get the ContractFactory and Signers here.
        const FractionTokenFactory = await ethers.getContractFactory("FractionToken");
        [owner, addr1, addr2] = await ethers.getSigners();

        // Deploy a new contract before each test
        fractionToken = (await FractionTokenFactory.deploy("http://example.com/api/token/")) as FractionToken;
        await fractionToken.waitForDeployment();
    });

    it("Should deploy the contract", async function () {
        expect(await fractionToken.uri(0)).to.equal("http://example.com/api/token/");
    });

    it("Should mint tokens and track recipients", async function () {
        const hatId = "xxxdjewoidjwiejfoiwehfioiw";

        const abiCoder = new AbiCoder();
        const encodedData = abiCoder.encode(["string", "address"], [hatId, addr1.address]);

        const tokenId = ethers.keccak256(encodedData);
        const tokenIdUint = BigInt(tokenId);

        await fractionToken.mint(hatId, addr1.address);
        
        const recipients = await fractionToken.getTokenRecipients(tokenIdUint);
        
        expect(recipients).to.include(addr1.address);
    });

    it("Should only allow the owner to mint tokens", async function () {
        const hatId = "xxxdjewoidjwiejfoiwehfioiw";
        
        // Attempt to mint tokens from a non-owner address
        await expect(
            fractionToken.connect(addr1).mint(hatId, addr2.address)
        ).to.be.revertedWith("Ownable: caller is not the owner");
    });
});
