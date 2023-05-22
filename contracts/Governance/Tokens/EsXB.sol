// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.10;

import { ERC20PresetMinterPauserUpgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC20/presets/ERC20PresetMinterPauserUpgradeable.sol";

contract EsXB is ERC20PresetMinterPauserUpgradeable {
  address public transferGuard = address(0);
  mapping(address => bool) public allowedFroms;

  event UpdateAllowedFroms(address transferGuard, address from, bool allowance);

  event UpdateTransferGuard(address transferGuard, address newTransferGuard);

  function initialize(
    string memory name,
    string memory symbol
  ) public virtual override initializer {
    ERC20PresetMinterPauserUpgradeable.__ERC20PresetMinterPauser_init(
      name,
      symbol
    );
    transferGuard = _msgSender();
  }

  function updateTransferGuard(address newTransferGuard) public returns (bool) {
    require(transferGuard == _msgSender(), "Update transferGuard not allowed");
    require(newTransferGuard != address(0), "Invalid newTransferGuard address");
    transferGuard = newTransferGuard;
    emit UpdateTransferGuard(transferGuard, newTransferGuard);
    return true;
  }

  function updateAllowedFrom(
    address from,
    bool allowance
  ) public returns (bool) {
    require(
      transferGuard == _msgSender(),
      "Only transferGuard can updateAllowedFrom"
    );
    allowedFroms[from] = allowance;
    emit UpdateAllowedFroms(transferGuard, from, allowance);
    return true;
  }

  function transfer(address to, uint256 amount) public override returns (bool) {
    address owner = _msgSender();
    require(
      transferGuard == owner || allowedFroms[owner],
      "Transfer not allowed"
    );
    _transfer(owner, to, amount);
    return true;
  }

  function transferFrom(
    address from,
    address to,
    uint256 amount
  ) public override returns (bool) {
    require(
      transferGuard == _msgSender() || allowedFroms[from],
      "Transfer not allowed"
    );
    _transfer(from, to, amount);
    return true;
  }
}
