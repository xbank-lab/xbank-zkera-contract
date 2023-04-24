import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-etherscan";
import "@nomicfoundation/hardhat-network-helpers";
import "@typechain/hardhat";

import "@matterlabs/hardhat-zksync-deploy";
import "@matterlabs/hardhat-zksync-solc";
import "@matterlabs/hardhat-zksync-toolbox";
import "@matterlabs/hardhat-zksync-chai-matchers";
import "@matterlabs/hardhat-zksync-verify";

const chainIds = {
  goerli: 5,
  hardhat: 31337,
  kovan: 42,
  mainnet: 1,
  rinkeby: 4,
  ropsten: 3,
};

const zkSyncTestnet =
  process.env.NODE_ENV == "local"
    ? {
        url: "http://localhost:3050",
        ethNetwork: "http://localhost:8545",
        zksync: true,
      }
    : {
        url: "https://zksync2-testnet.zksync.dev",
        ethNetwork: "goerli",
        zksync: true,
        verifyURL:
          "https://zksync2-testnet-explorer.zksync.dev/contract_verification",
      };

module.exports = {
  // defaultNetwork: "zkSyncTestnet",
  solidity: {
    version: "0.8.10",
  },
  typechain: {
    outDir: "./typechain",
    target: process.env.TYPECHAIN_TARGET || "ethers-v5",
  },
  zksolc: {
    version: "1.3.5",
    compilerSource: "binary",
    settings: {},
  },
  networks: {
    hardhat: {
      zksync: true,
    },
    goerli: {
      url: "https://goerli.com/api/{apiKey}",
      zksync: false,
    },
    mainnet: {
      url: "https://ethereum.mainnet.com/api/{apiKey}",
      zksync: false,
    },
    zkSyncTestnet,
    zkSyncMainnet: {
      url: "https://mainnet.era.zksync.io",
      ethNetwork: "mainnet",
      zksync: true,
    },
  },
  mocha: {
    timeout: 100000000,
  },
  etherscan: {
    apiKey: "", //<Your API key for Etherscan>,
  },
};
