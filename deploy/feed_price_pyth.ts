import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { EvmPriceServiceConnection } from "@pythnetwork/pyth-evm-js";
import { config as dotEnvConfig } from "dotenv";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Wallet } from "zksync-web3";
import { IPyth__factory } from "./../typechain/factories/@pythnetwork/pyth-sdk-solidity/IPyth__factory";
import { getConfig } from "./config/chain_config";
import { BigNumber } from "ethers";

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
const pythAddress = chainConfig.pyth;
const pythNetworkEndpoint = chainConfig.pythNetworkEndpoint;

// uncomment to exclude some token price feed
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
  {
    symbol: "xWBTC",
    address: chainConfig.markets.xWBTC,
    pythID: chainConfig.pythIDs.WBTC,
  },
];
// ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄
// ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░

// An example of a deploy script that will deploy and call a simple contract.
export default async function (hre: HardhatRuntimeEnvironment) {
  let tx;
  const connection = new EvmPriceServiceConnection(pythNetworkEndpoint);

  // Create deployer object and load the artifact of the contract we want to deploy.
  const deployer = new Deployer(hre, deployerWallet);
  console.log("# Deployer address:", deployer.zkWallet.address);

  const priceIDs = xTokenPyths.map((xTokenPyth) => xTokenPyth.pythID);
  const priceUpdateData = await connection.getPriceFeedsUpdateData(priceIDs);

  const pyth = IPyth__factory.connect(pythAddress, deployer.zkWallet);
  const updateFee = await pyth.getUpdateFee(priceUpdateData);
  console.log(`updateFee: ${updateFee.toString()}`);

  // update Pyth price directly
  tx = await pyth.updatePriceFeeds(priceUpdateData, {
    value: BigNumber.from(updateFee),
  });
  await tx.wait();
}
