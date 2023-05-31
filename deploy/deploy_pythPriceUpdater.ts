import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { config as dotEnvConfig } from "dotenv";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Wallet } from "zksync-web3";
import { PythPriceUpdater__factory } from "./../typechain/factories/contracts/Oracles/PythPriceUpdater__factory";
import { getConfig } from "./config/chain_config";
import { deployPythPriceUpdater } from "./utils/deploy";

dotEnvConfig();

// Import chain config.
const chainConfig = getConfig();
interface XTokenPyth {
  symbol: string;
  address: string;
  pythID: string;
}

// ▄▄ ▄▄ ▄▄  ▄▀█ ▀█▀ ▀█▀ █▀▀ █▄░█ ▀█▀ █ █▀█ █▄░█ █  ▄▄ ▄▄ ▄▄
// ░░ ░░ ░░  █▀█ ░█░ ░█░ ██▄ █░▀█ ░█░ █ █▄█ █░▀█ ▄  ░░ ░░ ░░
const deployerWallet = new Wallet(process.env.DEPLOYER_PK as string);
const pythContract = chainConfig.pyth;
const xTokenPyths: XTokenPyth[] = [
  {
    symbol: "xUSDC",
    address: chainConfig.markets.xUSDC,
    pythID: chainConfig.pythIDs.USDC,
  },
  {
    symbol: "xETH",
    address: chainConfig.markets.xETH,
    pythID: chainConfig.pythIDs.ETH,
  },
];
// ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄
// ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░

// An example of a deploy script that will deploy and call a simple contract.
export default async function (hre: HardhatRuntimeEnvironment) {
  let tx;

  // Create deployer object and load the artifact of the contract we want to deploy.
  const deployer = new Deployer(hre, deployerWallet);
  console.log("# Deployer address:", deployer.zkWallet.address);

  // deploy price oracle
  const pythPriceUpdater = await deployPythPriceUpdater(deployer, pythContract);
  console.log(`# PythPriceUpdater deployed at: ${pythPriceUpdater.address}`);
  console.log(
    `# PythPriceUpdater using Pyth contract: ${await pythPriceUpdater.pyth()}`
  );
}
