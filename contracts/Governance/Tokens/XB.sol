// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.10;

import {BaseBridgeableToken} from "../Base/BaseBridgeableToken.sol";

contract XB is BaseBridgeableToken {
  constructor(
    bool isBurnAndMint_
  )
    BaseBridgeableToken(
      "xBANK token",
      "XB",
      18,
      1_000_000 ether,
      10_000_000 ether,
      isBurnAndMint_
    )
  {}
}
