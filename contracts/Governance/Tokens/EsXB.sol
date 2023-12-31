// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.10;

import { ERC20PresetMinterPauserUpgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC20/presets/ERC20PresetMinterPauserUpgradeable.sol";

contract EsXB is ERC20PresetMinterPauserUpgradeable {
  address public transferGuard;
  mapping(address => bool) public allowedFroms;
  mapping(address => bool) public allowedTos;

  event UpdateAllowedFroms(address transferGuard, address from, bool allowance);

  event UpdateAllowedTos(address transferGuard, address to, bool allowance);

  event UpdateTransferGuard(address transferGuard, address newTransferGuard);

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

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

  function updateTransferGuard(address newTransferGuard) external {
    require(transferGuard == _msgSender(), "Update transferGuard not allowed");
    require(newTransferGuard != address(0), "Invalid newTransferGuard address");
    transferGuard = newTransferGuard;
    emit UpdateTransferGuard(transferGuard, newTransferGuard);
  }

  function updateAllowedFrom(address from, bool allowance) external {
    require(
      transferGuard == _msgSender(),
      "Only transferGuard can updateAllowedFrom"
    );
    allowedFroms[from] = allowance;
    emit UpdateAllowedFroms(transferGuard, from, allowance);
  }

  function updateAllowedTo(address to, bool allowance) external {
    require(
      transferGuard == _msgSender(),
      "Only transferGuard can updateAllowedTo"
    );
    allowedTos[to] = allowance;
    emit UpdateAllowedTos(transferGuard, to, allowance);
  }

  function transfer(address to, uint256 amount) public override returns (bool) {
    address owner = _msgSender();
    require(
      transferGuard == owner || allowedFroms[owner] || allowedTos[to],
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
      transferGuard == _msgSender() || allowedFroms[from] || allowedTos[to],
      "Transfer not allowed"
    );
    _transfer(from, to, amount);
    return true;
  }
}
