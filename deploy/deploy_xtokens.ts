import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { config as dotEnvConfig } from "dotenv";
import { utils } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Wallet } from "zksync-web3";
import { SimplePriceOracle__factory, XesImpl__factory } from "../typechain";
import { XTokenDeployArg, XTokenLike } from "../utils/interfaces";
import { getConfig } from "./config/chain_config";
import { deployXTokens } from "./utils/deploy";

dotEnvConfig();

// Import chain config.
const chainConfig = getConfig();

// ▄▄ ▄▄ ▄▄  ▄▀█ ▀█▀ ▀█▀ █▀▀ █▄░█ ▀█▀ █ █▀█ █▄░█ █  ▄▄ ▄▄ ▄▄
// ░░ ░░ ░░  █▀█ ░█░ ░█░ ██▄ █░▀█ ░█░ █ █▄█ █░▀█ ▄  ░░ ░░ ░░
const deployerWallet = new Wallet(process.env.DEPLOYER_PK as string);
const USDC = chainConfig.tokens.USDC;
const priceOracleAddress = chainConfig.PriceOracle;
const xesAddress = chainConfig.Xes;
const baseJumpRateModelV2EthAddress = chainConfig.InterestRateModels.xETH;
const baseJumpRateModelV2StablesAddress = chainConfig.InterestRateModels.xUSDC;
// [IMPORTANT!] price decimals = 18 - underlying.decimals + 18
const xTokenDeployArgs: XTokenDeployArg[] = [
  {
    underlyingToken: "ETH",
    xToken: "xETH",
    underlyingPrice: utils.parseUnits("1800", 18), // 18 - 18 + 18 = 18 decimals
    collateralFactor: utils.parseUnits("0.825", 18), // 82.5%
    interestRateModel: baseJumpRateModelV2EthAddress,
  },
  {
    underlyingToken: "USDC",
    xToken: "xUSDC",
    underlying: USDC,
    underlyingPrice: utils.parseUnits("1", 30), // 18 - 6 + 18 = 30 decimals
    collateralFactor: utils.parseUnits("0.855", 18), // 85.5%
    interestRateModel: baseJumpRateModelV2StablesAddress,
  },
];
// ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄
// ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░

export default async function (hre: HardhatRuntimeEnvironment) {
  // Create deployer object and load the artifact of the contract we want to deploy.
  const deployer = new Deployer(hre, deployerWallet);
  console.log("# Deployer address:", deployer.zkWallet.address);

  // connect xes
  const xesAsDeployer = XesImpl__factory.connect(xesAddress, deployer.zkWallet);

  // connect priceOracle
  const priceOracleAsDeployer = SimplePriceOracle__factory.connect(
    priceOracleAddress,
    deployer.zkWallet
  );

  // deploy xTokens
  let xTokens: Record<string, XTokenLike> = await deployXTokens(
    xTokenDeployArgs,
    priceOracleAsDeployer,
    xesAsDeployer,
    deployer
  );
  console.log("# xTokens deployment summary:");
  for (let symbol in xTokens) {
    console.log(
      `# xToken ${await xTokens[symbol].symbol()} deployed at: ${
        xTokens[symbol].address
      }`
    );
  }
}
