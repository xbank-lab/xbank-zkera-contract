// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.10;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract EsXBANK is ERC20 {
  constructor(uint256 _initialSupply) ERC20("Escrowed XBANK", "EsXBANK") {
    _mint(_msgSender(), _initialSupply);
  }
}
