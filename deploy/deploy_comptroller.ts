import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { config as dotEnvConfig } from "dotenv";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Wallet } from "zksync-web3";
import { Comptroller__factory } from "../typechain";
import { deployComptroller } from "./utils/deploy";

dotEnvConfig();

// REVIEW VARIABLES CAREFULLY
const deployerWallet = new Wallet(process.env.DEPLOYER_PK as string);
const priceOracleAddress = "0x...";

export default async function (hre: HardhatRuntimeEnvironment) {
  let tx;

  // Create deployer object and load the artifact of the contract we want to deploy.
  const deployer = new Deployer(hre, deployerWallet);
  console.log("# Deployer address:", deployer.zkWallet.address);

  // deploy comptroller
  let comptroller = await deployComptroller(deployer);
  const comptrollerAsDeployer = Comptroller__factory.connect(
    comptroller.address,
    deployer.zkWallet
  );
  console.log(`# Comptroller deployed at: ${comptroller.address}`);

  // set price oracle to comptroller
  tx = await comptrollerAsDeployer._setPriceOracle(priceOracleAddress);
  await tx.wait();
  console.log("# SetPriceOracle to comptroller at: ", priceOracleAddress);
}
