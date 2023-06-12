import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { BigNumberish } from "ethers";
import { XTokenType } from "../../utils/enums";
import { XEtherRepayHelper } from "./../../typechain/contracts/X/Utils/XEtherRepayHelper";

import {
  InterestRateModelConfig,
  XTokenDeployArg as XTokenDeployConfig,
  XTokenLike,
} from "../../utils/interfaces";

import {
  ERC20PresetFixedSupply,
  JumpRateModelV2,
  Multicall,
  PythPriceUpdater,
  SimplePriceOracle,
  XErc20Immutable,
  XErc20Impl,
  XErc20Proxy,
  XEtherImmutable,
  XesImpl,
} from "../../typechain";

export async function deployERC20(
  deployer: Deployer,
  name: string,
  symbol: string,
  initialSupply: BigNumberish
): Promise<ERC20PresetFixedSupply> {
  const artifact = await deployer.loadArtifact("ERC20PresetFixedSupply");
  return (await deployer.deploy(artifact, [
    name,
    symbol,
    initialSupply,
    deployer.zkWallet.address,
  ])) as ERC20PresetFixedSupply;
}

export async function deployMulticall(deployer: Deployer): Promise<Multicall> {
  const artifact = await deployer.loadArtifact("Multicall");
  return (await deployer.deploy(artifact)) as Multicall;
}

export async function deploySimplePriceOracle(
  deployer: Deployer
): Promise<SimplePriceOracle> {
  const artifact = await deployer.loadArtifact("SimplePriceOracle");
  return (await deployer.deploy(artifact)) as SimplePriceOracle;
}

export async function deployPythPriceUpdater(
  deployer: Deployer,
  pythContract: string
): Promise<PythPriceUpdater> {
  const artifact = await deployer.loadArtifact("PythPriceUpdater");
  return (await deployer.deploy(artifact, [pythContract])) as PythPriceUpdater;
}

export async function deployXes(deployer: Deployer): Promise<XesImpl> {
  // deploy impl contracts
  const implArtifact = await deployer.loadArtifact("XesImpl");
  const implContract = await deployer.deploy(implArtifact);
  console.log("# Xes impl deployed at:", implContract.address);

  // deploy proxy contracts
  const proxyArtifact = await deployer.loadArtifact("XesProxy");
  const proxyContract = await deployer.deploy(proxyArtifact);
  console.log("# Xes proxy deployed at:", proxyContract.address);

  // set proxy impl contract
  const setPendingImplTx = await proxyContract._setPendingImplementation(
    implContract.address
  );
  await setPendingImplTx.wait();
  const becomeTx = await implContract._become(proxyContract.address);
  await becomeTx.wait();

  return proxyContract as XesImpl;
}

export async function deployBaseJumpRateModelV2(
  deployer: Deployer,
  interestRateModelConfig: InterestRateModelConfig
): Promise<JumpRateModelV2> {
  let artifact = await deployer.loadArtifact("JumpRateModelV2");
  return (await deployer.deploy(artifact, [
    BigInt(interestRateModelConfig.args.baseRatePerYear), // baseRatePerYear
    BigInt(interestRateModelConfig.args.multiplierPerYear), // multiplierPerYear
    BigInt(interestRateModelConfig.args.jumpMultiplierPerYear), // jumpMultiplierPerYear
    BigInt(interestRateModelConfig.args.kink), // kink_
    deployer.zkWallet.address, // owner
  ])) as JumpRateModelV2;
}

export async function deployXErc20Proxy(
  args: XTokenDeployConfig,
  xes: XesImpl,
  deployer: Deployer
): Promise<XTokenLike> {
  if ("implementation" in args) {
    const artifact = await deployer.loadArtifact("XErc20Proxy");
    return (await deployer.deploy(artifact, [
      args.underlying,
      xes.address,
      args.interestRateModel,
      args.initialExchangeRate,
      args.name,
      args.symbol,
      args.decimals,
      deployer.zkWallet.address,
      args.implementation,
      "0x00",
    ])) as XErc20Proxy;
  }
  return (await deployXErc20Immutable(args, xes, deployer)) as XErc20Immutable;
}

export async function deployXErc20Immutable(
  args: XTokenDeployConfig,
  xes: XesImpl,
  deployer: Deployer
): Promise<XErc20Immutable> {
  const artifact = await deployer.loadArtifact("XErc20Immutable");
  return (await deployer.deploy(artifact, [
    args.underlying,
    xes.address,
    args.interestRateModel,
    args.initialExchangeRate,
    args.name,
    args.symbol,
    args.decimals,
    deployer.zkWallet.address,
  ])) as XErc20Immutable;
}

export async function deployXToken(
  args: XTokenDeployConfig,
  xes: XesImpl,
  deployer: Deployer
): Promise<XTokenLike> {
  if ("implementation" in args) {
    return deployXErc20Proxy(args, xes, deployer);
  }
  return deployXErc20Immutable(args, xes, deployer);
}

export async function deployXErc20Impl(
  deployer: Deployer
): Promise<XErc20Impl> {
  const artifact = await deployer.loadArtifact("XErc20Impl");
  return (await deployer.deploy(artifact)) as XErc20Impl;
}

export async function deployXEth(
  args: XTokenDeployConfig,
  xes: XesImpl,
  deployer: Deployer
): Promise<XEtherImmutable> {
  const artifact = await deployer.loadArtifact("XEtherImmutable");
  return (await deployer.deploy(artifact, [
    xes.address,
    args.interestRateModel,
    args.initialExchangeRate,
    args.name,
    args.symbol,
    args.decimals,
    deployer.zkWallet.address,
  ])) as XEtherImmutable;
}

export async function deployXTokens(
  xtokenDeployArgs: XTokenDeployConfig[],
  xes: XesImpl, // as deployer
  deployer: Deployer
): Promise<Record<string, XTokenLike>> {
  const deployedXTokens: Record<string, XTokenLike> = {};
  let tx;
  for (const xtokenDeployArg of xtokenDeployArgs) {
    // @dev
    // delegate = impl
    // delegator = proxy
    if (xtokenDeployArg.type === XTokenType.XErc20Proxy) {
      const xTokenImpl = await deployXErc20Impl(deployer);
      xtokenDeployArg.implementation = xTokenImpl.address;
      console.log(
        `# Deploy XErc20Impl of ${xtokenDeployArg.symbol}: ${xTokenImpl.address} (impl contract)`
      );
    }

    const deployedXToken =
      xtokenDeployArg.type === XTokenType.XEtherImmutable
        ? await deployXEth(xtokenDeployArg, xes, deployer)
        : await deployXToken(xtokenDeployArg, xes, deployer);
    console.log(
      `# Deploy xToken of ${xtokenDeployArg.symbol}: ${deployedXToken.address}`
    );

    tx = await xes._supportMarket(deployedXToken.address);
    await tx.wait();
    console.log(
      `# Set xes to support ${xtokenDeployArg.symbol} market (${deployedXToken.address})`
    );

    deployedXTokens[xtokenDeployArg.underlyingToken] = deployedXToken;
  }
  return deployedXTokens;
}

export async function deployXEtherRepayHelper(
  deployer: Deployer,
  xETH: string
): Promise<XEtherRepayHelper> {
  const artifact = await deployer.loadArtifact("XEtherRepayHelper");
  return (await deployer.deploy(artifact, [xETH])) as XEtherRepayHelper;
}
