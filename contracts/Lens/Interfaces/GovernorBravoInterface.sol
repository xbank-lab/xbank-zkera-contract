// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.10;

interface GovernorBravoInterface {
  struct Receipt {
    bool hasVoted;
    uint8 support;
    uint96 votes;
  }
  struct Proposal {
    uint id;
    address proposer;
    uint eta;
    uint startBlock;
    uint endBlock;
    uint forVotes;
    uint againstVotes;
    uint abstainVotes;
    bool canceled;
    bool executed;
  }

  function getActions(
    uint proposalId
  )
    external
    view
    returns (
      address[] memory targets,
      uint[] memory values,
      string[] memory signatures,
      bytes[] memory calldatas
    );

  function proposals(uint proposalId) external view returns (Proposal memory);

  function getReceipt(
    uint proposalId,
    address voter
  ) external view returns (Receipt memory);
}
