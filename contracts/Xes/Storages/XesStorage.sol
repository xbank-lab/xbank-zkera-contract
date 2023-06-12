// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.10;

import { XesProxyStorage } from "@xbank-zkera/Xes/Storages/XesProxyStorage.sol";
import { PriceOracleAbstract } from "@xbank-zkera/Oracles/Abstracts/PriceOracleAbstract.sol";
import { XTokenBase } from "@xbank-zkera/X/Bases/XTokenBase.sol";

contract XesStorage is XesProxyStorage {
  /**
   * @notice Oracle which gives the price of any given asset
   */
  PriceOracleAbstract public oracle;

  /**
   * @notice Multiplier used to calculate the maximum repayAmount when liquidating a borrow
   */
  uint public closeFactorMantissa;

  /**
   * @notice Multiplier representing the discount on collateral that a liquidator receives
   */
  uint public liquidationIncentiveMantissa;

  /**
   * @notice Max number of assets a single account can participate in (borrow or use as collateral)
   */
  uint public maxAssets;

  /**
   * @notice Per-account mapping of "assets you are in", capped by maxAssets
   */
  mapping(address => XTokenBase[]) public accountAssets;

  // From ComptrollerV2Storage
  struct Market {
    // Whether or not this market is listed
    bool isListed;
    //  Multiplier representing the most one can borrow against their collateral in this market.
    //  For instance, 0.9 to allow borrowing 90% of collateral value.
    //  Must be between 0 and 1, and stored as a mantissa.
    uint collateralFactorMantissa;
    // Per-market mapping of "accounts in this asset"
    mapping(address => bool) accountMembership;
    // Whether or not this market receives COMP
    bool isComped;
  }

  /**
   * @notice Official mapping of cTokens -> Market metadata
   * @dev Used e.g. to determine if a market is supported
   */
  mapping(address => Market) public markets;

  /**
   * @notice The Pause Guardian can pause certain actions as a safety mechanism.
   *  Actions which allow users to remove their own assets cannot be paused.
   *  Liquidation / seizing / transfer can only be paused globally, not by market.
   */
  address public pauseGuardian;
  bool public _mintGuardianPaused;
  bool public _borrowGuardianPaused;
  bool public transferGuardianPaused;
  bool public seizeGuardianPaused;
  mapping(address => bool) public mintGuardianPaused;
  mapping(address => bool) public borrowGuardianPaused;

  // From ComptrollerV3Storage
  struct CompMarketState {
    // The market's last updated compBorrowIndex or compSupplyIndex
    uint224 index;
    // The timestamp the index was last updated at
    // @dev Modified from block
    uint32 timestamp;
  }

  /// @notice A list of all markets
  XTokenBase[] public allMarkets;

  /// @notice The rate at which the flywheel distributes COMP, per block
  uint public compRate;

  /// @notice The portion of compRate that each market currently receives
  mapping(address => uint) public compSpeeds;

  /// @notice The COMP market supply state for each market
  mapping(address => CompMarketState) public compSupplyState;

  /// @notice The COMP market borrow state for each market
  mapping(address => CompMarketState) public compBorrowState;

  /// @notice The COMP borrow index for each market for each supplier as of the last time they accrued COMP
  mapping(address => mapping(address => uint)) public compSupplierIndex;

  /// @notice The COMP borrow index for each market for each borrower as of the last time they accrued COMP
  mapping(address => mapping(address => uint)) public compBorrowerIndex;

  /// @notice The COMP accrued but not yet transferred to each user
  mapping(address => uint) public compAccrued;

  // From ComptrollerV4Storage
  // @notice The borrowCapGuardian can set borrowCaps to any number for any market. Lowering the borrow cap could disable borrowing on the given market.
  address public borrowCapGuardian;

  // @notice Borrow caps enforced by borrowAllowed for each cToken address. Defaults to zero which corresponds to unlimited borrowing.
  mapping(address => uint) public borrowCaps;

  // From ComptrollerV5Storage
  /// @notice The portion of COMP that each contributor receives per block
  mapping(address => uint) public compContributorSpeeds;

  /// @notice Last timestamp at which a contributor's COMP rewards have been allocated
  /// @dev modified from lastContributorBlock
  mapping(address => uint) public lastContributorTimestamp;

  // From ComptrollerV6Storage
  /// @notice The rate at which comp is distributed to the corresponding borrow market (per block)
  mapping(address => uint) public compBorrowSpeeds;

  /// @notice The rate at which comp is distributed to the corresponding supply market (per block)
  mapping(address => uint) public compSupplySpeeds;

  // From ComptrollerV7Storage
  /// @notice Flag indicating whether the function to fix COMP accruals has been executed (RE: proposal 62 bug)
  bool public proposal65FixExecuted;

  /// @notice Accounting storage mapping account addresses to how much COMP they owe the protocol.
  mapping(address => uint) public compReceivable;

  // From ComptrollerV8Storage
  /// @notice Governance distribution token
  address public distributionToken;
}
