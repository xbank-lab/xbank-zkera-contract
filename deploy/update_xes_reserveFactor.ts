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

interface XTokenReserveFactor {
  symbol: string;
  address: string;
  reserveFactor: BigNumber;
}

// ▄▄ ▄▄ ▄▄  ▄▀█ ▀█▀ ▀█▀ █▀▀ █▄░█ ▀█▀ █ █▀█ █▄░█ █  ▄▄ ▄▄ ▄▄
// ░░ ░░ ░░  █▀█ ░█░ ░█░ ██▄ █░▀█ ░█░ █ █▄█ █░▀█ ▄  ░░ ░░ ░░
const deployerWallet = new Wallet(process.env.DEPLOYER_PK as string);
const xTokens: XTokenReserveFactor[] = [
  // {
  //   symbol: "xUSDC",
  //   address: chainConfig.markets.xUSDC,
  //   reserveFactor: utils.parseUnits("0.15", 18), // 15%
  // },
  // {
  //   symbol: "xETH",
  //   address: chainConfig.markets.xETH,
  //   reserveFactor: utils.parseUnits("0.15", 18), // 15%
  // },
  {
    symbol: "xWBTC",
    address: chainConfig.markets.xWBTC,
    reserveFactor: utils.parseUnits("0.15", 18), // 15%
  },
];
// ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄
// ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░

export default async function (hre: HardhatRuntimeEnvironment) {
  // Create deployer object and load the artifact of the contract we want to deploy.
  const deployer = new Deployer(hre, deployerWallet);
  console.log("# Deployer address:", deployer.zkWallet.address);

  // set reserveFactor for xTokens
  for (let xToken of xTokens) {
    const xTokenAsDeployer = XTokenBase__factory.connect(
      xToken.address,
      deployer.zkWallet
    );
    const prevReserveFactor = await xTokenAsDeployer.reserveFactorMantissa();
    const tx = await xTokenAsDeployer._setReserveFactor(xToken.reserveFactor);
    await tx.wait();
    const newReserveFactor = await xTokenAsDeployer.reserveFactorMantissa();
    console.log(
      `# update ${await xTokenAsDeployer.symbol()} reserveFactor from ${prevReserveFactor} to ${newReserveFactor}`
    );
  }
}
