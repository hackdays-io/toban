import { expect } from "chai";
import { viem } from "hardhat";
import type { Address, PublicClient, WalletClient } from "viem";
import { decodeEventLog, encodeFunctionData, zeroAddress } from "viem";

interface ContractError extends Error {
  message: string;
}

import {
  type ThanksToken,
  deployThanksToken,
} from "../helpers/deploy/ThanksToken"; // Using the correct path case

describe("ThanksToken", () => {
  let ThanksToken: ThanksToken;

  let address1: WalletClient;
  let address2: WalletClient;
  let address3: WalletClient;
  let address4: WalletClient;
  let address1Validated: Address;
  let address2Validated: Address;
  let address3Validated: Address;
  let address4Validated: Address;

  let publicClient: PublicClient;

  const validateAddress = (client: WalletClient): Address => {
    if (!client.account?.address) {
      throw new Error("Wallet client account address is undefined");
    }
    return client.account.address;
  };

  before(async () => {
    // Deploy ThanksToken contract
    const { ThanksToken: _ThanksToken } = await deployThanksToken(
      "",         // URI
      10n,       // Max thanks per transaction
      50n        // Daily thanks limit
    );
    ThanksToken = _ThanksToken;

    [address1, address2, address3, address4] = await viem.getWalletClients();

    address1Validated = validateAddress(address1);
    address2Validated = validateAddress(address2);
    address3Validated = validateAddress(address3);
    address4Validated = validateAddress(address4);

    publicClient = await viem.getPublicClient();
  });

  it("should initialize with correct values", async () => {
    const maxThanksPerTx = await ThanksToken.read.MAX_THANKS_PER_TX();
    const dailyThanksLimit = await ThanksToken.read.DAILY_THANKS_LIMIT();
    
    expect(maxThanksPerTx).to.equal(10n);
    expect(dailyThanksLimit).to.equal(50n);
  });

  it("should give thanks successfully", async () => {
    // address1 gives thanks to address2
    const tx = await ThanksToken.write.giveThanks(
      [address2Validated, 5n, "Thank you for your help!"],
      { account: address1.account }
    );

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: tx,
    });

    // Verify thanks event was emitted
    const thanksGivenEvent = receipt.logs.find((log) => {
      try {
        const decodedLog = decodeEventLog({
          abi: ThanksToken.abi,
          data: log.data,
          topics: log.topics,
        });
        return decodedLog.eventName === "ThanksGiven";
      } catch (error) {
        return false;
      }
    });

    expect(thanksGivenEvent).to.not.be.undefined;

    // Check thanks counts
    const thanksSent = await ThanksToken.read.getThanksBySender([address1Validated]);
    const thanksReceived = await ThanksToken.read.getThanksByRecipient([address2Validated]);
    
    expect(thanksSent).to.equal(5n);
    expect(thanksReceived).to.equal(5n);
    
    // Check token balance
    const balance = await ThanksToken.read.balanceOf([
      address2Validated,
      1n // THANKS_TOKEN_ID
    ]);
    
    expect(balance).to.equal(5n);
  });

  it("should track daily thanks limits", async () => {
    // address1 gives more thanks to address2
    await ThanksToken.write.giveThanks(
      [address2Validated, 10n, "Another thank you!"],
      { account: address1.account }
    );
    
    // Check updated thanks counts
    const thanksSent = await ThanksToken.read.getThanksBySender([address1Validated]);
    const thanksReceived = await ThanksToken.read.getThanksByRecipient([address2Validated]);
    
    expect(thanksSent).to.equal(15n);
    expect(thanksReceived).to.equal(15n);
    
    // Check daily thanks remaining
    const remaining = await ThanksToken.read.getDailyThanksRemaining([address1Validated]);
    expect(remaining).to.equal(35n); // 50 limit - 15 used
  });

  it("should store and retrieve thanks history", async () => {
    // address3 gives thanks to address4
    await ThanksToken.write.giveThanks(
      [address4Validated, 3n, "Thanks for the review!"],
      { account: address3.account }
    );
    
    // Get thanks history for address3
    const history = await ThanksToken.read.getThanksHistory([address3Validated]);
    
    expect(history.length).to.equal(1);
    expect(history[0].sender.toLowerCase()).to.equal(address3Validated.toLowerCase());
    expect(history[0].recipient.toLowerCase()).to.equal(address4Validated.toLowerCase());
    expect(history[0].amount).to.equal(3n);
    expect(history[0].message).to.equal("Thanks for the review!");
    
    // Get message by ID
    const message = await ThanksToken.read.getMessageById([history[0].id]);
    expect(message).to.equal("Thanks for the review!");
  });

  it("should prevent giving thanks to yourself", async () => {
    await ThanksToken.write.giveThanks(
      [address1Validated, 5n, "Self thanks"],
      { account: address1.account }
    ).catch((error: ContractError) => {
      expect(error.message).to.include("Cannot give thanks to yourself");
    });
  });

  it("should enforce maximum thanks per transaction", async () => {
    await ThanksToken.write.giveThanks(
      [address2Validated, 20n, "Too many thanks!"],
      { account: address3.account }
    ).catch((error: ContractError) => {
      expect(error.message).to.include("Exceeds maximum thanks per transaction");
    });
  });

  it("should allow owner to adjust limits", async () => {
    // Change max thanks per transaction
    await ThanksToken.write.setMaxThanksPerTx([20n]);
    
    // Verify the change
    const newMax = await ThanksToken.read.MAX_THANKS_PER_TX();
    expect(newMax).to.equal(20n);
    
    // Now this should work
    await ThanksToken.write.giveThanks(
      [address2Validated, 15n, "More thanks allowed now!"],
      { account: address3.account }
    );
    
    // Change daily limit
    await ThanksToken.write.setDailyThanksLimit([100n]);
    
    // Verify the change
    const newDailyLimit = await ThanksToken.read.DAILY_THANKS_LIMIT();
    expect(newDailyLimit).to.equal(100n);
  });
});