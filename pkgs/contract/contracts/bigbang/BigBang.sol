// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IHats } from "../hats/src/Interfaces/IHats.sol";
import { IHatsModuleFactory } from "./IHatsModuleFactory.sol";
import { ISplitsCreatorFactory } from "../splitscreator/ISplitsCreatorFactory.sol";
import { HatsTimeFrameModule } from "../timeframe/HatsTimeFrameModule.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";

contract BigBang is ERC2771Context {
	IHats public Hats;

	IHatsModuleFactory public HatsModuleFactory;

	ISplitsCreatorFactory public SplitsCreatorFactory;

	address public HatsTimeFrameModule_IMPL;

	address public splitFactoryV2;

	address public fractionToken;

	event Executed(
		address indexed owner,
		uint256 indexed topHatId,
		uint256 indexed hatterHatId,
		address hatsTimeFrameModule,
		address splitCreator
	);

	/**
	 * @dev Constructor to initialize the trusted forwarder.
	 * @param _trustedForwarder Address of the trusted forwarder contract.
	 * @param _hatsAddress Address of the hats protocol V1 contract.
	 * @param _hatsModuleFactory Address of the hats module factory contract.
	 * @param _hatsTimeFrameModule_IMPL Address of the hats time frame module implementation contract.
	 * @param _splitsCreatorFactory Address of the splits creator factory contract.
	 * @param _splitFactoryV2 Address of the split factory V2 contract.
	 * @param _fractionToken Address of the fraction token contract.
	 */
	constructor(
		address _trustedForwarder,
		address _hatsAddress,
		address _hatsModuleFactory,
		address _hatsTimeFrameModule_IMPL,
		address _splitsCreatorFactory,
		address _splitFactoryV2,
		address _fractionToken
	) ERC2771Context(_trustedForwarder) {
		Hats = IHats(_hatsAddress);
		HatsModuleFactory = IHatsModuleFactory(_hatsModuleFactory);
		HatsTimeFrameModule_IMPL = _hatsTimeFrameModule_IMPL;
		SplitsCreatorFactory = ISplitsCreatorFactory(_splitsCreatorFactory);
		splitFactoryV2 = _splitFactoryV2;
		fractionToken = _fractionToken;
	}

	/**
	 * @dev
	 * @param _owner The address of the user who will own the topHat.
	 * @param _topHatDetails The details of the topHat.
	 * @param _topHatImageURI The image URI of the topHat.
	 * @param _hatterHatDetails The details of the hatterHat.
	 * @param _hatterHatImageURI The image URI of the hatterHat.
	 * @param _trustedForwarder The address of the trusted forwarder.
	 * @return topHatId The ID used for navigating to the ProjectTop page after project creation.
	 */
	function bigbang(
		address _owner,
		string calldata _topHatDetails,
		string calldata _topHatImageURI,
		string calldata _hatterHatDetails,
		string calldata _hatterHatImageURI,
		address _trustedForwarder
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

		// 5. HatsTimeFrameModuleにHatterHatをMint
		Hats.mintHat(hatterHatId, hatsTimeFrameModule);

		// 6. TopHatIdの権限を_ownerに譲渡
		Hats.transferHat(topHatId, address(this), _owner);

		// 7. SplitCreatorをFactoryからデプロイ
		address splitCreator = SplitsCreatorFactory
			.createSplitCreatorDeterministic(
				topHatId,
				_trustedForwarder,
				splitFactoryV2,
				hatsTimeFrameModule,
				fractionToken,
				keccak256(abi.encodePacked(topHatId))
			);

		emit Executed(_owner, topHatId, hatterHatId, hatsTimeFrameModule, splitCreator);

		return topHatId;
	}

	// Override _msgSender to use the context from ERC2771Context.
	function _msgSender()
		internal
		view
		override(ERC2771Context)
		returns (address)
	{
		return ERC2771Context._msgSender();
	}

	// Override _msgData to use the context from ERC2771Context.
	function _msgData()
		internal
		view
		override(ERC2771Context)
		returns (bytes calldata)
	{
		return ERC2771Context._msgData();
	}
}
