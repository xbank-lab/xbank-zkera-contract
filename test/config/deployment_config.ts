import { CTokenType, InterestRateModelType } from "../../utils/enums";
import {
  CTokenConfigs,
  InterestRateModelConfigs,
} from "../../utils/interfaces";

export const INTEREST_RATE_MODEL: InterestRateModelConfigs = {
  IRM_ETH_Updateable: {
    name: "IRM_ETH_Updateable",
    type: InterestRateModelType.BaseJumpRateModelV2,
    args: {
      baseRatePerYear: "20000000000000000",
      multiplierPerYear: "180000000000000000",
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
      multiplierPerYear: "50000000000000000",
      jumpMultiplierPerYear: "1090000000000000000",
      kink: "800000000000000000",
      owner: "0x00",
    },
  },
};

export const CTOKEN: CTokenConfigs = {
  cETH: {
    symbol: "cETH",
    type: CTokenType.CEther,
    args: {
      underlying: "0x",
      comptroller: "0x",
      interestRateModel: "0x",
      initialExchangeRateMantissa: "200000000000000000000000000",
      name: "xBank Ether",
      symbol: "cETH",
      decimals: 8,
      admin: "0x",
    },
  },
  cUSDC: {
    symbol: "cUSDC",
    type: CTokenType.CErc20,
    args: {
      underlying: "0x",
      comptroller: "0x",
      interestRateModel: "0x",
      initialExchangeRateMantissa: "200000000000000",
      name: "xBank USD Coin",
      symbol: "cUSDC",
      decimals: 8,
      admin: "0x",
    },
  },
  cUSDT: {
    symbol: "cUSDT",
    type: CTokenType.CErc20Delegator,
    args: {
      underlying: "0x",
      comptroller: "0x",
      interestRateModel: "0x",
      initialExchangeRateMantissa: "200000000000000",
      name: "xBank USDT",
      symbol: "cUSDT",
      decimals: 8,
      admin: "0x00",
      implementation: "0x",
    },
  },
  cWBTC: {
    symbol: "cWBTC",
    type: CTokenType.CErc20Delegator,
    args: {
      underlying: "0x",
      comptroller: "0x",
      interestRateModel: "0x",
      initialExchangeRateMantissa: "20000000000000000",
      name: "xBank Wrapped BTC",
      symbol: "cWBTC",
      decimals: 8,
      admin: "0x00",
      implementation: "0x",
    },
  },
};
