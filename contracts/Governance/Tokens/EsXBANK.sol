// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.10;

import { BaseBridgeableToken } from "../Base/BaseBridgeableToken.sol";

contract EsXB is BaseBridgeableToken {
  constructor(
    bool isBurnAndMint_
  )
    BaseBridgeableToken(
      "Escrowed xBANK",
      "esXBANK",
      18,
      type(uint256).max,
      type(uint256).max,
      isBurnAndMint_
    )
  {}
}
