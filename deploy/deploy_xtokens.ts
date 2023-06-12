import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { config as dotEnvConfig } from "dotenv";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Wallet } from "zksync-web3";
import { XesImpl__factory } from "../typechain";
import { XTokenLike } from "./../utils/interfaces";
import { getConfig } from "./config/chain_config";
import { XTOKEN_DEPLOY_ARGS } from "./config/deployment_config";
import { deployXTokens } from "./utils/deploy";

dotEnvConfig();

// Import chain config.
const chainConfig = getConfig();

// ▄▄ ▄▄ ▄▄  ▄▀█ ▀█▀ ▀█▀ █▀▀ █▄░█ ▀█▀ █ █▀█ █▄░█ █  ▄▄ ▄▄ ▄▄
// ░░ ░░ ░░  █▀█ ░█░ ░█░ ██▄ █░▀█ ░█░ █ █▄█ █░▀█ ▄  ░░ ░░ ░░
const deployerWallet = new Wallet(process.env.DEPLOYER_PK as string);
const xesAddress = chainConfig.Xes;
let xTokenDeployArgs = XTOKEN_DEPLOY_ARGS;
// ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄
// ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░

export default async function (hre: HardhatRuntimeEnvironment) {
  // Create deployer object and load the artifact of the contract we want to deploy.
  const deployer = new Deployer(hre, deployerWallet);
  console.log("# Deployer address:", deployer.zkWallet.address);

  // connect xes
  const xesAsDeployer = XesImpl__factory.connect(xesAddress, deployer.zkWallet);

  // deploy xTokens
  let xTokens: Record<string, XTokenLike> = await deployXTokens(
    xTokenDeployArgs,
    xesAsDeployer,
    deployer
  );
  console.log("# xTokens deployment summary:");
  for (let symbol in xTokens) {
    console.log(
      `# xToken ${await xTokens[symbol].symbol()} deployed at: ${
        xTokens[symbol].address
      }`
    );
  }
}
