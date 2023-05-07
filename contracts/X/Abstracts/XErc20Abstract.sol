// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.10;

import { XTokenAbstract } from "@xbank-zkera/X/Abstracts/XTokenAbstract.sol";
import { XErc20Storage } from "@xbank-zkera/X/Storages/XErc20Storage.sol";
import { Erc20NonStandardInterface } from "@xbank-zkera/Interfaces/Erc20NonStandardInterface.sol";

abstract contract XErc20Abstract is XErc20Storage {
  /*** User Interface ***/

  function mint(uint mintAmount) external virtual returns (uint);

  function redeem(uint redeemTokens) external virtual returns (uint);

  function redeemUnderlying(uint redeemAmount) external virtual returns (uint);

  function borrow(uint borrowAmount) external virtual returns (uint);

  function repayBorrow(uint repayAmount) external virtual returns (uint);

  function repayBorrowBehalf(
    address borrower,
    uint repayAmount
  ) external virtual returns (uint);

  function liquidateBorrow(
    address borrower,
    uint repayAmount,
    XTokenAbstract xTokenCollateral
  ) external virtual returns (uint);

  function sweepToken(Erc20NonStandardInterface token) external virtual;

  /*** Admin Functions ***/

  function _addReserves(uint addAmount) external virtual returns (uint);
}
