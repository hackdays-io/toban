// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IHatsRoleModule {


     /**
     * @notice creates topHat for the role, and create Admin Hat.
     * @dev this function also create Admin role Hat and assign to address
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
    ) external returns (uint256) ;




   /**
     * @notice assign role to and address
     * @param weearerAddress The address to check
     * @param _roleName The name of the role to check
     * @return hatID
     */
    function hasARole(
        address weearerAddress,
        string calldata _roleName
    ) external view returns (bool);



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
    ) external returns (uint256 hatId);

    /**  */


    /**
     * @notice assign Role to wearer Address
     * @param _wearerAddress The address to assign the role to
     * @param _roleName The name of the role to assign
     */
    function assignRoleToWearer(
        address _wearerAddress,
        string calldata _roleName
    ) external returns ( bool );


    /**
     * @notice remove role from wearer
     * @param _wearerAddress The address to assign the role to
     * @param _roleName The name of the role to assign
     */
    function removeRoleFromWearer(
        address _wearerAddress,
        string calldata _roleName
    ) external returns ( bool );


    /**
     * @notice Change the details string of an existing hat
     * @param hatId The ID of the hat to update
     * @param newDetails The new details string
     */
    function updateRoleHat(
        uint256 hatId,
        string calldata newDetails
    ) external;

    /**
     * @notice Change the image URI of an existing hat
     * @param hatId The ID of the hat to update
     * @param newImageURI The new image URI
     */
    function changeHatImageURI(
        uint256 hatId,
        string calldata newImageURI
    ) external;

    /**
     * @notice Change the max supply of an existing hat
     * @param hatId The ID of the hat to update
     * @param newMaxSupply The new max supply value
     */
    function changeHatMaxSupply(uint256 hatId, uint32 newMaxSupply) external;

    /**
     * @notice Lists all created roles
     * @return roleNames Array of all role names that have been created
     */
    function listRoles() external view returns (string[] memory roleNames);

    /**
     * @notice Gets the total number of roles created
     * @return count The total number of roles
     */
    function getRoleCount() external view returns (uint256 count);

    /**
     * @notice Emitted when role is created
     */
    event RoleHatCreated(uint256 hatId, string roleName);

    /**
     *
     * @notice Emitted when role is assigned
     */
    event RoleAssigned( uint256 roleHatId, string roleName, address wearerAddress)


}
