import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { config as dotEnvConfig } from "dotenv";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Wallet } from "zksync-web3";
import { INTEREST_RATE_MODEL } from "./config/deployment_config";
import { deployBaseJumpRateModelV2 } from "./utils/deploy";

dotEnvConfig();

// REVIEW VARIABLES CAREFULLY
const deployerWallet = new Wallet(process.env.DEPLOYER_PK as string);
const interestModelConfig = INTEREST_RATE_MODEL.IRM_ETH_Updateable;

export default async function (hre: HardhatRuntimeEnvironment) {
  // Create deployer object and load the artifact of the contract we want to deploy.
  const deployer = new Deployer(hre, deployerWallet);
  console.log("# Deployer address:", deployer.zkWallet.address);

  // deploy interest model
  const baseJumpRateModelV2_ETH = await deployBaseJumpRateModelV2(
    deployer,
    interestModelConfig
  );
  console.log(
    `# BaseJumpRateModelV2_ETH deployed at: ${baseJumpRateModelV2_ETH.address}`
  );
}
