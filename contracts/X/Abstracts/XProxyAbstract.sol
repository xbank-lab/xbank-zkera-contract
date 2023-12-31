// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.10;

import { XDelegationStorage } from "@xbank-zkera/X/Storages/XDelegationStorage.sol";

abstract contract XProxyAbstract is XDelegationStorage {
  /**
   * @notice Emitted when implementation is changed
   */
  event NewImplementation(address oldImplementation, address newImplementation);

  /**
   * @notice Called by the admin to update the implementation of the delegator
   * @param implementation_ The address of the new implementation for delegation
   * @param allowResign Flag to indicate whether to call _resignImplementation on the old implementation
   * @param becomeImplementationData The encoded bytes data to be passed to _becomeImplementation
   */
  function _setImplementation(
    address implementation_,
    bool allowResign,
    bytes memory becomeImplementationData
  ) external virtual;
}
