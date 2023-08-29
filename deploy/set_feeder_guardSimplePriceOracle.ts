import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { config as dotEnvConfig } from "dotenv";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Wallet } from "zksync-web3";
import { getConfig } from "./config/chain_config";
import {
  GuardSimplePriceOracle__factory,
  PythPriceUpdaterWithFallback__factory,
} from "../typechain";

dotEnvConfig();

// Import chain config.
const chainConfig = getConfig();

// ▄▄ ▄▄ ▄▄  ▄▀█ ▀█▀ ▀█▀ █▀▀ █▄░█ ▀█▀ █ █▀█ █▄░█ █  ▄▄ ▄▄ ▄▄
// ░░ ░░ ░░  █▀█ ░█░ ░█░ ██▄ █░▀█ ░█░ █ █▄█ █░▀█ ▄  ░░ ░░ ░░
const deployerWallet = new Wallet(process.env.DEPLOYER_PK as string);
const guardSimplePriceOracleAddress = chainConfig.guardSimplePriceOracle;
const feeder = chainConfig.pythPriceUpdaterWithFallback;
const isFeeder = true;
// ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄
// ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░

// An example of a deploy script that will deploy and call a simple contract.
export default async function (hre: HardhatRuntimeEnvironment) {
  let tx;

  // Create deployer object and load the artifact of the contract we want to deploy.
  const deployer = new Deployer(hre, deployerWallet);
  console.log("# Deployer address:", deployer.zkWallet.address);

  const guardSimplePriceOracleAsDeployer =
    GuardSimplePriceOracle__factory.connect(
      guardSimplePriceOracleAddress,
      deployer.zkWallet
    );

  tx = await guardSimplePriceOracleAsDeployer.setFeeder(feeder, isFeeder);
  await tx.wait();
  console.log(`# Set feeder ${feeder} allow to update price: ${isFeeder}`);
}
