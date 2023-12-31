// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.10;

import { XDelegationStorage } from "@xbank-zkera/X/Storages/XDelegationStorage.sol";

abstract contract XImplAbstract is XDelegationStorage {
  /**
   * @notice Called by the delegator on a delegate to initialize it for duty
   * @dev Should revert if any issues arise which make it unfit for delegation
   * @param data The encoded bytes data for any initialization
   */
  function _becomeImplementation(bytes memory data) external virtual;

  /**
   * @notice Called by the delegator on a delegate to forfeit its responsibility
   */
  function _resignImplementation() external virtual;
}
