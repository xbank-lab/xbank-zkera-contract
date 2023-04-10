import { Wallet } from "zksync-web3";
import { ERC20Like } from "./interfaces";
import { BigNumber } from "ethers";

export async function getERC20Balance(
  erc20: ERC20Like,
  wallet: Wallet
): Promise<string> {
  return (await erc20.balanceOf(wallet.address)).toString();
}

export async function transferERC20(
  erc20: ERC20Like,
  fromWallet: Wallet,
  toWallet: Wallet,
  amount: BigNumber
): Promise<void> {
  let tx = await erc20.connect(fromWallet).transfer(toWallet.address, amount);
  await tx.wait();
}

export async function distributeERC20(
  erc20: ERC20Like,
  fromWallet: Wallet,
  toWallets: Array<Wallet>,
  amounts: Array<BigNumber>
): Promise<void> {
  for (const [i, toWallet] of toWallets.entries()) {
    await transferERC20(erc20, fromWallet, toWallet, amounts[i]);
  }
}

export async function approveERC20(
  erc20: ERC20Like,
  approver: Wallet,
  spenderAddress: string,
  amount: BigNumber
): Promise<void> {
  let tx = await erc20.connect(approver).approve(spenderAddress, amount);
  await tx.wait();
}

export async function getETHBalance(wallet: Wallet): Promise<string> {
  return (await wallet.provider.getBalance(wallet.address)).toString();
}
