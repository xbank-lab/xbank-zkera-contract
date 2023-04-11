import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { config as dotEnvConfig } from "dotenv";
import { BigNumber, constants, utils } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Wallet } from "zksync-web3";
import {
  BaseJumpRateModelV2,
  Comptroller,
  Comptroller__factory,
  SimplePriceOracle,
  SimplePriceOracle__factory,
} from "../typechain";
import { CTokenDeployArg, CTokenLike } from "../utils/interfaces";
import {
  deployBaseJumpRateModelV2,
  deployCTokens,
  deployComptroller,
  deploySimplePriceOracle,
} from "./utils/deploy";
import { getConfig } from "./config/chain_config";
import { INTEREST_RATE_MODEL } from "./config/deployment_config";

dotEnvConfig();

// Import chain config.
const chainConfig = getConfig();

// Initialize deployer wallet.
const deployerWallet = new Wallet(process.env.DEPLOYER_PK as string);
const USDC = chainConfig.tokens.USDC;

// An example of a deploy script that will deploy and call a simple contract.
export default async function (hre: HardhatRuntimeEnvironment) {
  const E17 = constants.WeiPerEther.div(10);

  let tx;

  // Compound
  let simplePriceOracle: SimplePriceOracle;
  let comptroller: Comptroller;
  let baseJumpRateModelV2_ETH: BaseJumpRateModelV2;
  let baseJumpRateModelV2_Stables: BaseJumpRateModelV2;

  // deployed CTokens
  let cTokens: Record<string, CTokenLike>;

  // Create deployer object and load the artifact of the contract we want to deploy.
  const deployer = new Deployer(hre, deployerWallet);

  console.log("# Deployer address:", deployer.zkWallet.address);

  // deploy price oracle
  simplePriceOracle = await deploySimplePriceOracle(deployer);
  console.log(`# PriceOracle deployed at: ${simplePriceOracle.address}`);

  // deploy comptroller
  comptroller = await deployComptroller(deployer);
  const comptrollerAsDeployer = Comptroller__factory.connect(
    comptroller.address,
    deployer.zkWallet
  );
  console.log(`# Comptroller deployed at: ${comptroller.address}`);

  // set price oracle to comptroller
  tx = await comptrollerAsDeployer._setPriceOracle(simplePriceOracle.address);
  await tx.wait();
  console.log(
    "# SetPriceOracle to comptroller at: ",
    simplePriceOracle.address
  );

  // deploy interest models
  baseJumpRateModelV2_ETH = await deployBaseJumpRateModelV2(
    deployer,
    INTEREST_RATE_MODEL.IRM_ETH_Updateable
  );
  console.log(
    `# BaseJumpRateModelV2_ETH deployed at: ${baseJumpRateModelV2_ETH.address}`
  );
  baseJumpRateModelV2_Stables = await deployBaseJumpRateModelV2(
    deployer,
    INTEREST_RATE_MODEL.IRM_STABLES_Updateable
  );
  console.log(
    `# BaseJumpRateModelV2_Stables deployed at: ${baseJumpRateModelV2_Stables.address}`
  );

  // deploy cTokens
  let cTokenDeployArgs: CTokenDeployArg[] = [
    {
      underlyingToken: "USDC",
      cToken: "cUSDC",
      underlying: USDC,
      underlyingPrice: utils.parseEther("1"),
      collateralFactor: BigNumber.from(8).mul(E17), // 0.8
      interestRateModel: baseJumpRateModelV2_Stables.address,
    },
    {
      underlyingToken: "ETH",
      cToken: "cETH",
      underlyingPrice: utils.parseEther("1"),
      collateralFactor: BigNumber.from(6).mul(E17), // 0.6
      interestRateModel: baseJumpRateModelV2_ETH.address,
    },
  ];

  cTokens = await deployCTokens(
    cTokenDeployArgs,
    simplePriceOracle,
    comptrollerAsDeployer,
    deployer
  );
}
