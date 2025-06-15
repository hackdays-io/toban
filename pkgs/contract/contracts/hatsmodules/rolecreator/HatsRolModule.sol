// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IHatsRoleModule} from "./IHatsRoleModule.sol";
import {HatsModule} from "../../hats/module/HatsModule.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract HatsRoleHatModule is HatsModule, Ownable, IHatsRoleModule {

    string public constant ADMIN = "Admin";
    uint256 public constant MAX_ROLE_SUPPLY = 10;
    bigint private topHatId;
    /// @dev Mapping to track roleName and bigint hatId
    mapping(string => uint256) public roleToHatId;

    /// @dev Array to track all role names for enumeration
    string[] private roleNames;

    /**
     * @dev Constructor to initialize the contract
     * @param _version The version of the contract
     * @param _tmpOwner The owner of the contract
     */
    constructor(
        string memory _version,
        address _tmpOwner
    ) HatsModule(_version) Ownable(_tmpOwner) {}

    /**
     * @dev Initializes the contract, setting up the owner
     * @param _initData The initialization data (encoded owner address)
     */
    function _setUp(bytes calldata _initData) internal override {
        address _owner = abi.decode(_initData, (address));
        _transferOwnership(_owner);
    }


    /**
     * @notice Creates a new admin role operator hat
     * and assigns it to the given admin address
     * @dev this function also create Admin role Hat and assign to address
     *
     * @param _admin The id of the Hat that will control who wears the newly created hat
     * @param _eligibility The address that can report on the Hat wearer's status
     * @param _toggle The address that can deactivate the Hat
     * @param _imageURI The image uri for this hat and the fallback for its
     *                  downstream hats [optional]. Should not be larger than 7000 bytes (enforced in changeHatImageURI)
     * @return newHatId The id of the newly created Hat
     */
    function createAdminRoleOperator(
        address _admin,
        address _eligibility,
        address _toggle,
        string memory _imageURI
    ) internal returns (uint256) {
        require( topHatId != 0, "Admin top hat already exists");
        hats = Hats();
        // create operator top hat
        topHatId = hats.mintTopHat(
            _admin,
            "OperatorHat",
            _imageURI
        );
        require(topHatId != 0, "Failed to create admin top hat");
        adminHatId = hats.createHat(
            topHatId,
            _createRoleDescription(ADMIN, "Admin Role"),
            MAX_ROLE_SUPPLY,
            _eligibility,
            _toggle,
            true, // mutable
            _imageURI
        );
        roleToHatId[ADMIN] = adminHatId;

        // Add ADMIN role to the array for enumeration
        roleNames.push(ADMIN);

        emit AdminRoleCreated(adminHatId, _admin, _eligibility, _toggle, _imageURI);
        assignRoleToWearer(ADMIN, _admin);
        return adminHatId;
    }

    /**
     * @notice Checks if an address has hat creation authority
     * @param weearerAddress The address to check
     * @param _roleName The name of the role to check
     * @return bool Whether the address has authority
     */
    function hasARole(
        address weearerAddress,
        string calldata _roleName
    ) public view returns (bool){
        // get roles name from roleToId mapping
        roleHatId = roleToHatId[_roleName];
        if (roleHatId == 0) {
            return false;
        }
        return Hats().isWearerOfHat({
            wearer: weearerAddress,
            hatId: roleHatId
        });
    }

    function _createRoleDescription(
        string calldata roleName,
        string calldata description
    ) internal view returns ( string memory ) {
        string memory finalDescription = bytes(description).length > 0 ? description : "";

        return string(
        abi.encodePacked(
            "{\"name\":\"", roleName, "\", \"description\":\"", finalDescription, "\"}"
            )
        );

    }



    /**
     * @notice Creates a new role hat
     * @param _rolename The details of the hat
     * @param _description The details of the hat
     * @param _maxSupply The maximum supply of the hat
     * @param _eligibility The address of the eligibility module
     * @param _toggle The address of the toggle module
     * @param _mutable Whether the hat's properties are changeable after creation
     * @param _imageURI The image uri for this hat
     * @return hatId The ID of the created hat
     */
    function createRole(
        string calldata _rolename,
        string calldata _description,
        uint32 _maxSupply,
        address _eligibility,
        address _toggle,
        bool _mutable,
        string calldata _imageURI
    ) external returns (uint256) {
        require( topHatId == 0, "Role hat already exists");
        require( roleToHatId[_rolename] == 0, "Role hat already exists");
        require(hasRole(Admin, msg.sender), "Not authorized to create role hats");

        // Create the role hat
        uint256 hatId = HATS().createHat(
            topHatId,
            _createRoleDescription(_rolename, _description),
            _maxSupply,
            _eligibility,
            _toggle,
            _mutable,
            _imageURI
        );

        // Store the role hat ID in the mapping
        roleToHatId[_rolename] = hatId;

        // Add role name to the array for enumeration
        roleNames.push(_rolename);

        emit RoleHatCreated(hatId, _rolename);
        return hatId;
    }

    /**
     * @notice assign Role to wearer Address
     * @param _wearerAddress The address to assign the role to
     * @param _roleName The name of the role to assign
     */
    function assignRoleToWearer(
        address _wearerAddress,
        string calldata _roleName
    ) external returns ( bool ){
        require(hasRole(Admin, msg.sender), "Not authorized to assign roles");
        uint256 roleHatId = roleToHatId[_roleName];
        require(roleHatId != 0, "Role hat does not exist");

        Hats().mintHat(
            roleHatID,
            _wearerAddress
        );

        emit RoleAssigned( roleHatId, _roleName, _wearerAddress);
        return true;
    }

    function removeRoleFromWearer(
        address _wearerAddress,
        string calldata _roleName
    ) external returns ( bool ) {
        /* TBD clarify if this needs to be removed role */
    }

    /**
     * @notice Lists all created roles
     * @return roleNames Array of all role names that have been created
     */
    function listRoles() external view returns (string[] memory) {
        return roleNames;
    }

    /**
     * @notice Gets the total number of roles created
     * @return count The total number of roles
     */
    function getRoleCount() external view returns (uint256) {
        return roleNames.length;
    }

}
