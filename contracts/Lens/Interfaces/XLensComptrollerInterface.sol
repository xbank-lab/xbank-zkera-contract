// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.10;

import { PriceOracleAbstract } from "@xbank-zkera/Oracles/Abstracts/PriceOracleAbstract.sol";
import { XTokenBase } from "@xbank-zkera/X/Bases/XTokenBase.sol";

interface XLensComptrollerInterface {
  function markets(address) external view returns (bool, uint);

  function oracle() external view returns (PriceOracleAbstract);

  function getAccountLiquidity(
    address
  ) external view returns (uint, uint, uint);

  function getAssetsIn(address) external view returns (XTokenBase[] memory);

  function claimComp(address) external;

  function compAccrued(address) external view returns (uint);

  function compSpeeds(address) external view returns (uint);

  function compSupplySpeeds(address) external view returns (uint);

  function compBorrowSpeeds(address) external view returns (uint);

  function borrowCaps(address) external view returns (uint);
}
