import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { BigNumberish } from "ethers";
import { XTokenType } from "../../utils/enums";
import { XTOKEN } from "../config/deployment_config";
import { XEtherRepayHelper } from "./../../typechain/contracts/X/Utils/XEtherRepayHelper";

import {
  InterestRateModelConfig,
  XTokenArgs,
  XTokenDeployArg,
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
  args: XTokenArgs,
  deployer: Deployer
): Promise<XTokenLike> {
  if ("implementation" in args) {
    const artifact = await deployer.loadArtifact("XErc20Proxy");
    return (await deployer.deploy(artifact, [
      args.underlying,
      args.xes,
      args.interestRateModel,
      args.initialExchangeRateMantissa,
      args.name,
      args.symbol,
      args.decimals,
      args.admin,
      args.implementation,
      "0x00",
    ])) as XErc20Proxy;
  }
  return (await deployXErc20Immutable(args, deployer)) as XErc20Immutable;
}

export async function deployXErc20Immutable(
  args: XTokenArgs,
  deployer: Deployer
): Promise<XErc20Immutable> {
  const artifact = await deployer.loadArtifact("XErc20Immutable");
  return (await deployer.deploy(artifact, [
    args.underlying,
    args.xes,
    args.interestRateModel,
    args.initialExchangeRateMantissa,
    args.name,
    args.symbol,
    args.decimals,
    args.admin,
  ])) as XErc20Immutable;
}

export async function deployXToken(
  args: XTokenArgs,
  deployer: Deployer
): Promise<XTokenLike> {
  if ("implementation" in args) {
    return deployXErc20Proxy(args, deployer);
  }
  return deployXErc20Immutable(args, deployer);
}

export async function deployXErc20Impl(
  deployer: Deployer
): Promise<XErc20Impl> {
  const artifact = await deployer.loadArtifact("XErc20Impl");
  return (await deployer.deploy(artifact)) as XErc20Impl;
}

export async function deployXEth(
  args: XTokenArgs,
  deployer: Deployer
): Promise<XEtherImmutable> {
  const artifact = await deployer.loadArtifact("XEtherImmutable");
  return (await deployer.deploy(artifact, [
    args.xes,
    args.interestRateModel,
    args.initialExchangeRateMantissa,
    args.name,
    args.symbol,
    args.decimals,
    args.admin,
  ])) as XEtherImmutable;
}

export async function deployXTokens(
  config: XTokenDeployArg[],
  priceOracle: SimplePriceOracle,
  xes: XesImpl, // as deployer
  deployer: Deployer
): Promise<Record<string, XTokenLike>> {
  const deployedXTokens: Record<string, XTokenLike> = {};
  for (const c of config) {
    const xTokenConf = XTOKEN[c.xToken];

    xTokenConf.args.xes = xes.address;
    xTokenConf.args.underlying = c.underlying || "0x00";
    xTokenConf.args.interestRateModel = c.interestRateModel;
    xTokenConf.args.admin = deployer.zkWallet.address;

    // @dev
    // delegate = impl
    // delegator = proxy
    if (xTokenConf.type === XTokenType.XErc20Proxy) {
      const xTokenImpl = await deployXErc20Impl(deployer);
      xTokenConf.args.implementation = xTokenImpl.address;
      console.log(
        `# Deploy XErc20Impl of ${c.xToken}: ${xTokenImpl.address} (impl contract)`
      );
    }

    const deployedXToken =
      XTOKEN[c.xToken].type === XTokenType.XEtherImmutable
        ? await deployXEth(xTokenConf.args, deployer)
        : await deployXToken(xTokenConf.args, deployer);
    console.log(`# Deploy xToken of ${c.xToken}: ${deployedXToken.address}`);

    const supportMarketTx = await xes._supportMarket(deployedXToken.address);
    await supportMarketTx.wait();
    console.log(
      `# Set xes to support ${c.xToken} market (${deployedXToken.address})`
    );

    if (xTokenConf.type === XTokenType.XEtherImmutable) {
      await priceOracle.setDirectPrice(
        "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
        c.underlyingPrice || 0
      );
    } else {
      await priceOracle.setUnderlyingPrice(
        deployedXToken.address,
        c.underlyingPrice || 0
      );
    }
    const underlyingPrice = await priceOracle.getUnderlyingPrice(
      deployedXToken.address
    );
    console.log(
      `# Set price for ${c.xToken}: (${(underlyingPrice || 0).toString()})`
    );

    if (c.collateralFactor) {
      const tx = await xes._setCollateralFactor(
        deployedXToken.address,
        c.collateralFactor
      );
      await tx.wait();
    }
    console.log(
      `# Set collateralFactor for ${
        c.xToken
      }: (${c.collateralFactor.toString()})`
    );

    deployedXTokens[c.underlyingToken] = deployedXToken;
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
