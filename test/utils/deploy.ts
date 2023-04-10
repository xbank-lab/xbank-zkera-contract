import { Provider, Contract, Wallet } from "zksync-web3";
import { ethers, waffle } from "hardhat";
import { Signer, BigNumberish, utils, BigNumber } from "ethers";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { CTOKEN } from "./config";
import { CTokenType } from "./enums";
import {
  CErc20Args,
  CErc20DelegatorArgs,
  CEthArgs,
  CompoundV2,
  CTokenArgs,
  CTokenDeployArg,
  CTokenLike,
  CTokens,
  InterestRateModelConfig,
  InterestRateModels,
  JumpRateModelV2Args,
  LegacyJumpRateModelV2Args,
  WhitePaperInterestRateModelArgs,
} from "./interfaces";

import {
  BaseJumpRateModelV2,
  CErc20,
  CErc20Delegate,
  CErc20Delegate__factory,
  CErc20Delegator,
  CErc20Delegator__factory,
  CErc20Immutable,
  CErc20Immutable__factory,
  CEther,
  CEther__factory,
  Comptroller,
  ComptrollerInterface,
  ComptrollerInterface__factory,
  Comptroller__factory,
  ERC20PresetFixedSupply,
  InterestRateModel,
  JumpRateModelV2__factory,
  PriceOracle,
  SimplePriceOracle,
  SimplePriceOracle__factory,
  Unitroller,
  WhitePaperInterestRateModel,
  WhitePaperInterestRateModel__factory,
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

export async function deploySimplePriceOracle(
  deployer: Deployer
): Promise<SimplePriceOracle> {
  const artifact = await deployer.loadArtifact("SimplePriceOracle");
  return (await deployer.deploy(artifact)) as SimplePriceOracle;
}

export async function deployComptroller(
  deployer: Deployer
): Promise<Comptroller> {
  // deploy impl contracts
  const implArtifact = await deployer.loadArtifact("Comptroller");
  const implContract = await deployer.deploy(implArtifact);
  console.log("# Comptroller impl deployed at:", implContract.address);

  // deploy proxy contracts
  const proxyArtifact = await deployer.loadArtifact("Unitroller");
  const proxyContract = await deployer.deploy(proxyArtifact);
  console.log("# Comptroller proxy deployed at:", proxyContract.address);

  // set proxy impl contract
  const setPendingImplTx = await proxyContract._setPendingImplementation(
    implContract.address
  );
  await setPendingImplTx.wait();
  const becomeTx = await implContract._become(proxyContract.address);
  await becomeTx.wait();

  // return proxyContract as comptroller
  return proxyContract as Comptroller;
}

export async function deployBaseJumpRateModelV2(
  deployer: Deployer
): Promise<BaseJumpRateModelV2> {
  // Compound's https://etherscan.io/tx/0x3f88778f6f5b417ccc5c63301cf982b3ca90c6428229ce789d0f5a1a4e9a20c0#eventlog
  const artifact = await deployer.loadArtifact("JumpRateModelV2");
  return (await deployer.deploy(artifact, [
    BigInt("0"), // baseRatePerBlock
    BigInt("23782343987"), // multiplierPerBlock
    BigInt("518455098934"), // jumpMultiplierPerBlock
    BigInt("800000000000000000"), // kink
    deployer.zkWallet.address,
  ])) as BaseJumpRateModelV2;
}

export async function deployCErc20Delegator(
  args: CTokenArgs,
  deployer: Deployer
): Promise<CTokenLike> {
  if ("implementation" in args) {
    const artifact = await deployer.loadArtifact("CErc20Delegator");
    return (await deployer.deploy(artifact, [
      args.underlying,
      args.comptroller,
      args.interestRateModel,
      args.initialExchangeRateMantissa,
      args.name,
      args.symbol,
      args.decimals,
      args.admin,
      args.implementation,
      "0x00",
    ])) as CErc20Delegator;
  }
  return (await deployCErc20Immutable(args, deployer)) as CErc20Immutable;
}

export async function deployCErc20Immutable(
  args: CErc20Args,
  deployer: Deployer
): Promise<CErc20Immutable> {
  const artifact = await deployer.loadArtifact("CErc20Immutable");
  return (await deployer.deploy(artifact, [
    args.underlying,
    args.comptroller,
    args.interestRateModel,
    args.initialExchangeRateMantissa,
    args.name,
    args.symbol,
    args.decimals,
    args.admin,
  ])) as CErc20Immutable;
}

export async function deployCToken(
  args: CTokenArgs,
  deployer: Deployer
): Promise<CTokenLike> {
  if ("implementation" in args) {
    return deployCErc20Delegator(args, deployer);
  }
  return deployCErc20Immutable(args, deployer);
}

export async function deployCErc20Delegate(
  deployer: Deployer
): Promise<CErc20Delegate> {
  const artifact = await deployer.loadArtifact("CErc20Delegate");
  return (await deployer.deploy(artifact)) as CErc20Delegate;
}

export async function deployCEth(
  args: CTokenArgs,
  deployer: Deployer
): Promise<CEther> {
  const artifact = await deployer.loadArtifact("CEther");
  return (await deployer.deploy(artifact, [
    args.comptroller,
    args.interestRateModel,
    args.initialExchangeRateMantissa,
    args.name,
    args.symbol,
    args.decimals,
    args.admin,
  ])) as CEther;
}

export async function deployCTokens(
  config: CTokenDeployArg[],
  irm: InterestRateModel,
  priceOracle: SimplePriceOracle,
  comptroller: Comptroller,
  deployer: Deployer
): Promise<CTokenLike[]> {
  const deployedCTokens: CTokenLike[] = [];
  for (const c of config) {
    const cTokenConf = CTOKEN[c.cToken];

    cTokenConf.args.comptroller = comptroller.address;
    cTokenConf.args.underlying = c.underlying || "0x00";
    cTokenConf.args.interestRateModel = irm.address;
    cTokenConf.args.admin = deployer.zkWallet.address;

    // @dev
    // delegate = impl
    // delegator = proxy
    if (cTokenConf.type === CTokenType.CErc20Delegator) {
      const cTokenDelegate = await deployCErc20Delegate(deployer);
      cTokenConf.args.implementation = cTokenDelegate.address;
      console.log(
        `# Deploy CErc20Delegate of ${c.cToken}: ${cTokenDelegate.address} (impl contract)`
      );
    }

    const deployedCToken =
      CTOKEN[c.cToken].type === CTokenType.CEther
        ? await deployCEth(cTokenConf.args, deployer)
        : await deployCToken(cTokenConf.args, deployer);
    console.log(`# Deploy cToken of ${c.cToken}: ${deployedCToken.address}`);

    const supportMarketTx = await comptroller._supportMarket(
      deployedCToken.address
    );
    await supportMarketTx.wait();
    console.log(
      `# Set comptroller to support ${c.cToken} market (${deployedCToken.address})`
    );

    if (cTokenConf.type === CTokenType.CEther) {
      await priceOracle.setDirectPrice(
        deployedCToken.address,
        c.underlyingPrice || 0
      );
    } else {
      await priceOracle.setUnderlyingPrice(
        deployedCToken.address,
        c.underlyingPrice || 0
      );
    }
    console.log(
      `# Set price for ${c.cToken}: (${(c.underlyingPrice || 0).toString()})`
    );

    if (c.collateralFactor) {
      await comptroller._setCollateralFactor(
        deployedCToken.address,
        c.collateralFactor
      );
    }
    console.log(
      `# Set collateralFactor for ${
        c.cToken
      }: (${c.collateralFactor.toString()})`
    );

    deployedCTokens.push(deployedCToken);
  }
  return deployedCTokens;
}
