import { BigNumberish } from "ethers";

import {
  BaseJumpRateModelV2,
  ERC20,
  ERC20Burnable,
  ERC20PresetFixedSupply,
  WhitePaperInterestRateModel,
  XErc20Immutable,
  XErc20Proxy,
  XEtherImmutable,
} from "../typechain";

import { InterestRateModelType, XTokenType } from "./enums";

export interface InterestRateModels {
  [key: string]: WhitePaperInterestRateModel | BaseJumpRateModelV2;
}

export type XTokenLike = XErc20Immutable | XErc20Proxy | XEtherImmutable;
export type ERC20Like = ERC20 | ERC20Burnable | ERC20PresetFixedSupply;

export interface XTokenArgs {}

export type WhitePaperInterestRateModelArgs = {
  baseRatePerYear: string;
  multiplierPerYear: string;
};

export type BaseJumpRateModelV2Args = {
  baseRatePerYear: string;
  multiplierPerYear: string;
  jumpMultiplierPerYear: string;
  kink: string;
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

export interface XTokenDeployArg {
  name: string;
  symbol: string;
  underlyingToken: string;
  type: XTokenType;
  interestRateModel: string;
  initialExchangeRate: BigNumberish;
  underlying?: string;
  decimals: number;
  implementation?: string;
}
