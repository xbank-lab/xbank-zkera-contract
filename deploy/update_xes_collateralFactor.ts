import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { config as dotEnvConfig } from "dotenv";
import { BigNumber, utils } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Wallet } from "zksync-web3";
import { XesImpl__factory } from "../typechain";
import { getConfig } from "./config/chain_config";

dotEnvConfig();

// Import chain config.
const chainConfig = getConfig();

interface xTokenCollateralFactor {
  symbol: string;
  address: string;
  collateralFactor: BigNumber;
}

// ▄▄ ▄▄ ▄▄  ▄▀█ ▀█▀ ▀█▀ █▀▀ █▄░█ ▀█▀ █ █▀█ █▄░█ █  ▄▄ ▄▄ ▄▄
// ░░ ░░ ░░  █▀█ ░█░ ░█░ ██▄ █░▀█ ░█░ █ █▄█ █░▀█ ▄  ░░ ░░ ░░
const deployerWallet = new Wallet(process.env.DEPLOYER_PK as string);
const xesAddress = chainConfig.Xes;
const xTokenCollateralFactors: xTokenCollateralFactor[] = [
  // {
  //   symbol: "xUSDC",
  //   address: chainConfig.markets.xUSDC,
  //   collateralFactor: utils.parseUnits("0.855", 18), // 85.5%
  // },
  // {
  //   symbol: "xETH",
  //   address: chainConfig.markets.xETH,
  //   collateralFactor: utils.parseUnits("0.825", 18), // 82.5%
  // },
  {
    symbol: "xWBTC",
    address: chainConfig.markets.xWBTC,
    collateralFactor: utils.parseUnits("0.825", 18), // 82.5%
  },
];
// ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄
// ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░

export default async function (hre: HardhatRuntimeEnvironment) {
  let tx;

  // Create deployer object and load the artifact of the contract we want to deploy.
  const deployer = new Deployer(hre, deployerWallet);
  console.log("# Deployer address:", deployer.zkWallet.address);

  // connect contracts
  const xesAsDeployer = XesImpl__factory.connect(xesAddress, deployer.zkWallet);

  for (let xToken of xTokenCollateralFactors) {
    tx = await xesAsDeployer._setCollateralFactor(
      xToken.address,
      xToken.collateralFactor
    );
    tx.wait();
    console.log(
      `# Updated ${
        xToken.address
      } collateralFactor to ${xToken.collateralFactor.toString()}`
    );
  }
}
