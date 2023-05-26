// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.10;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { PriceOracleAbstract } from "@xbank-zkera/Oracles/Abstracts/PriceOracleAbstract.sol";
import { XTokenBase } from "@xbank-zkera/X/Bases/XTokenBase.sol";
import { XErc20Base } from "@xbank-zkera/X/Bases/XErc20Base.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import { IPyth } from "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import { PythStructs } from "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";

contract PythPriceUpdater is PriceOracleAbstract, Ownable {
  // Pyth contract
  IPyth public pyth;

  /// @notice a map of underlying address to pyth priceID
  mapping(address => bytes32) pythPriceIDs;

  /// @notice a list of all xtokens
  XTokenBase[] public allMarkets;

  // events
  event MarketListed(XTokenBase xToken, bytes32 pythPriceID);

  event PricePosted(
    address asset,
    uint previousPriceMantissa,
    uint requestedPriceMantissa,
    uint newPriceMantissa
  );

  constructor(IPyth _pyth) {
    pyth = _pyth;
  }

  function _supportMarket(
    XTokenBase xToken,
    bytes32 pythPriceID
  ) external onlyOwner returns (XTokenBase) {
    address asset = getUnderlyingAddress(xToken);
    for (uint i = 0; i < allMarkets.length; i++) {
      require(allMarkets[i] != XTokenBase(xToken), "market already added");
    }
    // support market & pythPriceID
    pythPriceIDs[asset] = pythPriceID;
    allMarkets.push(XTokenBase(xToken));
    emit MarketListed(xToken, pythPriceID);
    return xToken;
  }

  function getPythUpdateFee(
    bytes[] memory pythPriceData
  ) public view returns (uint) {
    return pyth.getUpdateFee(pythPriceData);
  }

  function getUnderlyingAddress(
    XTokenBase xToken
  ) public view returns (address) {
    address asset;
    if (compareStrings(xToken.symbol(), "xETH")) {
      asset = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    } else {
      asset = address(XErc20Base(address(xToken)).underlying());
    }
    return asset;
  }

  function getUnderlyingPrice(
    XTokenBase xToken
  ) public view override returns (uint) {
    address asset = getUnderlyingAddress(xToken);
    PythStructs.Price memory pythPriceData = pyth.getPrice(pythPriceIDs[asset]);
    return _toXesPriceDecimals(xToken, pythPriceData);
  }

  function getUnderlyingPriceUnformatted(
    XTokenBase xToken
  ) public view returns (uint) {
    address asset = getUnderlyingAddress(xToken);
    PythStructs.Price memory pythPriceData = pyth.getPrice(pythPriceIDs[asset]);
    uint price = uint(int256(pythPriceData.price));
    uint expo = uint(int256(pythPriceData.expo));
    return price * (uint(10) ** (expo + 18));
  }

  function setPythPrices(bytes[] calldata pythPriceData) public payable {
    uint fee = pyth.getUpdateFee(pythPriceData);
    pyth.updatePriceFeeds{ value: fee }(pythPriceData);
    for (uint i = 0; i < allMarkets.length; i++) {
      address asset = getUnderlyingAddress(allMarkets[i]);
      uint underlyingPriceMantissa = getUnderlyingPrice(allMarkets[i]);
      emit PricePosted(
        asset,
        0, // ignore previous price to save gas to get
        underlyingPriceMantissa,
        underlyingPriceMantissa
      );
    }
  }

  function _toXesPriceDecimals(
    XTokenBase xToken,
    PythStructs.Price memory pythPriceData
  ) internal view returns (uint) {
    // price decimals = 18 - underlying.decimals + 18
    uint price = uint(int256(pythPriceData.price));
    uint expo = uint(int256(pythPriceData.expo));
    if (compareStrings(xToken.symbol(), "xETH")) {
      return price * (uint(10) ** uint(expo + 18));
    } else {
      return
        price *
        (10 **
          (expo +
            36 -
            ERC20(XErc20Base(address(xToken)).underlying()).decimals()));
    }
  }

  function compareStrings(
    string memory a,
    string memory b
  ) internal pure returns (bool) {
    return (keccak256(abi.encodePacked((a))) ==
      keccak256(abi.encodePacked((b))));
  }
}
