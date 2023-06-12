import { BigNumber } from "ethers";
import { Wallet } from "zksync-web3";
import { utils } from "zksync-web3/build/src";
import {
  XErc20Impl,
  XErc20Impl__factory,
  XEtherImmutable,
} from "../../typechain";
import { XTokenLike } from "../../utils/interfaces";
import { ERC20Like } from "./../../utils/interfaces";

export async function getERC20Balance(
  erc20: ERC20Like | XTokenLike,
  wallet: Wallet
): Promise<BigNumber> {
  return await erc20.balanceOf(wallet.address);
}

export async function getERC20AddressBalance(
  erc20: ERC20Like | XTokenLike,
  address: string
): Promise<BigNumber> {
  return await erc20.balanceOf(address);
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
  erc20: ERC20Like | XTokenLike,
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

export async function _simulateMintCErc20(
  xToken: XErc20Impl,
  wallet: Wallet,
  amount: BigNumber
): Promise<void> {
  let tx;
  // approve
  const erc20 = XErc20Impl__factory.connect(await xToken.underlying(), wallet);
  tx = await erc20.connect(wallet).approve(xToken.address, amount);
  await tx.wait();
  tx = await xToken.connect(wallet).mint(amount);
  await tx.wait();
}

export async function _simulateMintCEther(
  xETH: XEtherImmutable,
  wallet: Wallet,
  amount: BigNumber
): Promise<void> {
  const tx = await xETH.connect(wallet).mint({ value: amount });
  await tx.wait();
}
