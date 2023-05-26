import { XTokenType, InterestRateModelType } from "../../utils/enums";
import {
  XTokenConfigs,
  InterestRateModelConfigs,
} from "../../utils/interfaces";

export const INTEREST_RATE_MODEL: InterestRateModelConfigs = {
  IRM_ETH_Updateable: {
    name: "IRM_ETH_Updateable",
    type: InterestRateModelType.BaseJumpRateModelV2,
    args: {
      baseRatePerYear: "20000000000000000",
      multiplierPerYear: "220000000000000000",
      jumpMultiplierPerYear: "40000000000000000000",
      kink: "800000000000000000",
      owner: "0x00",
    },
  },
  IRM_STABLES_Updateable: {
    name: "IRM_STABLES_Updateable",
    type: InterestRateModelType.BaseJumpRateModelV2,
    args: {
      baseRatePerYear: "0",
      multiplierPerYear: "60000000000000000",
      jumpMultiplierPerYear: "1360000000000000000",
      kink: "800000000000000000",
      owner: "0x00",
    },
  },
};

export const XTOKEN: XTokenConfigs = {
  xETH: {
    symbol: "xETH",
    type: XTokenType.XEtherImmutable,
    args: {
      underlying: "0x",
      xes: "0x",
      interestRateModel: "0x",
      initialExchangeRateMantissa: "200000000000000000000000000", // 18 +
      name: "xBank Ether",
      symbol: "xETH",
      decimals: 8,
      admin: "0x",
    },
  },
  xUSDC: {
    symbol: "xUSDC",
    type: XTokenType.XErc20Immutable,
    args: {
      underlying: "0x",
      xes: "0x",
      interestRateModel: "0x",
      initialExchangeRateMantissa: "200000000000000",
      name: "xBank USD Coin",
      symbol: "xUSDC",
      decimals: 8,
      admin: "0x",
    },
  },
  xUSDT: {
    symbol: "xUSDT",
    type: XTokenType.XErc20Proxy,
    args: {
      underlying: "0x",
      xes: "0x",
      interestRateModel: "0x",
      initialExchangeRateMantissa: "200000000000000",
      name: "xBank USDT",
      symbol: "xUSDT",
      decimals: 8,
      admin: "0x00",
      implementation: "0x",
    },
  },
  xWBTC: {
    symbol: "xWBTC",
    type: XTokenType.XErc20Proxy,
    args: {
      underlying: "0x",
      xes: "0x",
      interestRateModel: "0x",
      initialExchangeRateMantissa: "20000000000000000",
      name: "xBank Wrapped BTC",
      symbol: "xWBTC",
      decimals: 8,
      admin: "0x00",
      implementation: "0x",
    },
  },
};
