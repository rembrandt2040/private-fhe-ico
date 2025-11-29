// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint64 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title FHEPrivateToken
 * @notice ERC20-like token with encrypted balances using ZAMA FHEVM
 * @dev Balances stored as euint64, transfers are private
 */
contract FHEPrivateToken is ZamaEthereumConfig {

    string public constant name = "PrivateToken";
    string public constant symbol = "PVTK";
    uint8 public constant decimals = 0;
    uint64 public constant totalSupply = 1_000_000;

    address public owner;
    address public icoContract;

    // Encrypted balances
    mapping(address => euint64) private balances;

    // Balance decryption state
    mapping(address => bool) public balanceDecryptable;
    mapping(address => uint64) public clearBalance;

    // Events
    event Transfer(address indexed from, address indexed to, uint64 amount);
    event ICOContractSet(address indexed ico);
    event BalanceMadeDecryptable(address indexed user);
    event BalanceDecrypted(address indexed user, uint64 amount);

    constructor() {
        owner = msg.sender;

        // Encrypt total supply and assign to owner
        euint64 initial = FHE.asEuint64(totalSupply);
        balances[owner] = initial;

        // Set permissions
        FHE.allowThis(initial);
        FHE.allow(initial, owner);

        emit Transfer(address(0), owner, totalSupply);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyICO() {
        require(msg.sender == icoContract, "Only ICO contract");
        _;
    }

    /**
     * @notice Set ICO contract address (owner only, one-time)
     */
    function setICOContract(address _ico) external onlyOwner {
        require(icoContract == address(0), "ICO already set");
        require(_ico != address(0), "Invalid address");

        icoContract = _ico;
        
        // Allow ICO contract to access owner's balance
        FHE.allow(balances[owner], _ico);

        emit ICOContractSet(_ico);
    }

    /**
     * @notice Get encrypted balance handle
     */
    function balanceOf(address user) external view returns (euint64) {
        return balances[user];
    }

    /**
     * @notice Check if user has any balance
     */
    function hasBalance(address user) external view returns (bool) {
        return FHE.isInitialized(balances[user]);
    }

    /**
     * @notice Transfer tokens (owner or ICO only)
     * @param to Recipient address
     * @param amount Amount to transfer
     */
    function transfer(address to, uint64 amount) public returns (bool) {
        require(msg.sender == owner || msg.sender == icoContract, "Not authorized");
        require(to != address(0), "Invalid address");

        // Encrypt the amount
        euint64 encAmount = FHE.asEuint64(amount);

        // Subtract from sender (homomorphic subtraction)
        balances[msg.sender] = FHE.sub(balances[msg.sender], encAmount);

        // Add to recipient (homomorphic addition)
        if (FHE.isInitialized(balances[to])) {
            balances[to] = FHE.add(balances[to], encAmount);
        } else {
            balances[to] = encAmount;
        }

        // Set permissions
        FHE.allowThis(balances[msg.sender]);
        FHE.allowThis(balances[to]);
        FHE.allow(balances[msg.sender], msg.sender);
        FHE.allow(balances[to], to);

        // Reset decryptable status since balances changed
        if (balanceDecryptable[msg.sender]) {
            balanceDecryptable[msg.sender] = false;
            clearBalance[msg.sender] = 0;
        }
        if (balanceDecryptable[to]) {
            balanceDecryptable[to] = false;
            clearBalance[to] = 0;
        }

        emit Transfer(msg.sender, to, amount);
        return true;
    }

    /**
     * @notice Transfer from owner to user (called by ICO contract)
     */
    function transferFrom(address from, address to, uint64 amount)
        external
        onlyICO
        returns (bool)
    {
        require(from == owner, "Only from owner");
        require(to != address(0), "Invalid address");

        // Encrypt the amount
        euint64 encAmount = FHE.asEuint64(amount);

        // Subtract from owner
        balances[from] = FHE.sub(balances[from], encAmount);

        // Add to recipient
        if (FHE.isInitialized(balances[to])) {
            balances[to] = FHE.add(balances[to], encAmount);
        } else {
            balances[to] = encAmount;
        }

        // Set permissions
        FHE.allowThis(balances[from]);
        FHE.allowThis(balances[to]);
        FHE.allow(balances[from], from);
        FHE.allow(balances[to], to);

        // Reset decryptable status
        if (balanceDecryptable[from]) {
            balanceDecryptable[from] = false;
            clearBalance[from] = 0;
        }
        if (balanceDecryptable[to]) {
            balanceDecryptable[to] = false;
            clearBalance[to] = 0;
        }

        emit Transfer(from, to, amount);
        return true;
    }

    /**
     * @notice Make your balance decryptable (triggers KMS)
     */
    function makeMyBalanceDecryptable() external {
        require(FHE.isInitialized(balances[msg.sender]), "No balance");
        require(!balanceDecryptable[msg.sender], "Already decryptable");

        FHE.makePubliclyDecryptable(balances[msg.sender]);
        balanceDecryptable[msg.sender] = true;

        emit BalanceMadeDecryptable(msg.sender);
    }

    /**
     * @notice Verify your decrypted balance from KMS
     */
    function verifyMyBalance(
        bytes memory abiEncodedClearBalance,
        bytes memory decryptionProof
    ) external {
        require(balanceDecryptable[msg.sender], "Not decryptable");
        require(clearBalance[msg.sender] == 0, "Already verified");

        bytes32[] memory cts = new bytes32[](1);
        cts[0] = FHE.toBytes32(balances[msg.sender]);

        FHE.checkSignatures(cts, abiEncodedClearBalance, decryptionProof);

        uint64 balance = abi.decode(abiEncodedClearBalance, (uint64));
        clearBalance[msg.sender] = balance;

        emit BalanceDecrypted(msg.sender, balance);
    }

    /**
     * @notice Reset your decryptable status
     */
    function resetMyDecryptableStatus() external {
        balanceDecryptable[msg.sender] = false;
        clearBalance[msg.sender] = 0;
    }
}