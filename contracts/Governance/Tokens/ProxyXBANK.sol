// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.10;

import { ProxyOFTV2 } from "@layer-zero/contracts/token/oft/v2/ProxyOFTV2.sol";

contract ProxyXBANK is ProxyOFTV2 {
  constructor(
    address _token,
    uint8 _sharedDecimals,
    address _lzEndpoint
  ) ProxyOFTV2(_token, _sharedDecimals, _lzEndpoint) {}
}
