import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { config as dotEnvConfig } from "dotenv";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Wallet } from "zksync-web3";
import { PythPriceUpdater__factory } from "../typechain/factories/contracts/Oracles/PythPriceUpdater__factory";
import { getConfig } from "./config/chain_config";
import { deployPythPriceUpdater } from "./utils/deploy";
import { EvmPriceServiceConnection } from "@pythnetwork/pyth-evm-js";
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
const pythPriceUpdaterAddress = chainConfig.pythPriceUpdater;
const pythNetworkEndpoint = chainConfig.pythNetworkEndpoint;
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

  const connection = new EvmPriceServiceConnection(pythNetworkEndpoint);

  // Create deployer object and load the artifact of the contract we want to deploy.
  const deployer = new Deployer(hre, deployerWallet);
  console.log("# Deployer address:", deployer.zkWallet.address);

  const priceIDs = xTokenPyths.map((xTokenPyth) => xTokenPyth.pythID);
  const priceUpdateData = await connection.getPriceFeedsUpdateData(priceIDs);

  const pythPriceUpdaterAsDeployer = PythPriceUpdater__factory.connect(
    pythPriceUpdaterAddress,
    deployer.zkWallet
  );

  // estimate updateFee
  const updateFee = await pythPriceUpdaterAsDeployer.getPythUpdateFee(
    priceUpdateData
  );

  // update from priceUpdateData
  tx = await pythPriceUpdaterAsDeployer.setPythPrices(priceUpdateData, {
    value: BigNumber.from(updateFee),
  });
  await tx.wait();

  for (let xTokenPyth of xTokenPyths) {
    console.log(
      `underlying price (Xes format) ${
        xTokenPyth.symbol
      } = ${await pythPriceUpdaterAsDeployer.getUnderlyingPrice(
        xTokenPyth.address
      )}`
    );
  }
}
