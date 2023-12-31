// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.10;

import { BaseJumpRateModelV2 } from "@xbank-zkera/InterestModels/Abstracts/BaseJumpRateModelV2.sol";

/**
 * @title Compound's JumpRateModel Contract V2 for V2 cTokens
 * @author Arr00
 * @notice Supports only for V2 cTokens
 */
contract JumpRateModelV2 is BaseJumpRateModelV2 {
  /**
   * @notice Calculates the current borrow rate per sec
   * @param cash The amount of cash in the market
   * @param borrows The amount of borrows in the market
   * @param reserves The amount of reserves in the market
   * @return The borrow rate percentage per sec as a mantissa (scaled by 1e18)
   */
  function getBorrowRate(
    uint cash,
    uint borrows,
    uint reserves
  ) external view override returns (uint) {
    return getBorrowRateInternal(cash, borrows, reserves);
  }

  constructor(
    uint baseRatePerYear,
    uint multiplierPerYear,
    uint jumpMultiplierPerYear,
    uint kink_,
    address owner_
  )
    BaseJumpRateModelV2(
      baseRatePerYear,
      multiplierPerYear,
      jumpMultiplierPerYear,
      kink_,
      owner_
    )
  {}
}
