import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { config as dotEnvConfig } from "dotenv";
import { BigNumber, utils } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Wallet } from "zksync-web3";
import { EsXB__factory, XesImpl__factory } from "../typechain";
import { getConfig } from "./config/chain_config";

dotEnvConfig();

// Import chain config.
const chainConfig = getConfig();

interface xTokenDistributionSpeed {
  symbol: string;
  address: string;
  supplySpeedPerSec: BigNumber;
  borrowSpeedPerSec: BigNumber;
}

// ▄▄ ▄▄ ▄▄  ▄▀█ ▀█▀ ▀█▀ █▀▀ █▄░█ ▀█▀ █ █▀█ █▄░█ █  ▄▄ ▄▄ ▄▄
// ░░ ░░ ░░  █▀█ ░█░ ░█░ ██▄ █░▀█ ░█░ █ █▄█ █░▀█ ▄  ░░ ░░ ░░
const deployerWallet = new Wallet(process.env.DEPLOYER_PK as string);
const transferGuardWallet = new Wallet(process.env.DEPLOYER_PK as string); // @dev: will use when esXB's transferGuard != deployer
const xesAddress = chainConfig.Xes;
const distribTokenAddress = chainConfig.gov.esXB; // @notice: esXB or XB
const mintDistribTokenToXes = utils.parseEther("0");

const xTokenDistributionSpeeds: xTokenDistributionSpeed[] = [
  {
    symbol: "xUSDC",
    address: chainConfig.markets.xUSDC,
    supplySpeedPerSec: BigNumber.from("11640211640211600"),
    borrowSpeedPerSec: BigNumber.from("17460317460317500"),
  },
  {
    symbol: "xETH",
    address: chainConfig.markets.xETH,
    supplySpeedPerSec: BigNumber.from("7760141093474430"),
    borrowSpeedPerSec: BigNumber.from("11640211640211600"),
  },
  {
    symbol: "xWBTC",
    address: chainConfig.markets.xWBTC,
    supplySpeedPerSec: BigNumber.from("7760141093474430"),
    borrowSpeedPerSec: BigNumber.from("11640211640211600"),
  },
];
// ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄
// ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░

export default async function (hre: HardhatRuntimeEnvironment) {
  let tx;

  // Create deployer object and load the artifact of the contract we want to deploy.
  const deployer = new Deployer(hre, deployerWallet);
  console.log("# Deployer address:", deployer.zkWallet.address);

  // connect contracts
  const xesAsDeployer = XesImpl__factory.connect(xesAddress, deployer.zkWallet);
  const esXBAsDeployer = EsXB__factory.connect(
    distribTokenAddress,
    deployer.zkWallet
  );

  // update distributionToken if needed
  const curDistribToken = await xesAsDeployer.getDistributionToken();
  if (curDistribToken != distribTokenAddress) {
    tx = await xesAsDeployer._setDistributionToken(distribTokenAddress);
    await tx.wait();
    console.log(
      `# Updated distributionToken from address ${curDistribToken} to ${distribTokenAddress}`
    );
  }

  // transfer esXB to xes
  if (mintDistribTokenToXes.gt(0)) {
    tx = await esXBAsDeployer.mint(xesAddress, mintDistribTokenToXes);
    tx.wait();
    console.log(
      `# mint ${mintDistribTokenToXes.toString()} ${await esXBAsDeployer.symbol()} (${distribTokenAddress}) to xes (${xesAddress})`
    );
  }

  // collect distribution speed for updates
  let xTokenAddresses: string[] = [];
  let supplySpeeds: BigNumber[] = [];
  let borrowSpeeds: BigNumber[] = [];
  for (let xToken of xTokenDistributionSpeeds) {
    console.log(
      `# previous ${
        xToken.symbol
      }: supplySpeedPerSec = ${await xesAsDeployer.compSupplySpeeds(
        xToken.address
      )}, borrowSpeedPerSec ${await xesAsDeployer.compBorrowSpeeds(
        xToken.address
      )}`
    );
    xTokenAddresses.push(xToken.address);
    supplySpeeds.push(xToken.supplySpeedPerSec);
    borrowSpeeds.push(xToken.borrowSpeedPerSec);
  }

  // update distribution speeds
  tx = await xesAsDeployer._setCompSpeeds(
    xTokenAddresses,
    supplySpeeds,
    borrowSpeeds
  );
  await tx.wait();

  // logs updated distribution speeds
  for (let xToken of xTokenDistributionSpeeds) {
    console.log(
      `# update ${
        xToken.symbol
      }: supplySpeedPerSec = ${await xesAsDeployer.compSupplySpeeds(
        xToken.address
      )}, borrowSpeedPerSec ${await xesAsDeployer.compBorrowSpeeds(
        xToken.address
      )}`
    );
  }
}
