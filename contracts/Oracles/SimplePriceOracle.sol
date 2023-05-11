// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.10;

import { PriceOracleAbstract } from "@xbank-zkera/Oracles/Abstracts/PriceOracleAbstract.sol";
import { XTokenBase } from "@xbank-zkera/X/Bases/XTokenBase.sol";
import { XErc20Base } from "@xbank-zkera/X/Bases/XErc20Base.sol";

contract SimplePriceOracle is PriceOracleAbstract {
  mapping(address => uint) prices;
  event PricePosted(
    address asset,
    uint previousPriceMantissa,
    uint requestedPriceMantissa,
    uint newPriceMantissa
  );

  function _getUnderlyingAddress(
    XTokenBase xToken
  ) private view returns (address) {
    address asset;
    if (compareStrings(xToken.symbol(), "cETH")) {
      asset = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    } else {
      asset = address(XErc20Base(address(xToken)).underlying());
    }
    return asset;
  }

  function getUnderlyingPrice(
    XTokenBase xToken
  ) public view override returns (uint) {
    return prices[_getUnderlyingAddress(xToken)];
  }

  function setUnderlyingPrice(
    XTokenBase xToken,
    uint underlyingPriceMantissa
  ) public {
    address asset = _getUnderlyingAddress(xToken);
    emit PricePosted(
      asset,
      prices[asset],
      underlyingPriceMantissa,
      underlyingPriceMantissa
    );
    prices[asset] = underlyingPriceMantissa;
  }

  function setDirectPrice(address asset, uint price) public {
    emit PricePosted(asset, prices[asset], price, price);
    prices[asset] = price;
  }

  // v1 price oracle interface for use as backing of proxy
  function assetPrices(address asset) external view returns (uint) {
    return prices[asset];
  }

  function compareStrings(
    string memory a,
    string memory b
  ) internal pure returns (bool) {
    return (keccak256(abi.encodePacked((a))) ==
      keccak256(abi.encodePacked((b))));
  }
}
