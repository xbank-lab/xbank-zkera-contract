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
const l2TokenAddress = "0xf628273D46f114cB40efb92aBDC6e9e626C5C450"; // TVERCC
const amount = "100";
// ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄
// ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░

export default async function (hre: HardhatRuntimeEnvironment) {
  // Create deployer object and load the artifact of the contract we want to deploy.
  const deployer = new Deployer(hre, deployerWallet);
  console.log("# Deployer address:", deployer.zkWallet.address);

  const erc20 = Erc20Interface__factory.connect(
    l2TokenAddress,
    deployer.zkWallet
  );
  const decimals = await erc20.decimals();
  const amountBN = parseUnits(amount, decimals);

  const withdrawTx = await deployer.zkWallet.withdraw({
    to: deployer.zkWallet.address,
    token: l2TokenAddress,
    amount: amountBN,
  });

  console.log(`Withdraw transaction sent ${withdrawTx.hash}`);
  console.log(`Waiting for withdraw to be processed in L1...`);
  // Wait until the withdraw is processed on ethereum
  await withdrawTx.wait();
  console.log(`ERC20 token withdraw to L1`);

  const finalizeWithdrawalTx = await deployer.zkWallet.finalizeWithdrawal(
    withdrawTx.hash
  );
  console.log(`Finalizing Withdraw transaction ${finalizeWithdrawalTx.hash}`);
  await finalizeWithdrawalTx.wait();
  // Wait until the finalized is processed on ethereum
  console.log(`Finalized Withdraw transaction`);
}
