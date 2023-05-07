// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.10;

import { ComptrollerAbstract } from "@xbank-zkera/Abstracts/ComptrollerAbstract.sol";
import { InterestRateModelAbstract } from "@xbank-zkera/InterestModels/Abstracts/InterestRateModelAbstract.sol";
import { XTokenStorage } from "@xbank-zkera/X/Storages/XTokenStorage.sol";

abstract contract XTokenAbstract is XTokenStorage {
  /**
   * @notice Indicator that this is a CToken contract (for inspection)
   */
  bool public constant isCToken = true;

  /*** Market Events ***/

  /**
   * @notice Event emitted when interest is accrued
   */
  event AccrueInterest(
    uint cashPrior,
    uint interestAccumulated,
    uint borrowIndex,
    uint totalBorrows
  );

  /**
   * @notice Event emitted when tokens are minted
   */
  event Mint(address minter, uint mintAmount, uint mintTokens);

  /**
   * @notice Event emitted when tokens are redeemed
   */
  event Redeem(address redeemer, uint redeemAmount, uint redeemTokens);

  /**
   * @notice Event emitted when underlying is borrowed
   */
  event Borrow(
    address borrower,
    uint borrowAmount,
    uint accountBorrows,
    uint totalBorrows
  );

  /**
   * @notice Event emitted when a borrow is repaid
   */
  event RepayBorrow(
    address payer,
    address borrower,
    uint repayAmount,
    uint accountBorrows,
    uint totalBorrows
  );

  /**
   * @notice Event emitted when a borrow is liquidated
   */
  event LiquidateBorrow(
    address liquidator,
    address borrower,
    uint repayAmount,
    address cTokenCollateral,
    uint seizeTokens
  );

  /*** Admin Events ***/

  /**
   * @notice Event emitted when pendingAdmin is changed
   */
  event NewPendingAdmin(address oldPendingAdmin, address newPendingAdmin);

  /**
   * @notice Event emitted when pendingAdmin is accepted, which means admin is updated
   */
  event NewAdmin(address oldAdmin, address newAdmin);

  /**
   * @notice Event emitted when comptroller is changed
   */
  event NewComptroller(
    ComptrollerAbstract oldComptroller,
    ComptrollerAbstract newComptroller
  );

  /**
   * @notice Event emitted when interestRateModel is changed
   */
  event NewMarketInterestRateModel(
    InterestRateModelAbstract oldInterestRateModel,
    InterestRateModelAbstract newInterestRateModel
  );

  /**
   * @notice Event emitted when the reserve factor is changed
   */
  event NewReserveFactor(
    uint oldReserveFactorMantissa,
    uint newReserveFactorMantissa
  );

  /**
   * @notice Event emitted when the reserves are added
   */
  event ReservesAdded(
    address benefactor,
    uint addAmount,
    uint newTotalReserves
  );

  /**
   * @notice Event emitted when the reserves are reduced
   */
  event ReservesReduced(
    address admin,
    uint reduceAmount,
    uint newTotalReserves
  );

  /**
   * @notice EIP20 Transfer event
   */
  event Transfer(address indexed from, address indexed to, uint amount);

  /**
   * @notice EIP20 Approval event
   */
  event Approval(address indexed owner, address indexed spender, uint amount);

  /*** User Interface ***/

  function transfer(address dst, uint amount) external virtual returns (bool);

  function transferFrom(
    address src,
    address dst,
    uint amount
  ) external virtual returns (bool);

  function approve(
    address spender,
    uint amount
  ) external virtual returns (bool);

  function allowance(
    address owner,
    address spender
  ) external view virtual returns (uint);

  function balanceOf(address owner) external view virtual returns (uint);

  function balanceOfUnderlying(address owner) external virtual returns (uint);

  function getAccountSnapshot(
    address account
  ) external view virtual returns (uint, uint, uint, uint);

  function borrowRatePerBlock() external view virtual returns (uint);

  function supplyRatePerBlock() external view virtual returns (uint);

  function totalBorrowsCurrent() external virtual returns (uint);

  function borrowBalanceCurrent(
    address account
  ) external virtual returns (uint);

  function borrowBalanceStored(
    address account
  ) external view virtual returns (uint);

  function exchangeRateCurrent() external virtual returns (uint);

  function exchangeRateStored() external view virtual returns (uint);

  function getCash() external view virtual returns (uint);

  function accrueInterest() external virtual returns (uint);

  function seize(
    address liquidator,
    address borrower,
    uint seizeTokens
  ) external virtual returns (uint);

  /*** Admin Functions ***/

  function _setPendingAdmin(
    address payable newPendingAdmin
  ) external virtual returns (uint);

  function _acceptAdmin() external virtual returns (uint);

  function _setComptroller(
    ComptrollerAbstract newComptroller
  ) external virtual returns (uint);

  function _setReserveFactor(
    uint newReserveFactorMantissa
  ) external virtual returns (uint);

  function _reduceReserves(uint reduceAmount) external virtual returns (uint);

  function _setInterestRateModel(
    InterestRateModelAbstract newInterestRateModel
  ) external virtual returns (uint);
}
