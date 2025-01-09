// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IHats } from "../../hats/src/Interfaces/IHats.sol";
import { IHatsModuleFactory } from "../IHatsModuleFactory.sol";
import { ISplitsCreatorFactory } from "../../splitscreator/ISplitsCreatorFactory.sol";
import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/**
 * Upgradableになっている確認するための検証用BigBangコントラクト
 */
contract BigBang_Mock_v2 is OwnableUpgradeable {
	IHats public Hats;

	IHatsModuleFactory public HatsModuleFactory;

	ISplitsCreatorFactory public SplitsCreatorFactory;

	address public HatsTimeFrameModule_IMPL;

    address public HatsHatCreatorModule_IMPL;

	address public SplitsFactoryV2;

	address public FractionToken;

	event Executed(
		address indexed creator,
		address indexed owner,
		uint256 indexed topHatId,
		uint256 hatterHatId,
		address hatsTimeFrameModule,
        address hatsHatCreatorModule,
		address splitCreator
	);

	/**
	 * @dev Constructor to initialize the trusted forwarder.
	 * @param _hatsAddress Address of the hats protocol V1 contract.
	 * @param _hatsModuleFactory Address of the hats module factory contract.
	 * @param _hatsTimeFrameModule_IMPL Address of the hats time frame module implementation contract.
	 * @param _hatsHatCreatorModule_IMPL Address of the hats hat creator module implementation contract.
	 * @param _splitsCreatorFactory Address of the splits creator factory contract.
	 * @param _splitFactoryV2 Address of the split factory V2 contract.
	 * @param _fractionToken Address of the fraction token contract.
	 */
	function initialize(
		address _hatsAddress,
		address _hatsModuleFactory,
		address _hatsTimeFrameModule_IMPL,
        address _hatsHatCreatorModule_IMPL,
		address _splitsCreatorFactory,
		address _splitFactoryV2,
		address _fractionToken
	) public initializer {
		__Ownable_init(_msgSender());
		Hats = IHats(_hatsAddress);
		HatsModuleFactory = IHatsModuleFactory(_hatsModuleFactory);
		HatsTimeFrameModule_IMPL = _hatsTimeFrameModule_IMPL;
        HatsHatCreatorModule_IMPL = _hatsHatCreatorModule_IMPL;
		SplitsCreatorFactory = ISplitsCreatorFactory(_splitsCreatorFactory);
		SplitsFactoryV2 = _splitFactoryV2;
		FractionToken = _fractionToken;
	}

	/**
	 * @dev
	 * @param _owner The address of the user who will own the topHat.
	 * @param _topHatDetails The details of the topHat.
	 * @param _topHatImageURI The image URI of the topHat.
	 * @param _hatterHatDetails The details of the hatterHat.
	 * @param _hatterHatImageURI The image URI of the hatterHat.
	 * @return topHatId The ID used for navigating to the ProjectTop page after project creation.
	 */
	function bigbang(
		address _owner,
		string calldata _topHatDetails,
		string calldata _topHatImageURI,
		string calldata _hatterHatDetails,
		string calldata _hatterHatImageURI,
		address _eligibility,
    	address _toggle
	) external returns (uint256) {
		// 1. TopHatのMint

		uint256 topHatId = Hats.mintTopHat(
			address(this), // target: Tophat's wearer address. topHatのみがHatterHatを作成できるためTophatを指定する
			_topHatDetails,
			_topHatImageURI
		);

		// 2. HatterHatの作成

		uint256 hatterHatId = Hats.createHat(
			topHatId, // _admin: The id of the Hat that will control who wears the newly created hat
			_hatterHatDetails,
			1,
			0x0000000000000000000000000000000000004A75,
			0x0000000000000000000000000000000000004A75,
			true,
			_hatterHatImageURI
		);

		// 4. HatsTimeFrameModuleのデプロイ
		address hatsTimeFrameModule = HatsModuleFactory.createHatsModule(
			HatsTimeFrameModule_IMPL,
			topHatId,
			"",
			"",
			0
		);

        // 4) HatsHatCreatorModuleのデプロイ
        bytes memory initData = abi.encode(_owner);
        address hatsHatCreatorModule = HatsModuleFactory.createHatsModule(
            HatsHatCreatorModule_IMPL,
            topHatId,
            "",
            initData,
            0
        );

		// 5. HatsTimeFrameModuleにHatterHatをMint
		Hats.mintHat(hatterHatId, hatsTimeFrameModule);

		// 6. TopHatIdの権限を_ownerに譲渡
		Hats.transferHat(topHatId, address(this), _owner);

		// 7. SplitCreatorをFactoryからデプロイ
		address splitCreator = SplitsCreatorFactory
			.createSplitCreatorDeterministic(
				topHatId,
				address(Hats),
				SplitsFactoryV2,
				hatsTimeFrameModule,
				FractionToken,
				keccak256(abi.encodePacked(topHatId))
			);

		emit Executed(
			msg.sender,
			_owner,
			topHatId,
			hatterHatId,
			hatsTimeFrameModule,
            hatsHatCreatorModule,
			splitCreator
		);

		return topHatId;
	}

	function setHats(address _hats) external onlyOwner {
		Hats = IHats(_hats);
	}

	function setHatsModuleFactory(
		address _hatsModuleFactory
	) external onlyOwner {
		HatsModuleFactory = IHatsModuleFactory(_hatsModuleFactory);
	}

	function setSplitsCreatorFactory(
		address _splitsCreatorFactory
	) external onlyOwner {
		SplitsCreatorFactory = ISplitsCreatorFactory(_splitsCreatorFactory);
	}

	function setHatsTimeFrameModuleImpl(
		address _hatsTimeFrameModuleImpl
	) external onlyOwner {
		HatsTimeFrameModule_IMPL = _hatsTimeFrameModuleImpl;
	}

	function setSplitsFactoryV2(address _splitsFactoryV2) external onlyOwner {
		SplitsFactoryV2 = _splitsFactoryV2;
	}

	function setFractionToken(address _fractionToken) external onlyOwner {
		FractionToken = _fractionToken;
	}

    /**
     * @dev New function in the mock v2, to verify that we upgraded successfully
     */
    function testUpgradeFunction() external pure returns (string memory) {
        return "testUpgradeFunction";
    }
}