// // test/HatsHatCreatorModule.ts

// import { expect } from "chai";
// import { ethers } from "hardhat";
// import { BigBang } from "../typechain-types";

// describe("HatsHatCreatorModule + BigBang Integration", function () {
// 	let deployer: any;
// 	let owner: any;
// 	let other: any;
// 	let bigBang: BigBang;

// 	// We'll store the alwaysTrue address so we can pass it to bigBang.bigbang(...)
// 	let alwaysTrueAddress: string;

// 	// We'll store addresses for bigBang.initialize(...)
// 	let hatsContractAddress: string;
// 	let hatsModuleFactoryAddress: string;
// 	let hatsTimeFrameModule_impl: string;
// 	let hatsHatCreatorModule_impl: string;
// 	let splitsCreatorFactoryAddress: string;

// 	const ZERO_ADDRESS = ethers.ZeroAddress;

// 	before(async () => {
// 		[deployer, owner, other] = await ethers.getSigners();
// 		console.log("deployer =", deployer.address);
// 		console.log("owner    =", owner.address);
// 		console.log("other    =", other.address);
// 	});

// 	before(async () => {
// 		// Deploy AlwaysTrueEligibility once
// 		const AlwaysTrueFactory = await ethers.getContractFactory(
// 			"AlwaysTrueEligibility"
// 		);
// 		const alwaysTrue = await AlwaysTrueFactory.connect(deployer).deploy();
// 		await alwaysTrue.waitForDeployment();
// 		alwaysTrueAddress = await alwaysTrue.getAddress();

// 		console.log("deployer =", deployer.address);
// 		console.log("owner    =", owner.address);
// 		console.log("other    =", other.address);
// 		console.log("alwaysTrue =", alwaysTrueAddress);
// 	});

// 	beforeEach(async () => {
// 		// 1) Deploy Hats
// 		const HatsFactory = await ethers.getContractFactory("Hats");
// 		const hats = await HatsFactory.deploy(
// 			"Hats Protocol v1",
// 			"ipfs://some-base-uri"
// 		);
// 		await hats.waitForDeployment();
// 		hatsContractAddress = await hats.getAddress();

// 		// 2) Deploy HatsModuleFactory
// 		const HatsModuleFactory = await ethers.getContractFactory(
// 			"HatsModuleFactory"
// 		);
// 		const hatsModuleFactory = await HatsModuleFactory.deploy(
// 			hatsContractAddress,
// 			"v0.0.1"
// 		);
// 		await hatsModuleFactory.waitForDeployment();
// 		hatsModuleFactoryAddress = await hatsModuleFactory.getAddress();

// 		// 3) Deploy BigBang
// 		const BigBangFactory = await ethers.getContractFactory("BigBang");
// 		const bigBangInstance = await BigBangFactory.deploy();
// 		await bigBangInstance.waitForDeployment();
// 		bigBang = bigBangInstance as BigBang;

// 		// 4) Deploy HatsTimeFrameModule
// 		const HatsTimeFrameModule = await ethers.getContractFactory(
// 			"HatsTimeFrameModule"
// 		);
// 		const hatsTimeFrameModule = await HatsTimeFrameModule.deploy("v0.1.0");
// 		await hatsTimeFrameModule.waitForDeployment();
// 		hatsTimeFrameModule_impl = await hatsTimeFrameModule.getAddress();

// 		// 5) Deploy HatsHatCreatorModule
// 		const HatsHatCreatorModuleFactory = await ethers.getContractFactory(
// 			"HatsHatCreatorModule"
// 		);
// 		const hatsHatCreatorModuleBase = await HatsHatCreatorModuleFactory.deploy(
// 			"v0.1.0",
// 			deployer.address
// 		);
// 		await hatsHatCreatorModuleBase.waitForDeployment();
// 		hatsHatCreatorModule_impl = await hatsHatCreatorModuleBase.getAddress();

// 		// 6) either deploy a real SplitsCreatorFactory or ZERO_ADDRESS
// 		splitsCreatorFactoryAddress = ZERO_ADDRESS;

// 		// 7) initialize BigBang with real or zero addresses
// 		await bigBang.initialize(
// 			hatsContractAddress,
// 			hatsModuleFactoryAddress,
// 			hatsTimeFrameModule_impl,
// 			hatsHatCreatorModule_impl,
// 			splitsCreatorFactoryAddress,
// 			ZERO_ADDRESS, // SplitsFactoryV2
// 			ZERO_ADDRESS // FractionToken
// 		);
// 	});

// 	it("should deploy BigBang, create a TopHat, modules, let finalOwner set createHat permission", async function () {
// 		// Call bigbang(...) as `owner`
// 		const bigBangAsOwner = bigBang.connect(owner);

// 		// pass alwaysTrueAddress for both eligibility & toggle
// 		const tx = await bigBangAsOwner.bigbang(
// 			owner.address,
// 			"TopHat Details",
// 			"TopHat Image URI",
// 			"HatterHat Details",
// 			"HatterHat Image URI",
// 			alwaysTrueAddress,
// 			alwaysTrueAddress
// 		);
// 		const receipt = await tx.wait();

// 		// Filter by BigBang’s address AND the event name
// 		const bigBangAddr = await bigBangAsOwner.getAddress();
// 		const executedLog = receipt.logs.find((log: any) => {
// 			return (
// 				log.address.toLowerCase() === bigBangAddr.toLowerCase() &&
// 				log.fragment?.name === "Executed"
// 			);
// 		});
// 		expect(executedLog, "Could not find the BigBang 'Executed' event").to.exist;

