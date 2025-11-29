// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint64 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title PrivateICO
 * @notice Private ICO with encrypted contributions using ZAMA FHEVM
 * @dev Contributions are encrypted on-chain and stored as euint64
 */
contract PrivateICO is ZamaEthereumConfig {

    // Token constants
    string public constant TOKEN_NAME = "PrivateToken";
    string public constant TOKEN_SYMBOL = "PVTK";
    uint64 public constant TOKEN_SUPPLY = 1_000_000;

    // ICO cap
    uint256 public constant HARD_CAP = 0.1 ether;

    // ICO state
    address public owner;
    uint256 public saleStart;
    uint256 public saleEnd;
    bool public saleFinalized;

    // Encrypted total raised
    euint64 private encryptedTotalRaised;
    uint64 public clearTotalRaised;
    bool public totalMadeDecryptable;

    // Contribution record
    struct Contribution {
        euint64 encryptedAmount;
        uint64 clearAmount;
        bool hasContributed;
        bool amountDecryptable;
        bool tokensClaimed;
    }

    mapping(address => Contribution) public contributions;
    address[] public contributors;

    // Token contract reference
    address public tokenContract;

    // Events
    event ContributionSubmitted(address indexed contributor, uint256 ethAmount);
    event TotalMadeDecryptable();
    event TotalDecrypted(uint64 total);
    event ContributionDecrypted(address indexed contributor, uint64 clearAmount);
    event TokensClaimed(address indexed user, uint64 amount);
    event SaleClosed();
    event HardCapReached(uint256 totalRaised);

    constructor() {
        owner = msg.sender;
        saleStart = block.timestamp;
        saleEnd = block.timestamp + 60 days;

        encryptedTotalRaised = FHE.asEuint64(0);
        FHE.allowThis(encryptedTotalRaised);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier saleActive() {
        require(block.timestamp <= saleEnd, "Sale ended");
        require(!saleFinalized, "Sale finalized");
        _;
    }

    /**
     * @notice Contribute to the ICO
     * @param amount Contribution amount in wei (encrypted on-chain)
     */
    function contribute(uint64 amount)
        external
        payable
        saleActive
    {
        require(msg.value > 0, "ETH required");
        require(amount > 0, "Amount required");
        
        // Check hard cap
        uint256 currentBalance = address(this).balance - msg.value;
        require(currentBalance + msg.value <= HARD_CAP, "Hard cap exceeded");

        // Encrypt the amount on-chain
        euint64 encAmount = FHE.asEuint64(amount);

        Contribution storage c = contributions[msg.sender];

        if (!c.hasContributed) {
            c.encryptedAmount = encAmount;
            c.hasContributed = true;
            contributors.push(msg.sender);
        } else {
            // Add to existing encrypted contribution (homomorphic addition)
            c.encryptedAmount = FHE.add(c.encryptedAmount, encAmount);
        }

        // Update encrypted total (homomorphic addition)
        encryptedTotalRaised = FHE.add(encryptedTotalRaised, encAmount);

        // Set permissions
        FHE.allowThis(c.encryptedAmount);
        FHE.allow(c.encryptedAmount, msg.sender);
        FHE.allowThis(encryptedTotalRaised);

        emit ContributionSubmitted(msg.sender, msg.value);
        
        // Auto-close sale if hard cap is reached
        if (address(this).balance >= HARD_CAP) {
            saleEnd = block.timestamp;
            emit HardCapReached(address(this).balance);
            emit SaleClosed();
        }
    }

    /**
     * @notice Get your encrypted contribution handle
     */
    function getMyEncryptedContribution() external view returns (euint64) {
        require(contributions[msg.sender].hasContributed, "No contribution");
        return contributions[msg.sender].encryptedAmount;
    }

    /**
     * @notice Get encrypted total raised handle
     */
    function getEncryptedTotal() external view returns (euint64) {
        return encryptedTotalRaised;
    }

    /**
     * @notice Force close the sale (owner only)
     */
    function closeSale() external onlyOwner {
        require(!saleFinalized, "Already finalized");
        saleEnd = block.timestamp;
        emit SaleClosed();
    }

    /**
     * @notice Make total publicly decryptable (triggers KMS)
     */
    function makeTotalDecryptable() external {
        require(block.timestamp > saleEnd, "Sale running");
        require(!totalMadeDecryptable, "Already decryptable");

        FHE.makePubliclyDecryptable(encryptedTotalRaised);
        totalMadeDecryptable = true;

        emit TotalMadeDecryptable();
    }

    /**
     * @notice Verify and set decrypted total from KMS
     * @param abiEncodedClearTotal ABI encoded clear total
     * @param decryptionProof Proof from KMS
     */
    function verifyAndSetTotal(
        bytes memory abiEncodedClearTotal,
        bytes memory decryptionProof
    )
        external
    {
        require(totalMadeDecryptable, "Not decryptable");
        require(!saleFinalized, "Already finalized");

        bytes32[] memory cts = new bytes32[](1);
        cts[0] = FHE.toBytes32(encryptedTotalRaised);

        FHE.checkSignatures(cts, abiEncodedClearTotal, decryptionProof);

        uint64 total = abi.decode(abiEncodedClearTotal, (uint64));
        clearTotalRaised = total;
        saleFinalized = true;

        emit TotalDecrypted(total);
    }

    /**
     * @notice Make your contribution decryptable
     */
    function makeMyContributionDecryptable() external {
        Contribution storage c = contributions[msg.sender];
        require(c.hasContributed, "No contribution");
        require(!c.amountDecryptable, "Already set");

        FHE.makePubliclyDecryptable(c.encryptedAmount);
        c.amountDecryptable = true;
    }

    /**
     * @notice Verify your decrypted contribution from KMS
     * @param abiEncodedClearAmount ABI encoded clear amount
     * @param decryptionProof Proof from KMS
     */
    function verifyMyContribution(
        bytes memory abiEncodedClearAmount,
        bytes memory decryptionProof
    )
        external
    {
        Contribution storage c = contributions[msg.sender];
        require(c.hasContributed, "No contribution");
        require(c.amountDecryptable, "Not decryptable");
        require(c.clearAmount == 0, "Already verified");

        bytes32[] memory cts = new bytes32[](1);
        cts[0] = FHE.toBytes32(c.encryptedAmount);

        FHE.checkSignatures(cts, abiEncodedClearAmount, decryptionProof);

        uint64 amount = abi.decode(abiEncodedClearAmount, (uint64));
        c.clearAmount = amount;

        emit ContributionDecrypted(msg.sender, amount);
    }

    /**
     * @notice Set token contract address (owner only, one-time)
     */
    function setTokenContract(address _tokenContract) external onlyOwner {
        require(tokenContract == address(0), "Already set");
        require(_tokenContract != address(0), "Invalid address");
        tokenContract = _tokenContract;
    }

    /**
     * @notice Claim your token allocation
     */
    function claimTokens() external returns (uint64) {
        require(saleFinalized, "Not finalized");
        require(tokenContract != address(0), "Token not set");

        Contribution storage c = contributions[msg.sender];
        require(c.clearAmount > 0, "Verify first");
        require(!c.tokensClaimed, "Already claimed");

        uint64 tokens = (c.clearAmount * TOKEN_SUPPLY) / clearTotalRaised;

        c.tokensClaimed = true;

        (bool success, ) = tokenContract.call(
            abi.encodeWithSignature(
                "transferFrom(address,address,uint64)",
                owner,
                msg.sender,
                tokens
            )
        );
        require(success, "Token transfer failed");

        emit TokensClaimed(msg.sender, tokens);
        return tokens;
    }

    /**
     * @notice Withdraw ETH after sale finalized (owner only)
     */
    function withdrawFunds() external onlyOwner {
        require(saleFinalized, "Not finalized");
        payable(owner).transfer(address(this).balance);
    }

    /**
     * @notice Get number of contributors
     */
    function getContributorsCount() public view returns (uint256) {
        return contributors.length;
    }

    /**
     * @notice Get sale information
     */
    function getSaleInfo() external view returns (
        uint256 start,
        uint256 end,
        bool finalized,
        bool totalDecryptable,
        uint64 total
    ) {
        return (
            saleStart,
            saleEnd,
            saleFinalized,
            totalMadeDecryptable,
            clearTotalRaised
        );
    }
}