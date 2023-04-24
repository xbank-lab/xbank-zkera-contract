import { BigNumber } from "ethers";
import { Wallet } from "zksync-web3";
import { utils } from "zksync-web3/build/src";
import { CErc20, CErc20__factory, CEther, CToken } from "../../typechain";
import { CTokenLike } from "../../utils/interfaces";
import { ERC20Like } from "./../../utils/interfaces";

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
  erc20: ERC20Like | CTokenLike,
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
  cToken: CErc20,
  wallet: Wallet,
  amount: BigNumber
): Promise<void> {
  let tx;
  // approve
  const erc20 = CErc20__factory.connect(await cToken.underlying(), wallet);
  tx = await erc20.connect(wallet).approve(cToken.address, amount);
  await tx.wait();
  tx = await cToken.connect(wallet).mint(amount);
  await tx.wait();
}

export async function _simulateMintCEther(
  cETH: CEther,
  wallet: Wallet,
  amount: BigNumber
): Promise<void> {
  const tx = await cETH.connect(wallet).mint({ value: amount });
  await tx.wait();
}
