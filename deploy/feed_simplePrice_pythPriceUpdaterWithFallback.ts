import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { EvmPriceServiceConnection } from "@pythnetwork/pyth-evm-js";
import { config as dotEnvConfig } from "dotenv";
import { BigNumber } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Wallet } from "zksync-web3";
import { getConfig } from "./config/chain_config";
import {
  Erc20Interface__factory,
  PythPriceUpdaterWithFallback__factory,
  XTokenBase__factory,
} from "../typechain";
import { parseUnits } from "ethers/lib/utils";

dotEnvConfig();

// Import chain config.
const chainConfig = getConfig();

// ▄▄ ▄▄ ▄▄  ▄▀█ ▀█▀ ▀█▀ █▀▀ █▄░█ ▀█▀ █ █▀█ █▄░█ █  ▄▄ ▄▄ ▄▄
// ░░ ░░ ░░  █▀█ ░█░ ░█░ ██▄ █░▀█ ░█░ █ █▄█ █░▀█ ▄  ░░ ░░ ░░
const deployerWallet = new Wallet(process.env.DEPLOYER_PK as string);
const pythPriceUpdaterWithFallbackAddress =
  chainConfig.pythPriceUpdaterWithFallback;
const xtokenAddress = chainConfig.markets.xTVERCC;
const underlyingPriceUSD = "1";
// ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄
// ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░

// An example of a deploy script that will deploy and call a simple contract.
export default async function (hre: HardhatRuntimeEnvironment) {
  // Create deployer object and load the artifact of the contract we want to deploy.
  const deployer = new Deployer(hre, deployerWallet);
  console.log("# Deployer address:", deployer.zkWallet.address);

  const pythPriceUpdaterWithFallbackAsDeployer =
    PythPriceUpdaterWithFallback__factory.connect(
      pythPriceUpdaterWithFallbackAddress,
      deployer.zkWallet
    );

  let underlyingDecimals = 18;
  if (xtokenAddress.toLowerCase() !== chainConfig.markets.xETH.toLowerCase()) {
    const underlyingAddress =
      await pythPriceUpdaterWithFallbackAsDeployer.getUnderlyingAddress(
        xtokenAddress
      );
    const underlyingAsDeployer = await Erc20Interface__factory.connect(
      underlyingAddress,
      deployer.zkWallet
    );
    underlyingDecimals = await underlyingAsDeployer.decimals();
  }
  // price mantissa = 18 - underlying decimals + 18;
  const underlyingPriceMantissa = parseUnits(
    underlyingPriceUSD,
    18 - underlyingDecimals + 18
  );

  const tx =
    await pythPriceUpdaterWithFallbackAsDeployer.setSimplePriceOracleUnderlyingPrice(
      xtokenAddress,
      underlyingPriceMantissa
    );

  await tx.wait();
  console.log(
    `# Set underlying price for market ${xtokenAddress} to ${underlyingPriceUSD} (${underlyingPriceMantissa.toString()})`
  );
}
