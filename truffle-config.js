const path = require("path");
const HDWalletProvider = require("@truffle/hdwallet-provider");
require("dotenv").config(); // To load .env variables

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1", // Localhost
      port: 7545,        // Port that Ganache is running on
      network_id: "5777" // Network ID of Ganache
    },

    // Sepolia testnet
    sepolia: {
      provider: () => new HDWalletProvider(
        process.env.MNEMONIC, // Your mnemonic key
        `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}` // Infura URL
      ),
      network_id: 11155111,  // Sepolia's id
      gas: 5500000,          // Gas limit
      gasPrice: 10000000000, // 10 Gwei
      confirmations: 2,      // # of confirmations to wait between deployments
      timeoutBlocks: 200,    // # of blocks before a deployment times out
      skipDryRun: true       // Skip dry run before migrations
    }
  },

  // Set default mocha options here, use special reporters, etc.
  mocha: {
    // timeout: 100000
  },

  // Configure your Solidity compiler
  compilers: {
    solc: {
      version: "0.8.18",    // Fetch exact version from solc-bin (default: truffle's version)
      settings: {
        optimizer: {
          enabled: true,    // Enable optimization
          runs: 200         // Optimize for how many times you intend to run the code
        },
      }
    }
  },

  // Optional: Truffle DB is a new feature to keep track of your contracts
  db: {
    enabled: false
  },

  // Directory settings for contract builds
  contracts_build_directory: path.join(__dirname, "client/src/contracts") // So frontend can access ABIs
};
