import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { config as dotEnvConfig } from "dotenv";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Wallet } from "zksync-web3";
import { Multicall } from "../typechain";
import { deployMulticall } from "./utils/deploy";

dotEnvConfig();

// Initialize deployer wallet.
const deployerWallet = new Wallet(process.env.DEPLOYER_PK as string);

// An example of a deploy script that will deploy and call a simple contract.
export default async function (hre: HardhatRuntimeEnvironment) {
  let multicall: Multicall;

  // Create deployer object and load the artifact of the contract we want to deploy.
  const deployer = new Deployer(hre, deployerWallet);
  console.log("# Deployer address:", deployer.zkWallet.address);

  // deploy multicall
  multicall = await deployMulticall(deployer);
  console.log(`# Multicall deployed at: ${multicall.address}`);
}
