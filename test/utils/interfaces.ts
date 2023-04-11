import { BigNumberish } from "ethers";

import {
  BaseJumpRateModelV2,
  ERC20,
  CErc20,
  CErc20Delegator,
  CErc20Immutable,
  CEther,
  Comptroller,
  ERC20Burnable,
  ERC20PresetFixedSupply,
  SimplePriceOracle,
  WhitePaperInterestRateModel,
} from "../../typechain";

import { CTokenType, InterestRateModelType } from "./enums";

export interface CompoundV2 {
  readonly comptroller: Comptroller;
  readonly priceOracle: SimplePriceOracle;
  readonly interestRateModels: InterestRateModels;
  readonly cTokens: CTokens;
}

export interface InterestRateModels {
  [key: string]: WhitePaperInterestRateModel | BaseJumpRateModelV2;
}

export class CTokens {
  [key: string]: CTokenLike;

  get cETH(): CEther {
    return this.cEth as CEther;
  }
  set cETH(value: CTokenLike) {
    this.cEth = value;
  }
}

export type CTokenLike = CErc20 | CErc20Immutable | CErc20Delegator | CEther;
export type ERC20Like = ERC20 | ERC20Burnable | ERC20PresetFixedSupply;

export interface CTokenArgs {
  underlying: string;
  comptroller: string;
  interestRateModel: string;
  initialExchangeRateMantissa: string;
  name: string;
  symbol: string;
  decimals: number;
  admin: string;
  implementation?: string;
}

export type WhitePaperInterestRateModelArgs = {
  baseRatePerYear: string;
  multiplierPerYear: string;
};

export type BaseJumpRateModelV2Args = {
  baseRatePerYear: string;
  multiplierPerYear: string;
  jumpMultiplierPerYear: string;
  kink: string;
  owner: string;
};

export type LegacyJumpRateModelV2Args = BaseJumpRateModelV2Args;

export type JumpRateModelV2Args = BaseJumpRateModelV2Args;

export interface InterestRateModelConfigs {
  readonly [key: string]: InterestRateModelConfig;
}

export interface InterestRateModelConfig {
  name: string;
  type: InterestRateModelType;
  args: LegacyJumpRateModelV2Args | JumpRateModelV2Args;
}

export interface CTokenConfigs {
  readonly [key: string]: CTokenConfig;
}

export interface CTokenConfig {
  symbol: string;
  type: CTokenType;
  args: CTokenArgs;
}

export interface CTokenDeployArg {
  underlyingToken: string;
  cToken: string;
  underlying?: string;
  underlyingPrice?: BigNumberish;
  collateralFactor: BigNumberish;
  interestRateModel: string;
}
