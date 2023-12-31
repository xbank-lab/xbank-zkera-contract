// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.10;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract XB is ERC20 {
  constructor(uint256 _initialSupply) ERC20("XBANK", "XB") {
    _mint(_msgSender(), _initialSupply);
  }
}
