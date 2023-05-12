// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.10;

import { XEtherImmutable } from "@xbank-zkera/X/XEtherImmutable.sol";

/**
 * @title Compound's Maximillion Contract
 * @author Compound
 */
contract XEtherRepayHelper {
  /**
   * @notice The default cEther market to repay in
   */
  XEtherImmutable public xEther;

  /**
   * @notice Construct a Maximillion to repay max in a CEther market
   */
  constructor(XEtherImmutable xEther_) {
    xEther = xEther_;
  }

  /**
   * @notice msg.sender sends Ether to repay an account's borrow in the cEther market
   * @dev The provided Ether is applied towards the borrow balance, any excess is refunded
   * @param borrower The address of the borrower account to repay on behalf of
   */
  function repayBehalf(address borrower) public payable {
    repayBehalfExplicit(borrower, xEther);
  }

  /**
   * @notice msg.sender sends Ether to repay an account's borrow in a cEther market
   * @dev The provided Ether is applied towards the borrow balance, any excess is refunded
   * @param borrower The address of the borrower account to repay on behalf of
   * @param xEther_ The address of the cEther contract to repay in
   */
  function repayBehalfExplicit(
    address borrower,
    XEtherImmutable xEther_
  ) public payable {
    uint received = msg.value;
    uint borrows = xEther_.borrowBalanceCurrent(borrower);
    if (received > borrows) {
      xEther_.repayBorrowBehalf{ value: borrows }(borrower);
      (bool success, ) = payable(msg.sender).call{ value: received - borrows }(
        ""
      );
      require(success, "Bad ETH transfer");
    } else {
      xEther_.repayBorrowBehalf{ value: received }(borrower);
    }
  }
}
