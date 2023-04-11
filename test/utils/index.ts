import { Wallet } from "zksync-web3";
import { CTokenLike, ERC20Like } from "../../utils/interfaces";
import { BigNumber } from "ethers";
import { utils } from "zksync-web3/build/src";
import { ERC20__factory } from "../../typechain";

export async function getERC20Balance(
  erc20: ERC20Like | CTokenLike,
  wallet: Wallet
): Promise<BigNumber> {
  // erc20 = ERC20__factory.connect(erc20.address, wallet);
  return await erc20.balanceOf(wallet.address);
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

export async function distributeETH(
  fromWallet: Wallet,
  toWallets: Array<Wallet>,
  amounts: Array<BigNumber>
): Promise<void> {
  for (const [i, toWallet] of toWallets.entries()) {
    await fromWallet.transfer({
      to: toWallet.address,
      token: utils.ETH_ADDRESS,
      amount: amounts[i],
    });
  }
}

export async function getETHBalance(wallet: Wallet): Promise<BigNumber> {
  return await wallet.getBalance(utils.ETH_ADDRESS);
}
