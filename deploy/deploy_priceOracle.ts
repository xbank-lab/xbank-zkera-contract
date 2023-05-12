import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { config as dotEnvConfig } from "dotenv";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Wallet } from "zksync-web3";
import { deploySimplePriceOracle } from "./utils/deploy";

dotEnvConfig();

// REVIEW VARIABLES CAREFULLY
const deployerWallet = new Wallet(process.env.DEPLOYER_PK as string);

// An example of a deploy script that will deploy and call a simple contract.
export default async function (hre: HardhatRuntimeEnvironment) {
  // Create deployer object and load the artifact of the contract we want to deploy.
  const deployer = new Deployer(hre, deployerWallet);
  console.log("# Deployer address:", deployer.zkWallet.address);

  // deploy price oracle
  const simplePriceOracle = await deploySimplePriceOracle(deployer);
  console.log(`# PriceOracle deployed at: ${simplePriceOracle.address}`);
}
