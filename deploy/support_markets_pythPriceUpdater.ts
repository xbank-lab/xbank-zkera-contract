import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { config as dotEnvConfig } from "dotenv";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Wallet } from "zksync-web3";
import { PythPriceUpdater__factory } from "./../typechain/factories/contracts/Oracles/PythPriceUpdater__factory";
import { getConfig } from "./config/chain_config";

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
const pythPriceUpdaterAddress = chainConfig.pythPriceUpdater;
const xTokenPyths: XTokenPyth[] = [
  {
    symbol: "xUSDC",
    address: chainConfig.markets.xUSDC,
    pythID: chainConfig.pythIDs.USDC,
  },
  {
    symbol: "xETH",
    address: chainConfig.markets.xETH,
    pythID: chainConfig.pythIDs.ETH,
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

  const pythPriceUpdaterAsDeployer = PythPriceUpdater__factory.connect(
    pythPriceUpdaterAddress,
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
