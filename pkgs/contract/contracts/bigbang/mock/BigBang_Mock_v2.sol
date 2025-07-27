// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IHats} from "../../hats/src/Interfaces/IHats.sol";
import {IHatsModuleFactory} from "../IHatsModuleFactory.sol";
import {ISplitsCreatorFactory} from "../../splitscreator/ISplitsCreatorFactory.sol";
import {HatsTimeFrameModule} from "../../hatsmodules/timeframe/HatsTimeFrameModule.sol";
import {IThanksTokenFactory} from "../../thankstoken/IThanksTokenFactory.sol";
import {HatsHatCreatorModule} from "../../hatsmodules/hatcreator/HatsHatCreatorModule.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract BigBang_Mock_v3 is OwnableUpgradeable, UUPSUpgradeable {
    IHats public Hats;

    IHatsModuleFactory public HatsModuleFactory;

    ISplitsCreatorFactory public SplitsCreatorFactory;

    uint32 private maxTobanSupply = 10;

    address public HatsTimeFrameModule_IMPL;

    address public HatsHatCreatorModule_IMPL;

    address public HatsFractionTokenModule_IMPL;

    address public SplitsFactoryV2;

    address public ThanksTokenFactory;

    event Executed(
        address indexed creator,
        address indexed owner,
        uint256 indexed topHatId,
        uint256 hatterHatId,
        uint256 memberHatId,
        uint256 operatorHatId,
        uint256 creatorHatId,
        uint256 minterHatId,
        address hatsTimeFrameModule,
        address hatsHatCreatorModule,
        address hatsFractionTokenModule,
        address splitCreator,
        address thanksToken
    );

    /**
     * @dev Constructor to initialize the trusted forwarder.
     * @param _hatsAddress Address of the hats protocol V1 contract.
     * @param _hatsModuleFactory Address of the hats module factory contract.
     * @param _hatsTimeFrameModule_IMPL Address of the hats time frame module implementation contract.
     * @param _hatsHatCreatorModule_IMPL Address of the hats hat creator module implementation contract.
     * @param _hatsFractionTokenModule_IMPL Address of the fraction token contract.
     * @param _splitsCreatorFactory Address of the splits creator factory contract.
     * @param _splitFactoryV2 Address of the split factory V2 contract.
     * @param _thanksTokenFactory Address of the thanks token factory contract.
     */
    function initialize(
        address _initialOwner,
        address _hatsAddress,
        address _hatsModuleFactory,
        address _hatsTimeFrameModule_IMPL,
        address _hatsHatCreatorModule_IMPL,
        address _hatsFractionTokenModule_IMPL,
        address _splitsCreatorFactory,
        address _splitFactoryV2,
        address _thanksTokenFactory
    ) public initializer {
        __Ownable_init(_initialOwner);
        Hats = IHats(_hatsAddress);
        HatsModuleFactory = IHatsModuleFactory(_hatsModuleFactory);
        HatsTimeFrameModule_IMPL = _hatsTimeFrameModule_IMPL;
        HatsHatCreatorModule_IMPL = _hatsHatCreatorModule_IMPL;
        HatsFractionTokenModule_IMPL = _hatsFractionTokenModule_IMPL;
        SplitsCreatorFactory = ISplitsCreatorFactory(_splitsCreatorFactory);
        SplitsFactoryV2 = _splitFactoryV2;
        ThanksTokenFactory = _thanksTokenFactory;
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
        string calldata _memberHatDetails,
        string calldata _memberHatImageURI
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
            2,
            0x0000000000000000000000000000000000004A75,
            0x0000000000000000000000000000000000004A75,
            true,
            _hatterHatImageURI
        );

        // 3. Create Member Hat ID
        uint256 memberHatId = Hats.createHat(
            hatterHatId,
            _memberHatDetails,
            99,
            0x0000000000000000000000000000000000004A75,
            0x0000000000000000000000000000000000004A75,
            true,
            _memberHatImageURI
        );

        Hats.mintHat(memberHatId, _owner);

        // 4. Create Fixed Roles under TopHat
        uint256 operatorHatId = Hats.createHat(
            topHatId,
            _hatterHatDetails,
            5,
            0x0000000000000000000000000000000000004A75,
            0x0000000000000000000000000000000000004A75,
            true,
            _hatterHatImageURI
        );
        uint256 creatorHatId = Hats.createHat(
            operatorHatId,
            _hatterHatDetails,
            5,
            0x0000000000000000000000000000000000004A75,
            0x0000000000000000000000000000000000004A75,
            true,
            _hatterHatImageURI
        );
        uint256 minterHatId = Hats.createHat(
            operatorHatId,
            _hatterHatDetails,
            5,
            0x0000000000000000000000000000000000004A75,
            0x0000000000000000000000000000000000004A75,
            true,
            _hatterHatImageURI
        );

        // 5. HatsHatCreatorModuleのデプロイ
        address hatsHatCreatorModule = HatsModuleFactory.createHatsModule(
            HatsHatCreatorModule_IMPL,
            topHatId,
            "",
            abi.encode(creatorHatId), // ownerを初期化データとして渡す
            0
        );

        // 6. HatsTimeFrameModuleのデプロイ
        address hatsTimeFrameModule = HatsModuleFactory.createHatsModule(
            HatsTimeFrameModule_IMPL,
            topHatId,
            "",
            abi.encode(minterHatId), // ownerを初期化データとして渡す
            0
        );

        // 6. HatsHatFractionTokenModuleのデプロイ
        address hatsFractionTokenModule = HatsModuleFactory.createHatsModule(
            HatsFractionTokenModule_IMPL,
            topHatId,
            "",
            abi.encode("", 10_000),
            0
        );

        // 7. HatterHatにHatModuleをMint
        uint256[] memory hatIds = new uint256[](2);
        hatIds[0] = hatterHatId;
        hatIds[1] = hatterHatId;

        address[] memory modules = new address[](2);
        modules[0] = hatsTimeFrameModule;
        modules[1] = hatsHatCreatorModule;

        Hats.batchMintHats(hatIds, modules);

        // 8. TopHatIdの権限を_ownerに譲渡
        Hats.transferHat(topHatId, address(this), _owner);

        // 9. ThanksTokenをFactoryからデプロイ
        address thanksToken = IThanksTokenFactory(ThanksTokenFactory)
            .createThanksTokenDeterministic(
                string(abi.encodePacked("ThanksToken ", _topHatDetails)),
                string(abi.encodePacked("THX", topHatId)),
                _owner,
                1e18, // デフォルト係数（1.0）
                keccak256(abi.encodePacked(topHatId, "ThanksToken"))
            );

        // 10. SplitCreatorをFactoryからデプロイ
        address splitCreator = SplitsCreatorFactory
            .createSplitCreatorDeterministic(
                topHatId,
                address(Hats),
                SplitsFactoryV2,
                hatsTimeFrameModule,
                hatsFractionTokenModule,
                thanksToken,
                keccak256(abi.encodePacked(topHatId))
            );

        emit Executed(
            msg.sender,
            _owner,
            topHatId,
            hatterHatId,
            memberHatId,
            operatorHatId,
            creatorHatId,
            minterHatId,
            hatsTimeFrameModule,
            hatsHatCreatorModule,
            hatsFractionTokenModule,
            splitCreator,
            thanksToken
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

    function setHatsHatCreatorModuleImpl(
        address _hatsHatCreatorModuleImpl
    ) external onlyOwner {
        HatsHatCreatorModule_IMPL = _hatsHatCreatorModuleImpl;
    }

    function setHatsFractionTokenModuleImpl(
        address _hatsFractionTokenModuleImpl
    ) external onlyOwner {
        HatsFractionTokenModule_IMPL = _hatsFractionTokenModuleImpl;
    }

    function setSplitsFactoryV2(address _splitsFactoryV2) external onlyOwner {
        SplitsFactoryV2 = _splitsFactoryV2;
    }

    function setThanksTokenFactory(
        address _thanksTokenFactory
    ) external onlyOwner {
        ThanksTokenFactory = _thanksTokenFactory;
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}
}
