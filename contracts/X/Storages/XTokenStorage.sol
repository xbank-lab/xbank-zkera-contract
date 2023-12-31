// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.10;

import { XesAbstract } from "@xbank-zkera/Xes/Abstracts/XesAbstract.sol";
import { InterestRateModelAbstract } from "@xbank-zkera/InterestModels/Abstracts/InterestRateModelAbstract.sol";

contract XTokenStorage {
  /**
   * @dev Guard variable for re-entrancy checks
   */
  bool internal _notEntered;

  /**
   * @notice EIP-20 token name for this token
   */
  string public name;

  /**
   * @notice EIP-20 token symbol for this token
   */
  string public symbol;

  /**
   * @notice EIP-20 token decimals for this token
   */
  uint8 public decimals;

  // Maximum borrow rate that can ever be applied (.00005% / sec)
  uint internal constant borrowRateMaxMantissa = 0.00005e16;

  // Maximum fraction of interest that can be set aside for reserves
  uint internal constant reserveFactorMaxMantissa = 1e18;

  /**
   * @notice Administrator for this contract
   */
  address payable public admin;

  /**
   * @notice Pending administrator for this contract
   */
  address payable public pendingAdmin;

  /**
   * @notice Contract which oversees inter-cToken operations
   */
  XesAbstract public comptroller;

  /**
   * @notice Model which tells what the current interest rate should be
   */
  InterestRateModelAbstract public interestRateModel;

  // Initial exchange rate used when minting the first CTokens (used when totalSupply = 0)
  uint internal initialExchangeRateMantissa;

  /**
   * @notice Fraction of interest currently set aside for reserves
   */
  uint public reserveFactorMantissa;

  /**
   * @notice Timestamp that interest was last accrued at
   * @dev Modified from accrualBlockNumber
   */
  uint public accrualTimestamp;

  /**
   * @notice Accumulator of the total earned interest rate since the opening of the market
   */
  uint public borrowIndex;

  /**
   * @notice Total amount of outstanding borrows of the underlying in this market
   */
  uint public totalBorrows;

  /**
   * @notice Total amount of reserves of the underlying held in this market
   */
  uint public totalReserves;

  /**
   * @notice Total number of tokens in circulation
   */
  uint public totalSupply;

  // Official record of token balances for each account
  mapping(address => uint) internal accountTokens;

  // Approved token transfer amounts on behalf of others
  mapping(address => mapping(address => uint)) internal transferAllowances;

  /**
   * @notice Container for borrow balance information
   * @member principal Total balance (with accrued interest), after applying the most recent balance-changing action
   * @member interestIndex Global borrowIndex as of the most recent balance-changing action
   */
  struct BorrowSnapshot {
    uint principal;
    uint interestIndex;
  }

  // Mapping of account addresses to outstanding borrow balances
  mapping(address => BorrowSnapshot) internal accountBorrows;

  /**
   * @notice Share of seized collateral that is added to reserves
   */
  uint public constant protocolSeizeShareMantissa = 2.8e16; //2.8%
}
