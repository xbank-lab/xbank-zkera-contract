// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.10;

import { OFTV2 } from "@layer-zero/contracts/token/oft/v2/OFTV2.sol";

contract RemoteXB is OFTV2 {
  constructor(
    address _layerZeroEndpoint,
    uint8 _sharedDecimals
  ) OFTV2("XB", "XB", _sharedDecimals, _layerZeroEndpoint) {}
}
