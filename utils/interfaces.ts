import { BigNumberish } from "ethers";

import {
  BaseJumpRateModelV2,
  ERC20,
  ERC20Burnable,
  ERC20PresetFixedSupply,
  SimplePriceOracle,
  WhitePaperInterestRateModel,
  XErc20Abstract,
  XErc20Immutable,
  XErc20Proxy,
  XEtherImmutable,
} from "../typechain";

import { XTokenType, InterestRateModelType } from "./enums";

export interface InterestRateModels {
  [key: string]: WhitePaperInterestRateModel | BaseJumpRateModelV2;
}

export type XTokenLike = XErc20Immutable | XErc20Proxy | XEtherImmutable;
export type ERC20Like = ERC20 | ERC20Burnable | ERC20PresetFixedSupply;

export interface XTokenArgs {
  underlying: string;
  xes: string;
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

export interface XTokenConfigs {
  readonly [key: string]: XTokenConfig;
}

export interface XTokenConfig {
  symbol: string;
  type: XTokenType;
  args: XTokenArgs;
}

export interface XTokenDeployArg {
  underlyingToken: string;
  xToken: string;
  underlying?: string;
  underlyingPrice?: BigNumberish;
  collateralFactor: BigNumberish;
  interestRateModel: string;
}
