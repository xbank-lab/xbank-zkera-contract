import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { config as dotEnvConfig } from "dotenv";
import { BigNumber, utils } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Wallet } from "zksync-web3";
import { XTokenBase__factory, XesImpl__factory } from "../typechain";
import { getConfig } from "./config/chain_config";

dotEnvConfig();

// Import chain config.
const chainConfig = getConfig();

interface XTokenBorrowPaused {
  symbol: string;
  address: string;
  paused: boolean;
}

// ▄▄ ▄▄ ▄▄  ▄▀█ ▀█▀ ▀█▀ █▀▀ █▄░█ ▀█▀ █ █▀█ █▄░█ █  ▄▄ ▄▄ ▄▄
// ░░ ░░ ░░  █▀█ ░█░ ░█░ ██▄ █░▀█ ░█░ █ █▄█ █░▀█ ▄  ░░ ░░ ░░
const deployerWallet = new Wallet(process.env.DEPLOYER_PK as string);
const xesAddress = chainConfig.Xes;
const xTokens: XTokenBorrowPaused[] = [
  {
    symbol: "xUSDC",
    address: chainConfig.markets.xUSDC,
    paused: true,
  },
];
// ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄
// ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░

export default async function (hre: HardhatRuntimeEnvironment) {
  // Create deployer object and load the artifact of the contract we want to deploy.
  const deployer = new Deployer(hre, deployerWallet);
  console.log("# Deployer address:", deployer.zkWallet.address);

  const xesAsDeployer = XesImpl__factory.connect(xesAddress, deployer.zkWallet);

  // set BorrowPaused for xTokens at xes
  for (let xToken of xTokens) {
    const tx = await xesAsDeployer._setBorrowPaused(
      xToken.address,
      xToken.paused
    );
    await tx.wait();
    const borrowGuardianPaused = await xesAsDeployer.borrowGuardianPaused(
      xToken.address
    );
    console.log(
      `# update xes borrowGuardianPaused for ${await xToken.symbol} to ${borrowGuardianPaused}`
    );
  }
}
