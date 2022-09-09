// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/governance/Governor.sol';
import './GovernorCountingSimple.sol';
import '@openzeppelin/contracts/governance/extensions/GovernorVotes.sol';
import '@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol';
import '../Targeted/GovernorTargeted.sol';

contract GovernorFT is
    Governor,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTargeted
{
    constructor(IVotes _token)
        Governor('GovernorFT')
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(4)
    {}

    function votingDelay() public pure override returns (uint256) {
        return 0; //  blocks
    }

    function votingPeriod() public pure override returns (uint256) {
        return 16; // blocks
    }

    // should have at least 1 vote to be able to create proposals
    function proposalThreshold() public pure override returns (uint256) {
        return 1;
    }

    // The following functions are overrides required by Solidity.

    function quorum(uint256 blockNumber)
        public
        view
        override(IGovernor, GovernorVotesQuorumFraction)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }

    function execute(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) public payable override(Governor, GovernorTargeted) returns (uint256) {
        return super.execute(targets, values, calldatas, descriptionHash);
    }
}
