// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.10;

import { XTokenBase } from "@xbank-zkera/X/Bases/XTokenBase.sol";

abstract contract PriceOracleAbstract {
  /// @notice Indicator that this is a PriceOracle contract (for inspection)
  bool public constant isPriceOracle = true;

  /**
   * @notice Get the underlying price of a xToken asset
   * @param xToken The xToken to get the underlying price of
   * @return The underlying asset price mantissa (scaled by 1e18).
   *  Zero means the price is unavailable.
   */
  function getUnderlyingPrice(
    XTokenBase xToken
  ) external view virtual returns (uint);
}
