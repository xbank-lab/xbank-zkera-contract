import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { config as dotEnvConfig } from "dotenv";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Wallet } from "zksync-web3";
import { getConfig } from "./config/chain_config";
import { PythPriceUpdaterWithFallback__factory } from "../typechain";

dotEnvConfig();

// Import chain config.
const chainConfig = getConfig();
interface XTokenPyth {
  symbol: string;
  address: string;
  pythID: string;
}

// ▄▄ ▄▄ ▄▄  ▄▀█ ▀█▀ ▀█▀ █▀▀ █▄░█ ▀█▀ █ █▀█ █▄░█ █  ▄▄ ▄▄ ▄▄
// ░░ ░░ ░░  █▀█ ░█░ ░█░ ██▄ █░▀█ ░█░ █ █▄█ █░▀█ ▄  ░░ ░░ ░░
const deployerWallet = new Wallet(process.env.DEPLOYER_PK as string);
const pythPriceUpdaterWithFallbackAddress =
  chainConfig.pythPriceUpdaterWithFallback;
const xTokenPyths: XTokenPyth[] = [
  // {
  //   symbol: "xUSDC",
  //   address: chainConfig.markets.xUSDC,
  //   pythID: chainConfig.pythIDs.USDC,
  // },
  // {
  //   symbol: "xETH",
  //   address: chainConfig.markets.xETH,
  //   pythID: chainConfig.pythIDs.ETH,
  // },
  {
    symbol: "xWBTC",
    address: chainConfig.markets.xWBTC,
    pythID: chainConfig.pythIDs.wBTC,
  },
];
// ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄
// ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░

// An example of a deploy script that will deploy and call a simple contract.
export default async function (hre: HardhatRuntimeEnvironment) {
  let tx;

  // Create deployer object and load the artifact of the contract we want to deploy.
  const deployer = new Deployer(hre, deployerWallet);
  console.log("# Deployer address:", deployer.zkWallet.address);

  console.log(xTokenPyths);

  const pythPriceUpdaterAsDeployer =
    PythPriceUpdaterWithFallback__factory.connect(
      pythPriceUpdaterWithFallbackAddress,
      deployer.zkWallet
    );
  for (let xTokenPyth of xTokenPyths) {
    tx = await pythPriceUpdaterAsDeployer.supportMarket(
      xTokenPyth.address,
      xTokenPyth.pythID
    );
    await tx.wait();
    console.log(
      `# Support market ${xTokenPyth.symbol} (${xTokenPyth.address}) with PythID: ${xTokenPyth.pythID}`
    );
  }
}
