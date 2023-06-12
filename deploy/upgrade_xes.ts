import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { config as dotEnvConfig } from "dotenv";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Wallet } from "zksync-web3";
import { deployXes } from "./utils/deploy";
import { XesImpl__factory, XesProxy__factory } from "../typechain";
import { getConfig } from "./config/chain_config";

dotEnvConfig();

// Import chain config.
const chainConfig = getConfig();

// ▄▄ ▄▄ ▄▄  ▄▀█ ▀█▀ ▀█▀ █▀▀ █▄░█ ▀█▀ █ █▀█ █▄░█ █  ▄▄ ▄▄ ▄▄
// ░░ ░░ ░░  █▀█ ░█░ ░█░ ██▄ █░▀█ ░█░ █ █▄█ █░▀█ ▄  ░░ ░░ ░░
const deployerWallet = new Wallet(process.env.DEPLOYER_PK as string);
const xesProxyAddress = chainConfig.Xes;
// ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄
// ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░

export default async function (hre: HardhatRuntimeEnvironment) {
  // Create deployer object and load the artifact of the contract we want to deploy.
  const deployer = new Deployer(hre, deployerWallet);
  console.log("# Deployer address:", deployer.zkWallet.address);

  // deploy impl contracts
  const implArtifact = await deployer.loadArtifact(
    "contracts/Xes/XesImpl.sol:XesImpl"
  );
  const implContract = await deployer.deploy(implArtifact);
  console.log("# Xes impl deployed at:", implContract.address);

  // deploy proxy contracts
  const xesProxyAsDeployer = XesProxy__factory.connect(
    xesProxyAddress,
    deployer.zkWallet
  );

  // set proxy impl contract
  const setPendingImplTx = await xesProxyAsDeployer._setPendingImplementation(
    implContract.address
  );
  await setPendingImplTx.wait();
  const becomeTx = await implContract._become(xesProxyAsDeployer.address);
  await becomeTx.wait();

  console.log(
    `# Xes proxy (${xesProxyAddress})'s implementation updated to: ${implContract.address}`
  );
}
