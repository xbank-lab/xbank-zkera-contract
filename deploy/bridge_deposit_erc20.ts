import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { config as dotEnvConfig } from "dotenv";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Wallet } from "zksync-web3";
import { Erc20Interface__factory } from "../typechain";
import { parseUnits } from "ethers/lib/utils";

dotEnvConfig();

// check token address at bridge contract
// https://goerli.explorer.zksync.io/address/0x00ff932A6d70E2B8f1Eb4919e1e09C1923E7e57b#contract
// ▄▄ ▄▄ ▄▄  ▄▀█ ▀█▀ ▀█▀ █▀▀ █▄░█ ▀█▀ █ █▀█ █▄░█ █  ▄▄ ▄▄ ▄▄
// ░░ ░░ ░░  █▀█ ░█░ ░█░ ██▄ █░▀█ ░█░ █ █▄█ █░▀█ ▄  ░░ ░░ ░░
const deployerWallet = new Wallet(process.env.DEPLOYER_PK as string);
const l1TokenAddress = "0x03005Bf56e01bf958d42cFc984c27A6688f04931"; // TVERCC
const amount = "200";
// ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄
// ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░

export default async function (hre: HardhatRuntimeEnvironment) {
  // Create deployer object and load the artifact of the contract we want to deploy.
  const deployer = new Deployer(hre, deployerWallet);
  console.log("# Deployer address:", deployer.zkWallet.address);

  const erc20 = Erc20Interface__factory.connect(
    l1TokenAddress,
    deployer.ethWallet
  );
  const decimals = await erc20.decimals();
  const amountBN = parseUnits(amount, decimals);

  const depositTx = await deployer.zkWallet.deposit({
    to: deployer.zkWallet.address,
    token: l1TokenAddress,
    amount: amountBN,
    approveERC20: true,
  });

  console.log(`Deposit transaction sent ${depositTx.hash}`);
  console.log(`Waiting for deposit to be processed in L2...`);
  // Wait until the deposit is processed on zkSync
  await depositTx.wait();
  console.log(`ERC20 token deposited to L2`);
}
