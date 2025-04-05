// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IHats} from "../hats/src/Interfaces/IHats.sol";
import {IHatsModuleFactory} from "./IHatsModuleFactory.sol";
import {ISplitsCreatorFactory} from "../splitscreator/ISplitsCreatorFactory.sol";
import {HatsTimeFrameModule} from "../hatsmodules/timeframe/HatsTimeFrameModule.sol";
import {HatsHatCreatorModule} from "../hatsmodules/hatcreator/HatsHatCreatorModule.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract BigBang is OwnableUpgradeable, UUPSUpgradeable {
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
        address _initialOwner,
        address _hatsAddress,
        address _hatsModuleFactory,
        address _hatsTimeFrameModule_IMPL,
        address _hatsHatCreatorModule_IMPL,
        address _splitsCreatorFactory,
        address _splitFactoryV2,
        address _fractionToken
    ) public initializer {
        __Ownable_init(_initialOwner);
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
        string calldata _hatterHatImageURI
    ) external returns (uint256) {
        // 1. TopHatのMint
        // ワークスペースのルートロール（組織のルートノード）
        // このコントラクトだけがこのTopHat配下にサブハット（＝下位ロール）を作成できる
        uint256 topHatId = Hats.mintTopHat(
            address(this),  // TopHatを被るアドレス（ここではこのコントラクト）/ target: Tophat's wearer address. topHatのみがHatterHatを作成できるためTophatを指定する
            _topHatDetails, // 説明文などの詳細情報（string）
            _topHatImageURI // トップハットの画像URI
        );

        // 2. HatterHatの作成

        // TopHatId から直接下位ロールを作ると中央集権的な管理構造になってしまいます。
        // そこで一段階挟んで HatterHat を作成し、その下に実運用のロール（Contributor, Reviewerなど）を紐づけることで、「TopHatを単なるルートノードに留める」構造が作れます。
        // 将来的に HatterHat によってサブハット（実働部隊の役割）を分岐させたり、DAOによるガバナンスでHatterHatの被り手を変更することも可能になります。
        uint256 hatterHatId = Hats.createHat(
            topHatId,                     // _admin: このHatの管理者HatのID（TopHatに属する）
            _hatterHatDetails,            // Hatの説明
            2,                            // maxSupply（このHatを何人が被れるか）ここでは2人
            0x0000000000000000000000000000000000004A75, // eligibility（適格性を判定するコントラクト）
            0x0000000000000000000000000000000000004A75, // toggle（有効/無効を切り替えるコントラクト）
            true,                         // mutable（trueだと後から条件を変更できる）
            _hatterHatImageURI            // Hatの見た目画像URI
        );


        // 3. HatsHatCreatorModuleのデプロイ
        // 子Hat（ロール）を作るためのモジュール
        // createHat() とかを中で持つ
        address hatsHatCreatorModule = HatsModuleFactory.createHatsModule(
            HatsHatCreatorModule_IMPL,
            topHatId,
            "",
            abi.encode(_owner), // ownerを初期化データとして渡す
            0
        );

        // 4. HatsTimeFrameModuleのデプロイ
        // Hatを「特定の期間だけ有効にする」ための制御モジュール
        // isActive() とかで時間条件をチェック
        address hatsTimeFrameModule = HatsModuleFactory.createHatsModule(
            HatsTimeFrameModule_IMPL,
            topHatId,
            "",
            abi.encode(_owner), // ownerを初期化データとして渡す
            0
        );

        // 5. HatterHatにHatModuleをMint
        uint256[] memory hatIds = new uint256[](2);
        hatIds[0] = hatterHatId;
        hatIds[1] = hatterHatId;

        address[] memory modules = new address[](2);
        modules[0] = hatsTimeFrameModule;
        modules[1] = hatsHatCreatorModule;

        // mintHat(hatterHatId, hatsTimeFrameModule);
        // mintHat(hatterHatId, hatsHatCreatorModule);
        // 複数の（hatId, wearer）セットに対して mintHat を一気に実行する便利関数

        Hats.batchMintHats(hatIds, modules);

        // 6. TopHatIdの権限を_ownerに譲渡(ロールの引き継ぎ)
        // あるロール（Hat）を今の着用者（_from）から別の対象（_to）に渡すためのメソッド
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

    function setHatsHatCreatorModuleImpl(
        address _hatsHatCreatorModuleImpl
    ) external onlyOwner {
        HatsHatCreatorModule_IMPL = _hatsHatCreatorModuleImpl;
    }

    function setSplitsFactoryV2(address _splitsFactoryV2) external onlyOwner {
        SplitsFactoryV2 = _splitsFactoryV2;
    }

    function setFractionToken(address _fractionToken) external onlyOwner {
        FractionToken = _fractionToken;
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}
}
