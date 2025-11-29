import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import {
  Lock,
  Wallet,
  TrendingUp,
  Eye,
  EyeOff,
  CheckCircle,
  Clock,
  Users,
  DollarSign,
  AlertTriangle,
  Shield,
  KeyRound,
  Award,
  Send,
  RefreshCw,
} from "lucide-react";

// -------------------- CONFIG --------------------

// UPDATE THESE with your deployed contract addresses
const ICO_ADDRESS = "0x6807468c64eF76aC9bB1cBEcD21f6bA490f9732C";
const TOKEN_ADDRESS = "0x780861dfC2C1FD29FB2765911839307cfD2a72c3";
const SEPOLIA_CHAIN_ID = BigInt(11155111);

// ICO ABI
const ICO_ABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "contributor", type: "address" },
      { indexed: false, internalType: "uint64", name: "clearAmount", type: "uint64" },
    ],
    name: "ContributionDecrypted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "contributor", type: "address" },
      { indexed: false, internalType: "uint256", name: "ethAmount", type: "uint256" },
    ],
    name: "ContributionSubmitted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint256", name: "totalRaised", type: "uint256" },
    ],
    name: "HardCapReached",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [],
    name: "SaleClosed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: false, internalType: "uint64", name: "amount", type: "uint64" },
    ],
    name: "TokensClaimed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint64", name: "total", type: "uint64" },
    ],
    name: "TotalDecrypted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [],
    name: "TotalMadeDecryptable",
    type: "event",
  },
  {
    inputs: [],
    name: "HARD_CAP",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "TOKEN_NAME",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "TOKEN_SUPPLY",
    outputs: [{ internalType: "uint64", name: "", type: "uint64" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "TOKEN_SYMBOL",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "claimTokens",
    outputs: [{ internalType: "uint64", name: "", type: "uint64" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "clearTotalRaised",
    outputs: [{ internalType: "uint64", name: "", type: "uint64" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "closeSale",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint64", name: "amount", type: "uint64" }],
    name: "contribute",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "contributions",
    outputs: [
      { internalType: "euint64", name: "encryptedAmount", type: "bytes32" },
      { internalType: "uint64", name: "clearAmount", type: "uint64" },
      { internalType: "bool", name: "hasContributed", type: "bool" },
      { internalType: "bool", name: "amountDecryptable", type: "bool" },
      { internalType: "bool", name: "tokensClaimed", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "contributors",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getContributorsCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getEncryptedTotal",
    outputs: [{ internalType: "euint64", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getMyEncryptedContribution",
    outputs: [{ internalType: "euint64", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getSaleInfo",
    outputs: [
      { internalType: "uint256", name: "start", type: "uint256" },
      { internalType: "uint256", name: "end", type: "uint256" },
      { internalType: "bool", name: "finalized", type: "bool" },
      { internalType: "bool", name: "totalDecryptable", type: "bool" },
      { internalType: "uint64", name: "total", type: "uint64" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "makeMyContributionDecryptable",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "makeTotalDecryptable",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "saleEnd",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "saleFinalized",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "saleStart",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_tokenContract", type: "address" }],
    name: "setTokenContract",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "tokenContract",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalMadeDecryptable",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes", name: "abiEncodedClearTotal", type: "bytes" },
      { internalType: "bytes", name: "decryptionProof", type: "bytes" },
    ],
    name: "verifyAndSetTotal",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes", name: "abiEncodedClearAmount", type: "bytes" },
      { internalType: "bytes", name: "decryptionProof", type: "bytes" },
    ],
    name: "verifyMyContribution",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "withdrawFunds",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

// Token ABI
const TOKEN_ABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: false, internalType: "uint64", name: "amount", type: "uint64" },
    ],
    name: "BalanceDecrypted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
    ],
    name: "BalanceMadeDecryptable",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "ico", type: "address" },
    ],
    name: "ICOContractSet",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "from", type: "address" },
      { indexed: true, internalType: "address", name: "to", type: "address" },
      { indexed: false, internalType: "uint64", name: "amount", type: "uint64" },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "balanceDecryptable",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "euint64", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "clearBalance",
    outputs: [{ internalType: "uint64", name: "", type: "uint64" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "hasBalance",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "icoContract",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "makeMyBalanceDecryptable",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "resetMyDecryptableStatus",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_ico", type: "address" }],
    name: "setICOContract",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ internalType: "uint64", name: "", type: "uint64" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint64", name: "amount", type: "uint64" },
    ],
    name: "transfer",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "from", type: "address" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint64", name: "amount", type: "uint64" },
    ],
    name: "transferFrom",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes", name: "abiEncodedClearBalance", type: "bytes" },
      { internalType: "bytes", name: "decryptionProof", type: "bytes" },
    ],
    name: "verifyMyBalance",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

// -------------------- APP COMPONENT --------------------

export default function App() {
  // Wallet & Contract State
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [icoContract, setIcoContract] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);

  // ICO State
  const [saleInfo, setSaleInfo] = useState(null);
  const [hardCap, setHardCap] = useState(null);
  const [contributorsCount, setContributorsCount] = useState(0);
  const [encryptedTotal, setEncryptedTotal] = useState("");
  const [myEncryptedContribution, setMyEncryptedContribution] = useState("");
  const [myContributionState, setMyContributionState] = useState({
    hasContributed: false,
    amountDecryptable: false,
    tokensClaimed: false,
    clearAmount: 0,
    encryptedAmount: "",
  });

  // Token State
  const [tokenMeta, setTokenMeta] = useState({ name: "", symbol: "", totalSupply: 0 });
  const [encryptedTokenBalance, setEncryptedTokenBalance] = useState("");
  const [tokenBalanceDecryptable, setTokenBalanceDecryptable] = useState(false);
  const [clearTokenBalance, setClearTokenBalance] = useState(0);
  const [hasTokenBalance, setHasTokenBalance] = useState(false);

  // Input State - ICO
  const [contributionEth, setContributionEth] = useState("");
  const [totalClearBytes, setTotalClearBytes] = useState("");
  const [totalProof, setTotalProof] = useState("");
  const [myClearBytes, setMyClearBytes] = useState("");
  const [myProof, setMyProof] = useState("");

  // Input State - Token
  const [balanceClearBytes, setBalanceClearBytes] = useState("");
  const [balanceProof, setBalanceProof] = useState("");

  // UI State
  const [loadingAction, setLoadingAction] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [wrongNetwork, setWrongNetwork] = useState(false);
  const [activeTab, setActiveTab] = useState("ico");

  // --------------- Helpers ---------------

  const showMessage = (msg, type = "info") => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 6000);
  };

  const checkNetwork = async (web3Provider) => {
    try {
      const network = await web3Provider.getNetwork();
      if (network.chainId !== SEPOLIA_CHAIN_ID) {
        setWrongNetwork(true);
        showMessage("Please switch to Sepolia Testnet", "error");
        return false;
      }
      setWrongNetwork(false);
      return true;
    } catch (e) {
      console.error("Network check error:", e);
      showMessage("Failed to detect network", "error");
      return false;
    }
  };

  const getTimeRemaining = () => {
    if (!saleInfo) return "Loading...";
    const now = Math.floor(Date.now() / 1000);
    const remaining = Number(saleInfo.end) - now;
    if (remaining <= 0) return "Sale Ended";
    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatEth = (weiBigInt) => {
    try {
      return `${ethers.formatEther(weiBigInt)} ETH`;
    } catch {
      return "-";
    }
  };

  const statusLabel = () => {
    if (!saleInfo) return "Loading";
    if (saleInfo.finalized) return "Finalized";
    const now = Math.floor(Date.now() / 1000);
    if (now > Number(saleInfo.end)) return "Ended";
    return "Active";
  };

  const loading = (key) => loadingAction === key;

  // --------------- Wallet Connection ---------------

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        showMessage("Please install MetaMask", "error");
        return;
      }

      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await web3Provider.send("eth_requestAccounts", []);
      const ok = await checkNetwork(web3Provider);
      if (!ok) return;

      const web3Signer = await web3Provider.getSigner();
      const ico = new ethers.Contract(ICO_ADDRESS, ICO_ABI, web3Signer);
      const token = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, web3Signer);

      setProvider(web3Provider);
      setSigner(web3Signer);
      setAccount(accounts[0]);
      setIcoContract(ico);
      setTokenContract(token);

      showMessage("Wallet connected", "success");
      await loadAllData(accounts[0], ico, token);
    } catch (e) {
      console.error(e);
      showMessage("Failed to connect wallet", "error");
    }
  };

  // --------------- Data Loading ---------------

  const loadAllData = async (user, ico, token) => {
    const addr = user || account;
    const icoInstance = ico || icoContract;
    const tokenInstance = token || tokenContract;

    if (!icoInstance) return;

    try {
      // ICO Data
      const info = await icoInstance.getSaleInfo();
      setSaleInfo({
        start: Number(info.start),
        end: Number(info.end),
        finalized: info.finalized,
        totalDecryptable: info.totalDecryptable,
        total: Number(info.total),
      });

      const cap = await icoInstance.HARD_CAP();
      setHardCap(cap);

      const count = await icoInstance.getContributorsCount();
      setContributorsCount(Number(count));

      try {
        const encMy = await icoInstance.getMyEncryptedContribution();
        setMyEncryptedContribution(encMy);
      } catch {
        setMyEncryptedContribution("");
      }

      const encTotal = await icoInstance.getEncryptedTotal();
      setEncryptedTotal(encTotal);

      if (addr) {
        const contrib = await icoInstance.contributions(addr);
        setMyContributionState({
          encryptedAmount: contrib.encryptedAmount,
          clearAmount: Number(contrib.clearAmount),
          hasContributed: contrib.hasContributed,
          amountDecryptable: contrib.amountDecryptable,
          tokensClaimed: contrib.tokensClaimed,
        });
      }

      const ownerAddr = await icoInstance.owner();
      if (addr) {
        setIsOwner(ownerAddr.toLowerCase() === addr.toLowerCase());
      }

      // Token Data
      if (tokenInstance && addr) {
        try {
          const [name, symbol, totalSupply, encBal, isDecryptable, clearBal, hasBal] =
            await Promise.all([
              tokenInstance.name(),
              tokenInstance.symbol(),
              tokenInstance.totalSupply(),
              tokenInstance.balanceOf(addr),
              tokenInstance.balanceDecryptable(addr),
              tokenInstance.clearBalance(addr),
              tokenInstance.hasBalance(addr),
            ]);

          setTokenMeta({ name, symbol, totalSupply: Number(totalSupply) });
          setEncryptedTokenBalance(encBal);
          setTokenBalanceDecryptable(isDecryptable);
          setClearTokenBalance(Number(clearBal));
          setHasTokenBalance(hasBal);
        } catch (e) {
          console.error("Token data error:", e);
        }
      }
    } catch (e) {
      console.error("loadAllData error:", e);
      showMessage("Failed to load contract data", "error");
    }
  };

  // --------------- ICO Actions ---------------

  const handleContribute = async () => {
    if (!icoContract || !signer) {
      showMessage("Not connected", "error");
      return;
    }
    if (!contributionEth || parseFloat(contributionEth) <= 0) {
      showMessage("Enter a valid ETH amount", "error");
      return;
    }

    try {
      setLoadingAction("contribute");
      showMessage("Submitting contribution...", "info");

      const wei = ethers.parseUnits(contributionEth, 18);
      const MAX_UINT64 = BigInt("18446744073709551615");
      const amountUint64 = wei > MAX_UINT64 ? MAX_UINT64 : wei;

      const tx = await icoContract.contribute(amountUint64, { value: wei });
      await tx.wait();

      showMessage("Contribution submitted!", "success");
      setContributionEth("");
      await loadAllData();
    } catch (e) {
      console.error(e);
      showMessage(e.reason || e.message || "Contribution failed", "error");
    } finally {
      setLoadingAction("");
    }
  };

  const handleCloseSale = async () => {
    if (!icoContract) return;
    try {
      setLoadingAction("closeSale");
      const tx = await icoContract.closeSale();
      showMessage("Closing sale...", "info");
      await tx.wait();
      showMessage("Sale closed", "success");
      await loadAllData();
    } catch (e) {
      console.error(e);
      showMessage(e.reason || e.message || "Failed", "error");
    } finally {
      setLoadingAction("");
    }
  };

  const handleMakeTotalDecryptable = async () => {
    if (!icoContract) return;
    try {
      setLoadingAction("makeTotalDecryptable");
      const tx = await icoContract.makeTotalDecryptable();
      showMessage("Making total decryptable...", "info");
      await tx.wait();
      showMessage("Total is now decryptable", "success");
      await loadAllData();
    } catch (e) {
      console.error(e);
      showMessage(e.reason || e.message || "Failed", "error");
    } finally {
      setLoadingAction("");
    }
  };

  const handleVerifyAndSetTotal = async () => {
    if (!icoContract || !totalClearBytes || !totalProof) {
      showMessage("Paste decryption data", "error");
      return;
    }
    try {
      setLoadingAction("verifyTotal");
      const tx = await icoContract.verifyAndSetTotal(totalClearBytes, totalProof);
      showMessage("Verifying...", "info");
      await tx.wait();
      showMessage("Total verified!", "success");
      setTotalClearBytes("");
      setTotalProof("");
      await loadAllData();
    } catch (e) {
      console.error(e);
      showMessage(e.reason || e.message || "Failed", "error");
    } finally {
      setLoadingAction("");
    }
  };

  const handleMakeMyDecryptable = async () => {
    if (!icoContract) return;
    try {
      setLoadingAction("makeMyDecryptable");
      const tx = await icoContract.makeMyContributionDecryptable();
      showMessage("Making decryptable...", "info");
      await tx.wait();
      showMessage("Your contribution is now decryptable", "success");
      await loadAllData();
    } catch (e) {
      console.error(e);
      showMessage(e.reason || e.message || "Failed", "error");
    } finally {
      setLoadingAction("");
    }
  };

  const handleVerifyMyContribution = async () => {
    if (!icoContract || !myClearBytes || !myProof) {
      showMessage("Paste decryption data", "error");
      return;
    }
    try {
      setLoadingAction("verifyMy");
      const tx = await icoContract.verifyMyContribution(myClearBytes, myProof);
      showMessage("Verifying...", "info");
      await tx.wait();
      showMessage("Contribution verified!", "success");
      setMyClearBytes("");
      setMyProof("");
      await loadAllData();
    } catch (e) {
      console.error(e);
      showMessage(e.reason || e.message || "Failed", "error");
    } finally {
      setLoadingAction("");
    }
  };

  const handleClaimTokens = async () => {
    if (!icoContract) return;
    try {
      setLoadingAction("claim");
      const tx = await icoContract.claimTokens();
      showMessage("Claiming tokens...", "info");
      await tx.wait();
      showMessage("Tokens claimed!", "success");
      await loadAllData();
    } catch (e) {
      console.error(e);
      showMessage(e.reason || e.message || "Failed", "error");
    } finally {
      setLoadingAction("");
    }
  };

  // --------------- Token Actions ---------------

  const handleMakeBalanceDecryptable = async () => {
    if (!tokenContract) return;
    try {
      setLoadingAction("makeBalanceDecryptable");
      const tx = await tokenContract.makeMyBalanceDecryptable();
      showMessage("Making balance decryptable...", "info");
      await tx.wait();
      showMessage("Balance is now decryptable", "success");
      await loadAllData();
    } catch (e) {
      console.error(e);
      showMessage(e.reason || e.message || "Failed", "error");
    } finally {
      setLoadingAction("");
    }
  };

  const handleVerifyBalance = async () => {
    if (!tokenContract || !balanceClearBytes || !balanceProof) {
      showMessage("Paste decryption data", "error");
      return;
    }
    try {
      setLoadingAction("verifyBalance");
      const tx = await tokenContract.verifyMyBalance(balanceClearBytes, balanceProof);
      showMessage("Verifying...", "info");
      await tx.wait();
      showMessage("Balance verified!", "success");
      setBalanceClearBytes("");
      setBalanceProof("");
      await loadAllData();
    } catch (e) {
      console.error(e);
      showMessage(e.reason || e.message || "Failed", "error");
    } finally {
      setLoadingAction("");
    }
  };

  const handleResetBalanceDecryptable = async () => {
    if (!tokenContract) return;
    try {
      setLoadingAction("resetBalance");
      const tx = await tokenContract.resetMyDecryptableStatus();
      showMessage("Resetting...", "info");
      await tx.wait();
      showMessage("Reset complete", "success");
      await loadAllData();
    } catch (e) {
      console.error(e);
      showMessage(e.reason || e.message || "Failed", "error");
    } finally {
      setLoadingAction("");
    }
  };

  const refreshData = async () => {
    await loadAllData();
    showMessage("Data refreshed", "success");
  };

  // --------------- Effects ---------------

  useEffect(() => {
    if (window.ethereum) {
      const handleChainChanged = () => window.location.reload();
      const handleAccountsChanged = (accounts) => {
        if (!accounts || accounts.length === 0) {
          setAccount("");
          setIcoContract(null);
          setTokenContract(null);
          setIsOwner(false);
        } else {
          connectWallet();
        }
      };
      window.ethereum.on("chainChanged", handleChainChanged);
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      return () => {
        window.ethereum.removeListener("chainChanged", handleChainChanged);
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      };
    }
  }, []);

  // --------------- Derived State ---------------

  const saleIsActive =
    saleInfo && !saleInfo.finalized && Math.floor(Date.now() / 1000) <= Number(saleInfo.end);

  const approxTokenAllocation =
    myContributionState.clearAmount > 0 && saleInfo && saleInfo.total > 0
      ? Math.floor((myContributionState.clearAmount * tokenMeta.totalSupply) / saleInfo.total)
      : 0;

  // --------------- Render ---------------

  return (
    <div className="min-h-screen relative overflow-hidden text-stone-900">
      {/* Background */}
      <style>{`
        @keyframes subtle-shift {
          0%,100% { transform: translateY(0px); opacity: 0.03; }
          50% { transform: translateY(-10px); opacity: 0.07; }
        }
        .animate-subtle { animation: subtle-shift 22s ease-in-out infinite; }
        .animation-delay-2000 { animation-delay: 6s; }
        .animation-delay-4000 { animation-delay: 12s; }
      `}</style>

      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-stone-50 via-zinc-50 to-stone-200" />
        <div className="absolute inset-0 opacity-90">
          <div className="absolute -top-32 left-1/3 w-[38rem] h-[38rem] bg-gradient-to-br from-stone-200/60 via-amber-100/50 to-transparent rounded-full blur-3xl animate-subtle" />
          <div className="absolute top-1/3 -left-40 w-[32rem] h-[32rem] bg-gradient-to-tr from-zinc-300/60 via-stone-100/40 to-transparent rounded-full blur-3xl animate-subtle animation-delay-2000" />
          <div className="absolute bottom-[-10rem] right-0 w-[40rem] h-[40rem] bg-gradient-to-tl from-stone-900/15 via-amber-200/30 to-transparent rounded-full blur-3xl animate-subtle animation-delay-4000" />
        </div>
      </div>

      <div className="relative z-10 px-4 sm:px-6 lg:px-10 py-4 lg:py-8 max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-stone-200/70">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-stone-900 flex items-center justify-center shadow-lg shadow-stone-900/30">
              <Lock className="w-6 h-6 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900">
                  Private ICO
                </h1>
                <span className="px-2.5 py-1 rounded-full text-[11px] uppercase tracking-[0.18em] bg-amber-100/80 text-amber-900 border border-amber-200">
                  ZAMA FHEVM • Sepolia
                </span>
              </div>
              <p className="text-sm text-stone-600 mt-1">
                Encrypted contributions & token balances using Fully Homomorphic Encryption
              </p>
            </div>
          </div>

          <div className="flex flex-col items-stretch gap-2 w-full sm:w-auto">
            {account ? (
              <div className="flex items-center justify-end gap-2 flex-wrap">
                {isOwner && (
                  <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-stone-900 text-amber-100 border border-stone-800">
                    <Shield className="w-3.5 h-3.5" />
                    Owner
                  </span>
                )}
                <div className="px-3 py-2 rounded-xl bg-white/70 border border-stone-200 shadow-sm backdrop-blur">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-stone-500">Connected</p>
                  <p className="font-mono text-xs text-stone-900">
                    {account.slice(0, 6)}…{account.slice(-4)}
                  </p>
                </div>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-stone-900 text-stone-50 text-sm font-medium shadow-lg shadow-stone-900/30 hover:bg-stone-800 transition"
              >
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </button>
            )}
          </div>
        </header>

        {/* Alerts */}
        {wrongNetwork && (
          <div className="mt-4 flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-200">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-sm font-semibold text-red-900">Wrong network</p>
              <p className="text-xs text-red-800">Switch to Sepolia</p>
            </div>
          </div>
        )}

        {message && (
          <div
            className={`mt-4 p-4 rounded-2xl border text-sm ${
              messageType === "error"
                ? "bg-red-50 border-red-200 text-red-900"
                : messageType === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-blue-50 border-blue-200 text-blue-900"
            }`}
          >
            {message}
          </div>
        )}

        {/* Disconnected State */}
        {!account && (
          <main className="mt-10 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-3xl bg-white/80 border border-stone-200 flex items-center justify-center shadow-md mb-5">
              <Wallet className="w-7 h-7 text-stone-700" />
            </div>
            <h2 className="text-xl font-semibold text-stone-900 mb-2">
              Connect wallet to access Private ICO
            </h2>
            <p className="text-sm text-stone-600 max-w-md mb-6">
              Contributions are stored encrypted on-chain. Only encrypted totals are visible until decryption.
            </p>
            <button
              onClick={connectWallet}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-stone-900 text-stone-50 text-sm font-medium shadow-lg hover:bg-stone-800 transition"
            >
              <Wallet className="w-4 h-4" />
              Connect Wallet
            </button>

            <div className="mt-10 max-w-2xl text-left bg-white/70 border border-stone-200 rounded-3xl p-6 shadow-md backdrop-blur">
              <h3 className="text-sm font-semibold text-stone-900 mb-3 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-stone-700" />
                How it works
              </h3>
              <ol className="list-decimal ml-4 text-xs text-stone-700 space-y-2">
                <li>Connect your wallet on Sepolia testnet</li>
                <li>Contribute ETH - your amount is encrypted on-chain using FHE</li>
                <li>Total raised is computed homomorphically (never decrypted during sale)</li>
                <li>After sale ends, owner can trigger decryption via ZAMA KMS</li>
                <li>Claim your token allocation based on verified contribution</li>
              </ol>
            </div>
          </main>
        )}

        {/* Loading State */}
        {account && !saleInfo && (
          <div className="mt-16 flex flex-col items-center">
            <div className="h-10 w-10 rounded-full border-2 border-stone-900 border-t-transparent animate-spin" />
            <p className="mt-4 text-sm text-stone-600">Loading...</p>
          </div>
        )}

        {/* Main Content */}
        {account && saleInfo && (
          <main className="mt-6 space-y-6">
            {/* Tab Navigation */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("ico")}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  activeTab === "ico"
                    ? "bg-stone-900 text-white"
                    : "bg-white/70 text-stone-700 hover:bg-white"
                }`}
              >
                🔐 ICO
              </button>
              <button
                onClick={() => setActiveTab("tokens")}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  activeTab === "tokens"
                    ? "bg-stone-900 text-white"
                    : "bg-white/70 text-stone-700 hover:bg-white"
                }`}
              >
                💰 Tokens
              </button>
              <button
                onClick={refreshData}
                className="ml-auto px-3 py-2 rounded-xl text-sm bg-white/70 text-stone-700 hover:bg-white transition"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Stats Row */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white/80 border border-stone-200 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase tracking-wider text-stone-500">Time</span>
                  <Clock className="w-3.5 h-3.5 text-stone-500" />
                </div>
                <p className="text-lg font-semibold text-stone-900">{getTimeRemaining()}</p>
              </div>
              <div className="bg-white/80 border border-stone-200 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase tracking-wider text-stone-500">Participants</span>
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <p className="text-lg font-semibold text-stone-900">{contributorsCount}</p>
              </div>
              <div className="bg-white/80 border border-stone-200 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase tracking-wider text-stone-500">Hard Cap</span>
                  <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <p className="text-lg font-semibold text-stone-900">{hardCap ? formatEth(hardCap) : "-"}</p>
              </div>
              <div className="bg-white/80 border border-stone-200 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase tracking-wider text-stone-500">Status</span>
                  {saleInfo.finalized ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <TrendingUp className="w-3.5 h-3.5 text-stone-500" />
                  )}
                </div>
                <p className="text-lg font-semibold text-stone-900">{statusLabel()}</p>
              </div>
            </section>

            {/* ICO Tab */}
            {activeTab === "ico" && (
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-5">
                  {/* Contribute */}
                  {saleIsActive && (
                    <div className="bg-white/85 border border-stone-200 rounded-3xl p-5 shadow-md">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-8 w-8 rounded-xl bg-stone-900 flex items-center justify-center">
                          <Lock className="w-4 h-4 text-amber-100" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-stone-900">Contribute</h3>
                          <p className="text-xs text-stone-500">Amount encrypted on-chain</p>
                        </div>
                      </div>

                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        placeholder="Amount (ETH)"
                        value={contributionEth}
                        onChange={(e) => setContributionEth(e.target.value)}
                        className="w-full mb-3 px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm"
                      />

                      <button
                        onClick={handleContribute}
                        disabled={loading("contribute") || !contributionEth}
                        className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold bg-stone-900 text-white disabled:opacity-60 hover:bg-stone-800 transition"
                      >
                        {loading("contribute") ? "Processing..." : "Submit Contribution"}
                      </button>
                    </div>
                  )}

                  {/* My Contribution */}
                  <div className="bg-white/85 border border-stone-200 rounded-3xl p-5 shadow-md">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-stone-900">My Contribution</h3>
                      <EyeOff className="w-4 h-4 text-stone-500" />
                    </div>

                    {myContributionState.hasContributed ? (
                      <>
                        <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 mb-3">
                          <p className="text-[10px] uppercase text-stone-500 mb-1">Encrypted Handle</p>
                          <p className="font-mono text-[10px] break-all text-stone-800">
                            {myEncryptedContribution || "—"}
                          </p>
                        </div>

                        <div className="flex gap-2 text-[10px] text-stone-600 mb-3">
                          <span className="flex items-center gap-1">
                            <span className={`h-1.5 w-1.5 rounded-full ${myContributionState.amountDecryptable ? "bg-emerald-500" : "bg-stone-400"}`} />
                            {myContributionState.amountDecryptable ? "Decryptable" : "Encrypted"}
                          </span>
                          {myContributionState.clearAmount > 0 && (
                            <span className="ml-auto">
                              Verified: {myContributionState.clearAmount.toLocaleString()} wei
                            </span>
                          )}
                        </div>

                        {saleInfo.finalized && !myContributionState.amountDecryptable && (
                          <button
                            onClick={handleMakeMyDecryptable}
                            disabled={loading("makeMyDecryptable")}
                            className="w-full mb-3 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white disabled:opacity-60 hover:bg-blue-500 transition"
                          >
                            {loading("makeMyDecryptable") ? "Processing..." : "Make Decryptable"}
                          </button>
                        )}

                        {myContributionState.amountDecryptable && myContributionState.clearAmount === 0 && (
                          <div className="space-y-2">
                            <textarea
                              rows={2}
                              placeholder="abiEncodedClearAmount (0x...)"
                              value={myClearBytes}
                              onChange={(e) => setMyClearBytes(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-[10px] font-mono"
                            />
                            <textarea
                              rows={2}
                              placeholder="decryptionProof (0x...)"
                              value={myProof}
                              onChange={(e) => setMyProof(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-[10px] font-mono"
                            />
                            <button
                              onClick={handleVerifyMyContribution}
                              disabled={loading("verifyMy")}
                              className="w-full px-4 py-2 rounded-xl text-xs font-semibold bg-stone-900 text-white disabled:opacity-60 hover:bg-stone-800 transition"
                            >
                              {loading("verifyMy") ? "Verifying..." : "Verify"}
                            </button>
                          </div>
                        )}

                        {saleInfo.finalized && myContributionState.clearAmount > 0 && !myContributionState.tokensClaimed && (
                          <button
                            onClick={handleClaimTokens}
                            disabled={loading("claim")}
                            className="w-full mt-3 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white disabled:opacity-60 hover:bg-emerald-500 transition"
                          >
                            {loading("claim") ? "Claiming..." : `Claim ~${approxTokenAllocation.toLocaleString()} Tokens`}
                          </button>
                        )}

                        {myContributionState.tokensClaimed && (
                          <p className="text-xs text-emerald-700 flex items-center gap-1 mt-2">
                            <CheckCircle className="w-3.5 h-3.5" /> Tokens Claimed
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-stone-500">No contribution yet</p>
                    )}
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-5">
                  {/* Encrypted Total */}
                  <div className="bg-white/85 border border-stone-200 rounded-3xl p-5 shadow-md">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-stone-900">Encrypted Total Raised</h3>
                      <Eye className="w-4 h-4 text-stone-500" />
                    </div>

                    <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 mb-3">
                      <p className="text-[10px] uppercase text-stone-500 mb-1">Ciphertext Handle</p>
                      <p className="font-mono text-[10px] break-all text-stone-800">
                        {encryptedTotal || "—"}
                      </p>
                    </div>

                    {saleInfo.finalized && saleInfo.total > 0 && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                        <p className="text-[10px] uppercase text-emerald-700 mb-1">Verified Total</p>
                        <p className="text-sm font-semibold text-emerald-900">
                          {saleInfo.total.toLocaleString()} wei
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Owner Controls */}
                  {isOwner && (
                    <div className="bg-stone-900 text-white rounded-3xl p-5 shadow-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <KeyRound className="w-4 h-4 text-amber-200" />
                        <h3 className="text-sm font-semibold">Owner Controls</h3>
                      </div>

                      <div className="space-y-3">
                        {!saleInfo.totalDecryptable && (
                          <button
                            onClick={handleMakeTotalDecryptable}
                            disabled={loading("makeTotalDecryptable")}
                            className="w-full px-4 py-2 rounded-xl text-xs font-semibold bg-amber-400 text-stone-900 disabled:opacity-60 hover:bg-amber-300 transition"
                          >
                            {loading("makeTotalDecryptable") ? "Processing..." : "1. Make Total Decryptable"}
                          </button>
                        )}

                        <textarea
                          rows={2}
                          placeholder="abiEncodedClearTotal (0x...)"
                          value={totalClearBytes}
                          onChange={(e) => setTotalClearBytes(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-stone-700 bg-stone-800 text-[10px] font-mono"
                        />
                        <textarea
                          rows={2}
                          placeholder="decryptionProof (0x...)"
                          value={totalProof}
                          onChange={(e) => setTotalProof(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-stone-700 bg-stone-800 text-[10px] font-mono"
                        />

                        <button
                          onClick={handleVerifyAndSetTotal}
                          disabled={loading("verifyTotal")}
                          className="w-full px-4 py-2 rounded-xl text-xs font-semibold bg-white text-stone-900 disabled:opacity-60 hover:bg-stone-100 transition"
                        >
                          {loading("verifyTotal") ? "Verifying..." : "2. Verify & Finalize"}
                        </button>

                        <button
                          onClick={handleCloseSale}
                          disabled={loading("closeSale") || saleInfo.finalized}
                          className="w-full px-4 py-2 rounded-xl text-xs font-semibold bg-red-500 text-white disabled:opacity-60 hover:bg-red-400 transition"
                        >
                          {saleInfo.finalized ? "Finalized" : loading("closeSale") ? "Closing..." : "Force Close Sale"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Tokens Tab */}
            {activeTab === "tokens" && (
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Balance */}
                <div className="space-y-5">
                  <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-white border border-emerald-200 rounded-3xl p-5 shadow-md">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-emerald-700" />
                        <h3 className="text-sm font-semibold text-emerald-900">My Token Balance</h3>
                      </div>
                      <span className="text-xs text-emerald-700 font-medium">{tokenMeta.symbol}</span>
                    </div>

                    <div className="bg-white/90 border border-emerald-200 rounded-xl p-3 mb-3">
                      <p className="text-[10px] uppercase text-emerald-600 mb-1">Encrypted Balance</p>
                      <p className="font-mono text-[10px] break-all text-emerald-900">
                        {encryptedTokenBalance || "—"}
                      </p>
                    </div>

                    {clearTokenBalance > 0 && (
                      <div className="bg-emerald-100 border border-emerald-300 rounded-xl p-3 mb-3">
                        <p className="text-[10px] uppercase text-emerald-700 mb-1">Verified Balance</p>
                        <p className="text-lg font-bold text-emerald-900">
                          {clearTokenBalance.toLocaleString()} {tokenMeta.symbol}
                        </p>
                      </div>
                    )}

                    {hasTokenBalance && !tokenBalanceDecryptable && clearTokenBalance === 0 && (
                      <button
                        onClick={handleMakeBalanceDecryptable}
                        disabled={loading("makeBalanceDecryptable")}
                        className="w-full px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white disabled:opacity-60 hover:bg-emerald-500 transition"
                      >
                        {loading("makeBalanceDecryptable") ? "Processing..." : "Decrypt My Balance"}
                      </button>
                    )}

                    {tokenBalanceDecryptable && clearTokenBalance === 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] text-emerald-700">Paste KMS output:</p>
                        <textarea
                          rows={2}
                          placeholder="abiEncodedClearBalance (0x...)"
                          value={balanceClearBytes}
                          onChange={(e) => setBalanceClearBytes(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-emerald-200 bg-white text-[10px] font-mono"
                        />
                        <textarea
                          rows={2}
                          placeholder="decryptionProof (0x...)"
                          value={balanceProof}
                          onChange={(e) => setBalanceProof(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-emerald-200 bg-white text-[10px] font-mono"
                        />
                        <button
                          onClick={handleVerifyBalance}
                          disabled={loading("verifyBalance")}
                          className="w-full px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-700 text-white disabled:opacity-60 hover:bg-emerald-600 transition"
                        >
                          {loading("verifyBalance") ? "Verifying..." : "Verify Balance"}
                        </button>
                      </div>
                    )}

                    {(tokenBalanceDecryptable || clearTokenBalance > 0) && (
                      <button
                        onClick={handleResetBalanceDecryptable}
                        disabled={loading("resetBalance")}
                        className="w-full mt-2 px-4 py-2 rounded-xl text-xs font-medium bg-stone-200 text-stone-700 disabled:opacity-60 hover:bg-stone-300 transition"
                      >
                        Reset Decryptable Status
                      </button>
                    )}
                  </div>
                </div>

                {/* Right: Token Info */}
                <div className="space-y-5">
                  <div className="bg-white/85 border border-stone-200 rounded-3xl p-5 shadow-md">
                    <h3 className="text-sm font-semibold text-stone-900 mb-3">Token Info</h3>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-2 border-b border-stone-100">
                        <span className="text-stone-500">Name</span>
                        <span className="font-medium text-stone-900">{tokenMeta.name}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-stone-100">
                        <span className="text-stone-500">Symbol</span>
                        <span className="font-medium text-stone-900">{tokenMeta.symbol}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-stone-100">
                        <span className="text-stone-500">Total Supply</span>
                        <span className="font-medium text-stone-900">
                          {tokenMeta.totalSupply.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-stone-500">Contract</span>
                        <span className="font-mono text-[10px] text-stone-700">
                          {TOKEN_ADDRESS.slice(0, 10)}...
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 shadow-md">
                    <h3 className="text-sm font-semibold text-amber-900 mb-2">FHE Features</h3>
                    <ul className="text-xs text-amber-800 space-y-1">
                      <li>✅ Encrypted token balances (euint64)</li>
                      <li>✅ Homomorphic transfers (add/subtract)</li>
                      <li>✅ Encrypted ICO total raised</li>
                      <li>✅ KMS decryption with proof verification</li>
                      <li>✅ Permission-based access control</li>
                    </ul>
                  </div>
                </div>
              </section>
            )}

            {/* Footer */}
            <footer className="pt-4 border-t border-stone-200/70 mt-4">
              <p className="text-[10px] text-stone-500">
                Built on ZAMA FHEVM • Fully Homomorphic Encryption • React + ethers.js
              </p>
              <p className="text-[10px] text-stone-400 mt-1">
                ICO: <span className="font-mono">{ICO_ADDRESS}</span> · Token:{" "}
                <span className="font-mono">{TOKEN_ADDRESS}</span>
              </p>
            </footer>
          </main>
        )}
      </div>
    </div>
  );
}


