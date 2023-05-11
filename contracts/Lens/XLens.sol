// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.10;

import { XErc20Base } from "@xbank-zkera/X/Bases/XErc20Base.sol";
import { XTokenBase } from "@xbank-zkera/X/Bases/XTokenBase.sol";
import { PriceOracleAbstract } from "@xbank-zkera/Oracles/Abstracts/PriceOracleAbstract.sol";
import { Erc20Interface } from "@xbank-zkera/Interfaces/Erc20Interface.sol";
import { GovernorAlpha } from "@xbank-zkera/Governance/GovernorAlpha.sol";
import { Comp } from "@xbank-zkera/Governance/Comp.sol";
import { XLensComptrollerInterface } from "@xbank-zkera/Lens/Interfaces/XLensComptrollerInterface.sol";
import { GovernorBravoInterface } from "@xbank-zkera/Lens/Interfaces/GovernorBravoInterface.sol";

contract XLens {
  struct XTokenMetadata {
    address cToken;
    uint exchangeRateCurrent;
    uint supplyRatePerBlock;
    uint borrowRatePerBlock;
    uint reserveFactorMantissa;
    uint totalBorrows;
    uint totalReserves;
    uint totalSupply;
    uint totalCash;
    bool isListed;
    uint collateralFactorMantissa;
    address underlyingAssetAddress;
    uint cTokenDecimals;
    uint underlyingDecimals;
    uint compSupplySpeed;
    uint compBorrowSpeed;
    uint borrowCap;
  }

  function getCompSpeeds(
    XLensComptrollerInterface comptroller,
    XTokenBase xToken
  ) internal returns (uint, uint) {
    // Getting comp speeds is gnarly due to not every network having the
    // split comp speeds from Proposal 62 and other networks don't even
    // have comp speeds.
    uint compSupplySpeed = 0;
    (
      bool compSupplySpeedSuccess,
      bytes memory compSupplySpeedReturnData
    ) = address(comptroller).call(
        abi.encodePacked(
          comptroller.compSupplySpeeds.selector,
          abi.encode(address(xToken))
        )
      );
    if (compSupplySpeedSuccess) {
      compSupplySpeed = abi.decode(compSupplySpeedReturnData, (uint));
    }

    uint compBorrowSpeed = 0;
    (
      bool compBorrowSpeedSuccess,
      bytes memory compBorrowSpeedReturnData
    ) = address(comptroller).call(
        abi.encodePacked(
          comptroller.compBorrowSpeeds.selector,
          abi.encode(address(xToken))
        )
      );
    if (compBorrowSpeedSuccess) {
      compBorrowSpeed = abi.decode(compBorrowSpeedReturnData, (uint));
    }

    // If the split comp speeds call doesn't work, try the  oldest non-spit version.
    if (!compSupplySpeedSuccess || !compBorrowSpeedSuccess) {
      (bool compSpeedSuccess, bytes memory compSpeedReturnData) = address(
        comptroller
      ).call(
          abi.encodePacked(
            comptroller.compSpeeds.selector,
            abi.encode(address(xToken))
          )
        );
      if (compSpeedSuccess) {
        compSupplySpeed = compBorrowSpeed = abi.decode(
          compSpeedReturnData,
          (uint)
        );
      }
    }
    return (compSupplySpeed, compBorrowSpeed);
  }

  function xTokenMetadata(
    XTokenBase xToken
  ) public returns (XTokenMetadata memory) {
    uint exchangeRateCurrent = xToken.exchangeRateCurrent();
    XLensComptrollerInterface comptroller = XLensComptrollerInterface(
      address(xToken.comptroller())
    );
    (bool isListed, uint collateralFactorMantissa) = comptroller.markets(
      address(xToken)
    );
    address underlyingAssetAddress;
    uint underlyingDecimals;

    if (compareStrings(xToken.symbol(), "cETH")) {
      underlyingAssetAddress = address(0);
      underlyingDecimals = 18;
    } else {
      XErc20Base xErc20 = XErc20Base(address(xToken));
      underlyingAssetAddress = xErc20.underlying();
      underlyingDecimals = Erc20Interface(xErc20.underlying()).decimals();
    }

    (uint compSupplySpeed, uint compBorrowSpeed) = getCompSpeeds(
      comptroller,
      xToken
    );

    uint borrowCap = 0;
    (bool borrowCapSuccess, bytes memory borrowCapReturnData) = address(
      comptroller
    ).call(
        abi.encodePacked(
          comptroller.borrowCaps.selector,
          abi.encode(address(xToken))
        )
      );
    if (borrowCapSuccess) {
      borrowCap = abi.decode(borrowCapReturnData, (uint));
    }

    return
      XTokenMetadata({
        cToken: address(xToken),
        exchangeRateCurrent: exchangeRateCurrent,
        supplyRatePerBlock: xToken.supplyRatePerBlock(),
        borrowRatePerBlock: xToken.borrowRatePerBlock(),
        reserveFactorMantissa: xToken.reserveFactorMantissa(),
        totalBorrows: xToken.totalBorrows(),
        totalReserves: xToken.totalReserves(),
        totalSupply: xToken.totalSupply(),
        totalCash: xToken.getCash(),
        isListed: isListed,
        collateralFactorMantissa: collateralFactorMantissa,
        underlyingAssetAddress: underlyingAssetAddress,
        cTokenDecimals: xToken.decimals(),
        underlyingDecimals: underlyingDecimals,
        compSupplySpeed: compSupplySpeed,
        compBorrowSpeed: compBorrowSpeed,
        borrowCap: borrowCap
      });
  }

  function xTokenMetadataAll(
    XTokenBase[] calldata xTokens
  ) external returns (XTokenMetadata[] memory) {
    uint xTokenCount = xTokens.length;
    XTokenMetadata[] memory res = new XTokenMetadata[](xTokenCount);
    for (uint i = 0; i < xTokenCount; i++) {
      res[i] = xTokenMetadata(xTokens[i]);
    }
    return res;
  }

  struct XTokenBalances {
    address xToken;
    uint balanceOf;
    uint borrowBalanceCurrent;
    uint balanceOfUnderlying;
    uint tokenBalance;
    uint tokenAllowance;
  }

  function xTokenBalances(
    XTokenBase xToken,
    address payable account
  ) public returns (XTokenBalances memory) {
    uint balanceOf = xToken.balanceOf(account);
    uint borrowBalanceCurrent = xToken.borrowBalanceCurrent(account);
    uint balanceOfUnderlying = xToken.balanceOfUnderlying(account);
    uint tokenBalance;
    uint tokenAllowance;

    if (compareStrings(xToken.symbol(), "cETH")) {
      tokenBalance = account.balance;
      tokenAllowance = account.balance;
    } else {
      XErc20Base xErc20 = XErc20Base(address(xToken));
      Erc20Interface underlying = Erc20Interface(xErc20.underlying());
      tokenBalance = underlying.balanceOf(account);
      tokenAllowance = underlying.allowance(account, address(xToken));
    }

    return
      XTokenBalances({
        xToken: address(xToken),
        balanceOf: balanceOf,
        borrowBalanceCurrent: borrowBalanceCurrent,
        balanceOfUnderlying: balanceOfUnderlying,
        tokenBalance: tokenBalance,
        tokenAllowance: tokenAllowance
      });
  }

  function xTokenBalancesAll(
    XTokenBase[] calldata xTokens,
    address payable account
  ) external returns (XTokenBalances[] memory) {
    uint xTokenCount = xTokens.length;
    XTokenBalances[] memory res = new XTokenBalances[](xTokenCount);
    for (uint i = 0; i < xTokenCount; i++) {
      res[i] = xTokenBalances(xTokens[i], account);
    }
    return res;
  }

  struct XTokenUnderlyingPrice {
    address cToken;
    uint underlyingPrice;
  }

  function xTokenUnderlyingPrice(
    XTokenBase xToken
  ) public view returns (XTokenUnderlyingPrice memory) {
    XLensComptrollerInterface comptroller = XLensComptrollerInterface(
      address(xToken.comptroller())
    );
    PriceOracleAbstract priceOracle = comptroller.oracle();

    return
      XTokenUnderlyingPrice({
        cToken: address(xToken),
        underlyingPrice: priceOracle.getUnderlyingPrice(xToken)
      });
  }

  function xTokenUnderlyingPriceAll(
    XTokenBase[] calldata xTokens
  ) external view returns (XTokenUnderlyingPrice[] memory) {
    uint xTokenCount = xTokens.length;
    XTokenUnderlyingPrice[] memory res = new XTokenUnderlyingPrice[](
      xTokenCount
    );
    for (uint i = 0; i < xTokenCount; i++) {
      res[i] = xTokenUnderlyingPrice(xTokens[i]);
    }
    return res;
  }

  struct AccountLimits {
    XTokenBase[] markets;
    uint liquidity;
    uint shortfall;
  }

  function getAccountLimits(
    XLensComptrollerInterface comptroller,
    address account
  ) public view returns (AccountLimits memory) {
    (uint errorCode, uint liquidity, uint shortfall) = comptroller
      .getAccountLiquidity(account);
    require(errorCode == 0);

    return
      AccountLimits({
        markets: comptroller.getAssetsIn(account),
        liquidity: liquidity,
        shortfall: shortfall
      });
  }

  struct GovReceipt {
    uint proposalId;
    bool hasVoted;
    bool support;
    uint96 votes;
  }

  function getGovReceipts(
    GovernorAlpha governor,
    address voter,
    uint[] memory proposalIds
  ) public view returns (GovReceipt[] memory) {
    uint proposalCount = proposalIds.length;
    GovReceipt[] memory res = new GovReceipt[](proposalCount);
    for (uint i = 0; i < proposalCount; i++) {
      GovernorAlpha.Receipt memory receipt = governor.getReceipt(
        proposalIds[i],
        voter
      );
      res[i] = GovReceipt({
        proposalId: proposalIds[i],
        hasVoted: receipt.hasVoted,
        support: receipt.support,
        votes: receipt.votes
      });
    }
    return res;
  }

  struct GovBravoReceipt {
    uint proposalId;
    bool hasVoted;
    uint8 support;
    uint96 votes;
  }

  function getGovBravoReceipts(
    GovernorBravoInterface governor,
    address voter,
    uint[] memory proposalIds
  ) public view returns (GovBravoReceipt[] memory) {
    uint proposalCount = proposalIds.length;
    GovBravoReceipt[] memory res = new GovBravoReceipt[](proposalCount);
    for (uint i = 0; i < proposalCount; i++) {
      GovernorBravoInterface.Receipt memory receipt = governor.getReceipt(
        proposalIds[i],
        voter
      );
      res[i] = GovBravoReceipt({
        proposalId: proposalIds[i],
        hasVoted: receipt.hasVoted,
        support: receipt.support,
        votes: receipt.votes
      });
    }
    return res;
  }

  struct GovProposal {
    uint proposalId;
    address proposer;
    uint eta;
    address[] targets;
    uint[] values;
    string[] signatures;
    bytes[] calldatas;
    uint startBlock;
    uint endBlock;
    uint forVotes;
    uint againstVotes;
    bool canceled;
    bool executed;
  }

  function setProposal(
    GovProposal memory res,
    GovernorAlpha governor,
    uint proposalId
  ) internal view {
    (
      ,
      address proposer,
      uint eta,
      uint startBlock,
      uint endBlock,
      uint forVotes,
      uint againstVotes,
      bool canceled,
      bool executed
    ) = governor.proposals(proposalId);
    res.proposalId = proposalId;
    res.proposer = proposer;
    res.eta = eta;
    res.startBlock = startBlock;
    res.endBlock = endBlock;
    res.forVotes = forVotes;
    res.againstVotes = againstVotes;
    res.canceled = canceled;
    res.executed = executed;
  }

  function getGovProposals(
    GovernorAlpha governor,
    uint[] calldata proposalIds
  ) external view returns (GovProposal[] memory) {
    GovProposal[] memory res = new GovProposal[](proposalIds.length);
    for (uint i = 0; i < proposalIds.length; i++) {
      (
        address[] memory targets,
        uint[] memory values,
        string[] memory signatures,
        bytes[] memory calldatas
      ) = governor.getActions(proposalIds[i]);
      res[i] = GovProposal({
        proposalId: 0,
        proposer: address(0),
        eta: 0,
        targets: targets,
        values: values,
        signatures: signatures,
        calldatas: calldatas,
        startBlock: 0,
        endBlock: 0,
        forVotes: 0,
        againstVotes: 0,
        canceled: false,
        executed: false
      });
      setProposal(res[i], governor, proposalIds[i]);
    }
    return res;
  }

  struct GovBravoProposal {
    uint proposalId;
    address proposer;
    uint eta;
    address[] targets;
    uint[] values;
    string[] signatures;
    bytes[] calldatas;
    uint startBlock;
    uint endBlock;
    uint forVotes;
    uint againstVotes;
    uint abstainVotes;
    bool canceled;
    bool executed;
  }

  function setBravoProposal(
    GovBravoProposal memory res,
    GovernorBravoInterface governor,
    uint proposalId
  ) internal view {
    GovernorBravoInterface.Proposal memory p = governor.proposals(proposalId);

    res.proposalId = proposalId;
    res.proposer = p.proposer;
    res.eta = p.eta;
    res.startBlock = p.startBlock;
    res.endBlock = p.endBlock;
    res.forVotes = p.forVotes;
    res.againstVotes = p.againstVotes;
    res.abstainVotes = p.abstainVotes;
    res.canceled = p.canceled;
    res.executed = p.executed;
  }

  function getGovBravoProposals(
    GovernorBravoInterface governor,
    uint[] calldata proposalIds
  ) external view returns (GovBravoProposal[] memory) {
    GovBravoProposal[] memory res = new GovBravoProposal[](proposalIds.length);
    for (uint i = 0; i < proposalIds.length; i++) {
      (
        address[] memory targets,
        uint[] memory values,
        string[] memory signatures,
        bytes[] memory calldatas
      ) = governor.getActions(proposalIds[i]);
      res[i] = GovBravoProposal({
        proposalId: 0,
        proposer: address(0),
        eta: 0,
        targets: targets,
        values: values,
        signatures: signatures,
        calldatas: calldatas,
        startBlock: 0,
        endBlock: 0,
        forVotes: 0,
        againstVotes: 0,
        abstainVotes: 0,
        canceled: false,
        executed: false
      });
      setBravoProposal(res[i], governor, proposalIds[i]);
    }
    return res;
  }

  struct CompBalanceMetadata {
    uint balance;
    uint votes;
    address delegate;
  }

  function getCompBalanceMetadata(
    Comp comp,
    address account
  ) external view returns (CompBalanceMetadata memory) {
    return
      CompBalanceMetadata({
        balance: comp.balanceOf(account),
        votes: uint256(comp.getCurrentVotes(account)),
        delegate: comp.delegates(account)
      });
  }

  struct CompBalanceMetadataExt {
    uint balance;
    uint votes;
    address delegate;
    uint allocated;
  }

  function getCompBalanceMetadataExt(
    Comp comp,
    XLensComptrollerInterface comptroller,
    address account
  ) external returns (CompBalanceMetadataExt memory) {
    uint balance = comp.balanceOf(account);
    comptroller.claimComp(account);
    uint newBalance = comp.balanceOf(account);
    uint accrued = comptroller.compAccrued(account);
    uint total = add(accrued, newBalance, "sum comp total");
    uint allocated = sub(total, balance, "sub allocated");

    return
      CompBalanceMetadataExt({
        balance: balance,
        votes: uint256(comp.getCurrentVotes(account)),
        delegate: comp.delegates(account),
        allocated: allocated
      });
  }

  struct CompVotes {
    uint blockNumber;
    uint votes;
  }

  function getCompVotes(
    Comp comp,
    address account,
    uint32[] calldata blockNumbers
  ) external view returns (CompVotes[] memory) {
    CompVotes[] memory res = new CompVotes[](blockNumbers.length);
    for (uint i = 0; i < blockNumbers.length; i++) {
      res[i] = CompVotes({
        blockNumber: uint256(blockNumbers[i]),
        votes: uint256(comp.getPriorVotes(account, blockNumbers[i]))
      });
    }
    return res;
  }

  function compareStrings(
    string memory a,
    string memory b
  ) internal pure returns (bool) {
    return (keccak256(abi.encodePacked((a))) ==
      keccak256(abi.encodePacked((b))));
  }

  function add(
    uint a,
    uint b,
    string memory errorMessage
  ) internal pure returns (uint) {
    uint c = a + b;
    require(c >= a, errorMessage);
    return c;
  }

  function sub(
    uint a,
    uint b,
    string memory errorMessage
  ) internal pure returns (uint) {
    require(b <= a, errorMessage);
    uint c = a - b;
    return c;
  }
}
