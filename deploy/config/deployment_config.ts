import { config as dotEnvConfig } from "dotenv";
import { constants, utils } from "ethers";
import { InterestRateModelType, XTokenType } from "../../utils/enums";
import {
  InterestRateModelConfigs,
  XTokenDeployArg,
} from "../../utils/interfaces";
import { getConfig } from "./chain_config";

dotEnvConfig();

// Import chain config.
const chainConfig = getConfig();

export const INTEREST_RATE_MODEL: InterestRateModelConfigs = {
  IRM_ETH_Updateable: {
    name: "IRM_ETH_Updateable",
    type: InterestRateModelType.BaseJumpRateModelV2,
    args: {
      baseRatePerYear: "0",
      multiplierPerYear: "100000000000000000",
      jumpMultiplierPerYear: "9333333333333333333",
      kink: "850000000000000000",
    },
  },
  IRM_STABLES_Updateable: {
    name: "IRM_STABLES_Updateable",
    type: InterestRateModelType.BaseJumpRateModelV2,
    args: {
      baseRatePerYear: "0",
      multiplierPerYear: "60000000000000000",
      jumpMultiplierPerYear: "9600000000000000000",
      kink: "850000000000000000",
    },
  },
};

export const XTOKEN_DEPLOY_ARGS: XTokenDeployArg[] = [
  {
    name: "xBank Ether",
    symbol: "xETH",
    underlyingToken: "ETH",
    underlying: constants.AddressZero,
    type: XTokenType.XEtherImmutable,
    interestRateModel: chainConfig.InterestRateModels.xETH,
    initialExchangeRate: "200000000000000000000000000", // 0.02
    decimals: 8,
  },
  {
    name: "xBank USD Coin",
    symbol: "xUSDC",
    underlyingToken: "USDC",
    underlying: chainConfig.tokens.USDC,
    type: XTokenType.XErc20Immutable,
    interestRateModel: chainConfig.InterestRateModels.xUSDC,
    initialExchangeRate: "200000000000000", // 0.02
    decimals: 8,
  },
];
