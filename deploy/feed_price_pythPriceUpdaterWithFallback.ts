import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { EvmPriceServiceConnection } from "@pythnetwork/pyth-evm-js";
import { config as dotEnvConfig } from "dotenv";
import { BigNumber } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Wallet } from "zksync-web3";
import { PythPriceUpdater__factory } from "../typechain/factories/contracts/Oracles/PythPriceUpdater__factory";
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
const pythPriceUpdaterWithFallbackAddress =
  chainConfig.pythPriceUpdaterWithFallback;
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

  const pythPriceUpdaterWithFallbackAsDeployer =
    PythPriceUpdater__factory.connect(
      pythPriceUpdaterWithFallbackAddress,
      deployer.zkWallet
    );

  // estimate updateFee
  const updateFee =
    await pythPriceUpdaterWithFallbackAsDeployer.getPythUpdateFee(
      priceUpdateData
    );

  // update from priceUpdateData
  tx = await pythPriceUpdaterWithFallbackAsDeployer.setPythPrices(
    priceUpdateData,
    {
      value: BigNumber.from(updateFee),
    }
  );
  await tx.wait();

  for (let xTokenPyth of xTokenPyths) {
    console.log(
      `underlying price (Xes format) ${
        xTokenPyth.symbol
      } = ${await pythPriceUpdaterWithFallbackAsDeployer.getUnderlyingPrice(
        xTokenPyth.address
      )}`
    );
  }
}