// 		const {
// 			creator,
// 			owner: finalOwner,
// 			topHatId,
// 			hatterHatId,
// 			hatsTimeFrameModule,
// 			hatsHatCreatorModule,
// 			splitCreator,
// 		} = executedLog.args;

// 		// Should match `owner.address`
// 		expect(creator).to.equal(owner.address);
// 		expect(finalOwner).to.equal(owner.address);
// 		expect(hatsTimeFrameModule).to.not.equal(ZERO_ADDRESS);
// 		expect(hatsHatCreatorModule).to.not.equal(ZERO_ADDRESS);

// 		// Connect to newly created HatsHatCreatorModule
// 		const hatsHatCreatorModuleInstance = await ethers.getContractAt(
// 			"HatsHatCreatorModule",
// 			hatsHatCreatorModule
// 		);
// 		expect(await hatsHatCreatorModuleInstance.owner()).to.equal(owner.address);

// 		// By default, canCreateHat[owner] == false
// 		let canOwnerCreate = await hatsHatCreatorModuleInstance.canCreateHat(
// 			owner.address
// 		);
// 		expect(canOwnerCreate).to.eq(false);

// 		// Attempt to create => revert "caller cannot create hat"
// 		const dummyEligibility = (await ethers.getSigners())[9].address;
// 		const dummyToggle = (await ethers.getSigners())[8].address;
// 		await expect(
// 			hatsHatCreatorModuleInstance
// 				.connect(owner)
// 				.createHat(
// 					topHatId,
// 					"Attempt sub-hat",
// 					5,
// 					dummyEligibility,
// 					dummyToggle,
// 					true,
// 					"Some image URI"
// 				)
// 		).to.be.revertedWith("HatsHatCreatorModule: caller cannot create hat");

// 		// Now let finalOwner grant themselves createHat
// 		const hatsHatCreatorModuleAsOwner =
// 			hatsHatCreatorModuleInstance.connect(owner);
// 		await hatsHatCreatorModuleAsOwner.grantCreateHat(owner.address);

// 		// Confirm canCreateHat[owner] is now true
// 		canOwnerCreate = await hatsHatCreatorModuleInstance.canCreateHat(
// 			owner.address
// 		);
// 		expect(canOwnerCreate).to.eq(true);

// 		// Re-try creating a sub-hat => now it should succeed
// 		const newHatTx = await hatsHatCreatorModuleAsOwner.createHat(
// 			topHatId,
// 			"Another sub-hat",
// 			5,
// 			dummyEligibility,
// 			dummyToggle,
// 			true,
// 			"Another image URI"
// 		);
// 		const newHatReceipt = await newHatTx.wait();

// 		// Check the "HatCreated" event from Hats.sol
// 		const newHatCreatedEvent = newHatReceipt.events?.find(
// 			(e: any) => e.event === "HatCreated"
// 		);
// 		expect(newHatCreatedEvent, "Should have emitted a HatCreated event").to.not
// 			.be.undefined;
// 	});

// 	it("should ensure only the module's owner can call grantCreateHat", async function () {
// 		// Another call to bigbang(...) as `owner`
// 		const bigBangAsOwner = bigBang.connect(owner);
// 		const tx = await bigBangAsOwner.bigbang(
// 			owner.address,
// 			"Another Tophat",
// 			"Some image",
// 			"Sub-hat details",
// 			"Sub-hat image",
// 			alwaysTrueAddress,
// 			alwaysTrueAddress
// 		);
// 		const receipt = await tx.wait();

// 		// Filter by BigBang’s address AND event name
// 		const bigBangAddr = await bigBangAsOwner.getAddress();
// 		const executedLog = receipt.logs.find((log: any) => {
// 			return (
// 				log.address.toLowerCase() === bigBangAddr.toLowerCase() &&
// 				log.fragment?.name === "Executed"
// 			);
// 		});
// 		expect(executedLog, "Could not find the BigBang 'Executed' event").to.exist;

// 		const { hatsHatCreatorModule } = executedLog.args;

// 		// Connect to newly created HatsHatCreatorModule
// 		const hatsHatCreatorModuleInstance = await ethers.getContractAt(
// 			"HatsHatCreatorModule",
// 			hatsHatCreatorModule
// 		);

// 		// Confirm final owner is `owner`
// 		expect(await hatsHatCreatorModuleInstance.owner()).to.equal(owner.address);

// 		// A random address tries => revert "OwnableUnauthorizedAccount"
// 		const hatsHatCreatorModuleAsOther =
// 			hatsHatCreatorModuleInstance.connect(other);
// 		await expect(
// 			hatsHatCreatorModuleAsOther.grantCreateHat(other.address)
// 		).to.be.revertedWithCustomError(
// 			hatsHatCreatorModuleInstance,
// 			"OwnableUnauthorizedAccount"
// 		);

// 		// But `owner` can do it
// 		const hatsHatCreatorModuleAsOwner =
// 			hatsHatCreatorModuleInstance.connect(owner);
// 		await hatsHatCreatorModuleAsOwner.grantCreateHat(other.address);

// 		expect(
// 			await hatsHatCreatorModuleInstance.canCreateHat(other.address)
// 		).to.eq(true);
// 	});
// });
