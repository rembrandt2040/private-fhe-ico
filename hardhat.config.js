require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-chai-matchers");
require("@nomiclabs/hardhat-ethers");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true, // Required for FHE operations
    },
  },
  networks: {
    // ZAMA Ethereum testnet
    zamaTestnet: {
      url: process.env.ZAMA_RPC_URL || "https://devnet.zama.ai",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 8009,
      gasPrice: "auto",
    },
    // Local hardhat network for testing
    hardhat: {
      chainId: 31337,
      allowUnlimitedContractSize: true,
    },
    // Localhost for local development
    localhost: {
      url: "http://127.0.0.1:8545",
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    outputFile: "gas-report.txt",
    noColors: true,
  },
  etherscan: {
    apiKey: {
      zamaTestnet: process.env.ZAMA_EXPLORER_API_KEY || "",
    },
    customChains: [
      {
        network: "zamaTestnet",
        chainId: 8009,
        urls: {
          apiURL: "https://explorer.zama.ai/api",
          browserURL: "https://explorer.zama.ai",
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 40000, // Longer timeout for FHE operations
  },
};
