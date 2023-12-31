import fs from "fs";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-etherscan";
import "hardhat-preprocessor";
import "@nomicfoundation/hardhat-network-helpers";
import "@typechain/hardhat";

import "@matterlabs/hardhat-zksync-deploy";
import "@matterlabs/hardhat-zksync-solc";
import "@matterlabs/hardhat-zksync-toolbox";
import "@matterlabs/hardhat-zksync-chai-matchers";
import "@matterlabs/hardhat-zksync-verify";
import "@matterlabs/hardhat-zksync-upgradable";

import dotEnv from "dotenv";

dotEnv.config();

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
        ethNetwork: process.env.GOERLI_RPC_URL ?? "",
        zksync: true,
        verifyURL:
          "https://zksync2-testnet-explorer.zksync.dev/contract_verification",
      };

function getRemappings() {
  return fs
    .readFileSync("remappings.txt", "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => line.trim().split("="));
}

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
    version: "1.3.10",
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
      ethNetwork: process.env.MAINNET_RPC_URL ?? "",
      zksync: true,
    },
  },
  mocha: {
    timeout: 100000000,
  },
  paths: {
    sources: "./contracts",
  },
  // This fully resolves paths for imports in the ./lib directory for Hardhat
  preprocess: {
    eachLine: () => ({
      transform: (line: string) => {
        if (line.match(/^\s*import /i)) {
          getRemappings().forEach(([find, replace]) => {
            if (line.match(find)) {
              line = line.replace(find, replace);
            }
          });
        }
        return line;
      },
    }),
  },
  etherscan: {
    apiKey: "XAAE5BNRFXISSGYYJJTQW1JRZKVU16Y8DX", //<Your API key for Etherscan>,
  },
};
