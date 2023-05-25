import { XesImpl__factory } from "./../typechain/factories/contracts/Xes/XesImpl__factory";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { config as dotEnvConfig } from "dotenv";
import { BigNumber, utils } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Wallet } from "zksync-web3";
import { XTokenBase__factory } from "../typechain";
import { getConfig } from "./config/chain_config";

dotEnvConfig();

// Import chain config.
const chainConfig = getConfig();

interface xTokenReserveFactor {
  symbol: string;
  address: string;
  reserveFactor: BigNumber;
}

// ▄▄ ▄▄ ▄▄  ▄▀█ ▀█▀ ▀█▀ █▀▀ █▄░█ ▀█▀ █ █▀█ █▄░█ █  ▄▄ ▄▄ ▄▄
// ░░ ░░ ░░  █▀█ ░█░ ░█░ ██▄ █░▀█ ░█░ █ █▄█ █░▀█ ▄  ░░ ░░ ░░
const deployerWallet = new Wallet(process.env.DEPLOYER_PK as string);
const xesAddress = "0x...";
const newPriceOracle = "0x...";
// ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄
// ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░

export default async function (hre: HardhatRuntimeEnvironment) {
  let tx;

  // Create deployer object and load the artifact of the contract we want to deploy.
  const deployer = new Deployer(hre, deployerWallet);
  console.log("# Deployer address:", deployer.zkWallet.address);

  const xesAsDeployer = XesImpl__factory.connect(xesAddress, deployer.zkWallet);
  const oldPriceOracle = await xesAsDeployer.oracle();

  // update priceOracle
  tx = await xesAsDeployer._setPriceOracle(newPriceOracle);
  await tx.wait();
  console.log(
    `# update xes ${
      xesAsDeployer.address
    } priceOracle from ${oldPriceOracle} to ${await xesAsDeployer.oracle()}`
  );
}
