// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.10;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import { PriceOracleAbstract } from "@xbank-zkera/Oracles/Abstracts/PriceOracleAbstract.sol";
import { XTokenBase } from "@xbank-zkera/X/Bases/XTokenBase.sol";
import { XErc20Base } from "@xbank-zkera/X/Bases/XErc20Base.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";

contract PythPriceUpdater is PriceOracleAbstract, Ownable {
  using SafeCast for int256;
  using SafeCast for uint256;
  using SafeCast for int32;

  // Pyth contract
  IPyth public pyth;

  /// @notice a map of underlying address to pyth priceID
  mapping(address => bytes32) public pythPriceIDs;

  uint256 public maxPriceAge;

  uint256 public constant MAXIMUM_PRICE_AGE = 4200; // 1 hr 10 min

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

  event SetMaxPriceAge(uint256 maxPriceAge);

  constructor(IPyth _pyth) {
    require(address(_pyth) != address(0), "Invalid Pyth address");

    pyth = _pyth;
    maxPriceAge = MAXIMUM_PRICE_AGE;

    // sanity check
    pyth.getValidTimePeriod();
  }

  function supportMarket(
    XTokenBase xToken,
    bytes32 pythPriceID
  ) external onlyOwner returns (XTokenBase) {
    require(address(xToken) != address(0), "Invalid new market address");
    address asset = getUnderlyingAddress(xToken);
    for (uint i = 0; i < allMarkets.length; i++) {
      require(allMarkets[i] != XTokenBase(xToken), "Market already added");
    }
    // support market & pythPriceID
    pythPriceIDs[asset] = pythPriceID;
    allMarkets.push(XTokenBase(xToken));
    emit MarketListed(xToken, pythPriceID);
    return xToken;
  }

  function setMaxPriceAge(uint256 _maxPriceAge) external onlyOwner {
    require(_maxPriceAge < MAXIMUM_PRICE_AGE, "Invalid maxPriceAge");
    maxPriceAge = _maxPriceAge;
    emit SetMaxPriceAge(_maxPriceAge);
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
    PythStructs.Price memory pythPriceData = pyth.getPriceNoOlderThan(
      pythPriceIDs[asset],
      maxPriceAge
    );
    return _toXesPriceDecimals(xToken, pythPriceData);
  }

  function getPythPrice(
    bytes32 priceID
  ) public view returns (PythStructs.Price memory) {
    return pyth.getPriceNoOlderThan(priceID, maxPriceAge);
  }

  function getUnderlyingPythPrice(
    XTokenBase xToken
  ) public view returns (PythStructs.Price memory) {
    address asset = getUnderlyingAddress(xToken);
    return pyth.getPriceNoOlderThan(pythPriceIDs[asset], maxPriceAge);
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
    uint xesPricePrecision;
    // price decimals = 18 - underlying.decimals + 18
    if (compareStrings(xToken.symbol(), "xETH")) {
      xesPricePrecision = 10 ** 18;
    } else {
      xesPricePrecision =
        10 ** (36 - ERC20(XErc20Base(address(xToken)).underlying()).decimals());
    }
    uint256 pythPriceDecimals = pythPriceData.expo < 0
      ? (10 ** int256(-pythPriceData.expo).toUint256())
      : 10 ** int256(pythPriceData.expo).toUint256();
    return
      ((int256(pythPriceData.price)).toUint256() * xesPricePrecision) /
      pythPriceDecimals;
  }

  function compareStrings(
    string memory a,
    string memory b
  ) internal pure returns (bool) {
    return (keccak256(abi.encodePacked((a))) ==
      keccak256(abi.encodePacked((b))));
  }
}
