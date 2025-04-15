// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IThanksToken} from "./IThanksToken.sol";
import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import {ERC1155Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import {ERC1155SupplyUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155SupplyUpgradeable.sol";
import {MulticallUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/MulticallUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract ThanksToken is
    ERC1155Upgradeable,
    ERC1155SupplyUpgradeable,
    MulticallUpgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    IThanksToken
{
    // Maximum thanks per transaction
    uint256 public MAX_THANKS_PER_TX;
    
    // Daily thanks limit per sender
    uint256 public DAILY_THANKS_LIMIT;
    
    // Token ID for thanks tokens
    uint256 public constant THANKS_TOKEN_ID = 1;
    
    // Mapping to track thanks history
    ThanksHistory[] private thanksHistory;
    
    // Mapping from address to sent thanks counts
    mapping(address => uint256) private thanksSent;
    
    // Mapping from address to received thanks counts
    mapping(address => uint256) private thanksReceived;
    
    // Mapping from address to last reset timestamp
    mapping(address => uint256) private lastResetTimestamp;
    
    // Mapping from address to daily thanks count
    mapping(address => uint256) private dailyThanksCount;

    function initialize(
        address _initialOwner,
        uint256 _maxThanksPerTx,
        uint256 _dailyThanksLimit,
        string memory _uri
    ) public initializer {
        __ERC1155_init(_uri);
        __Ownable_init(_initialOwner);
        __ERC1155Supply_init();
        __Multicall_init();
        
        MAX_THANKS_PER_TX = _maxThanksPerTx;
        DAILY_THANKS_LIMIT = _dailyThanksLimit;
    }

    /**
     * @dev Gives thanks to a recipient with a message
     * @param recipient Address of the recipient
     * @param amount Amount of thanks to give
     * @param message Thank you message
     */
    function giveThanks(
        address recipient,
        uint256 amount,
        string calldata message
    ) public override {
        require(recipient != msg.sender, "Cannot give thanks to yourself");
        require(amount > 0, "Amount must be greater than 0");
        require(amount <= MAX_THANKS_PER_TX, "Exceeds maximum thanks per transaction");
        
        // Check and reset daily limit if needed
        _checkAndResetDailyLimit(msg.sender);
        
        // Check if daily limit would be exceeded
        require(dailyThanksCount[msg.sender] + amount <= DAILY_THANKS_LIMIT, 
                "Exceeds daily thanks limit");
                
        // Update daily thanks count
        dailyThanksCount[msg.sender] += amount;
        
        // Mint thanks tokens to recipient
        _mint(recipient, THANKS_TOKEN_ID, amount, "");
        
        // Update thanks counts
        thanksSent[msg.sender] += amount;
        thanksReceived[recipient] += amount;
        
        // Store thanks history
        uint256 thanksId = thanksHistory.length;
        thanksHistory.push(ThanksHistory({
            id: thanksId,
            sender: msg.sender,
            recipient: recipient,
            message: message,
            amount: amount,
            timestamp: block.timestamp
        }));
        
        emit ThanksGiven(msg.sender, recipient, message, amount, block.timestamp);
    }
    
    /**
     * @dev Check if daily limit needs to be reset and reset if needed
     * @param sender Address of the sender
     */
    function _checkAndResetDailyLimit(address sender) internal {
        uint256 lastReset = lastResetTimestamp[sender];
        uint256 currentTime = block.timestamp;
        
        // Reset daily count if more than 24 hours have passed
        if (currentTime >= lastReset + 1 days) {
            dailyThanksCount[sender] = 0;
            lastResetTimestamp[sender] = currentTime;
        }
    }
    
    /**
     * @dev Get total thanks received by a recipient
     * @param recipient Address of the recipient
     * @return Total thanks received
     */
    function getThanksByRecipient(
        address recipient
    ) public view override returns (uint256) {
        return thanksReceived[recipient];
    }
    
    /**
     * @dev Get total thanks sent by a sender
     * @param sender Address of the sender
     * @return Total thanks sent
     */
    function getThanksBySender(
        address sender
    ) public view override returns (uint256) {
        return thanksSent[sender];
    }
    
    /**
     * @dev Get thanks history for an account (both sent and received)
     * @param account Address of the account
     * @return Array of ThanksHistory entries
     */
    function getThanksHistory(
        address account
    ) public view override returns (ThanksHistory[] memory) {
        // First count how many entries match the account
        uint256 count = 0;
        for (uint256 i = 0; i < thanksHistory.length; i++) {
            if (thanksHistory[i].sender == account || thanksHistory[i].recipient == account) {
                count++;
            }
        }
        
        // Create and populate the result array
        ThanksHistory[] memory result = new ThanksHistory[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < thanksHistory.length && index < count; i++) {
            if (thanksHistory[i].sender == account || thanksHistory[i].recipient == account) {
                result[index] = thanksHistory[i];
                index++;
            }
        }
        
        return result;
    }
    
    /**
     * @dev Get the message for a specific thanks ID
     * @param thanksId ID of the thanks entry
     * @return The message string
     */
    function getMessageById(
        uint256 thanksId
    ) public view override returns (string memory) {
        require(thanksId < thanksHistory.length, "Invalid thanks ID");
        return thanksHistory[thanksId].message;
    }
    
    /**
     * @dev Get the daily thanks remaining for a sender
     * @param sender Address of the sender
     * @return Remaining thanks for the day
     */
    function getDailyThanksRemaining(address sender) public view returns (uint256) {
        uint256 lastReset = lastResetTimestamp[sender];
        uint256 currentTime = block.timestamp;
        
        // If more than 24 hours have passed, return full limit
        if (currentTime >= lastReset + 1 days) {
            return DAILY_THANKS_LIMIT;
        }
        
        // Otherwise return remaining limit
        return DAILY_THANKS_LIMIT > dailyThanksCount[sender] ? 
               DAILY_THANKS_LIMIT - dailyThanksCount[sender] : 0;
    }
    
    /**
     * @dev Set the maximum thanks per transaction
     * @param _maxThanksPerTx New maximum thanks per transaction
     */
    function setMaxThanksPerTx(uint256 _maxThanksPerTx) public onlyOwner {
        MAX_THANKS_PER_TX = _maxThanksPerTx;
    }
    
    /**
     * @dev Set the daily thanks limit
     * @param _dailyThanksLimit New daily thanks limit
     */
    function setDailyThanksLimit(uint256 _dailyThanksLimit) public onlyOwner {
        DAILY_THANKS_LIMIT = _dailyThanksLimit;
    }
    
    /**
     * @dev Implementation of _update required by ERC1155SupplyUpgradeable
     */
    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal virtual override(ERC1155Upgradeable, ERC1155SupplyUpgradeable) {
        super._update(from, to, ids, values);
    }

    /**
     * @dev Implementation of _authorizeUpgrade required by UUPSUpgradeable
     */
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}
}