import { InterestRateModelType } from "../../utils/enums";
import { InterestRateModelConfigs } from "../../utils/interfaces";

export const INTEREST_RATE_MODEL: InterestRateModelConfigs = {
  IRM_ETH_Updateable: {
    name: "IRM_ETH_Updateable",
    type: InterestRateModelType.BaseJumpRateModelV2,
    args: {
      baseRatePerYear: "0",
      multiplierPerYear: "100000000000000000",
      jumpMultiplierPerYear: "9333333333333333333",
      kink: "850000000000000000",
      owner: "0x00",
    },
  },
  IRM_STABLES_Updateable: {
    name: "IRM_STABLES_Updateable",
    type: InterestRateModelType.BaseJumpRateModelV2,
    args: {
      baseRatePerYear: "0",
      multiplierPerYear: "100000000000000000",
      jumpMultiplierPerYear: "9333333333333333333",
      kink: "850000000000000000",
      owner: "0x00",
    },
  },
};
