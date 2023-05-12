import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { config as dotEnvConfig } from "dotenv";
import { BigNumber, constants, utils } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Wallet } from "zksync-web3";
import { SimplePriceOracle__factory, XesImpl__factory } from "../typechain";
import { XTokenDeployArg, XTokenLike } from "../utils/interfaces";
import { getConfig } from "./config/chain_config";
import { deployXTokens } from "./utils/deploy";

dotEnvConfig();

// Import chain config.
const chainConfig = getConfig();

const E17 = constants.WeiPerEther.div(10);

// REVIEW VARIABLES CAREFULLY
const deployerWallet = new Wallet(process.env.DEPLOYER_PK as string);
const USDC = chainConfig.tokens.USDC;
const priceOracleAddress = "0x...";
const xesAddress = "0x...";
const baseJumpRateModelV2StablesAddress = "0x...";
const baseJumpRateModelV2EthAddress = "0x...";
// [IMPORTANT!] price decimals = 18 - underlying.decimals + 18
const cTokenDeployArgs: XTokenDeployArg[] = [
  {
    underlyingToken: "USDC",
    xToken: "xUSDC",
    underlying: USDC,
    underlyingPrice: utils.parseUnits("1", 30), // 18 - 6 + 18 = 30 decimals
    collateralFactor: BigNumber.from(8).mul(E17), // 0.8
    interestRateModel: baseJumpRateModelV2StablesAddress,
  },
  {
    underlyingToken: "ETH",
    xToken: "xETH",
    underlyingPrice: utils.parseUnits("1800", 18), // 18 - 18 + 18 = 18 decimals
    collateralFactor: BigNumber.from(6).mul(E17), // 0.6
    interestRateModel: baseJumpRateModelV2EthAddress,
  },
];

export default async function (hre: HardhatRuntimeEnvironment) {
  // Create deployer object and load the artifact of the contract we want to deploy.
  const deployer = new Deployer(hre, deployerWallet);
  console.log("# Deployer address:", deployer.zkWallet.address);

  // connect xes
  const comptrollerAsDeployer = XesImpl__factory.connect(
    xesAddress,
    deployer.zkWallet
  );

  // connect priceOracle
  const priceOracleAsDeployer = SimplePriceOracle__factory.connect(
    priceOracleAddress,
    deployer.zkWallet
  );

  // deploy cTokens
  let cTokens: Record<string, XTokenLike> = await deployXTokens(
    cTokenDeployArgs,
    priceOracleAsDeployer,
    comptrollerAsDeployer,
    deployer
  );
  console.log("# cTokens deployment summary:");
  for (let symbol in cTokens) {
    console.log(
      `# cToken ${cTokens[symbol].symbol} deployed at: ${cTokens[symbol].address}`
    );
  }
}
