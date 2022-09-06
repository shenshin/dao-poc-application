// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/governance/Governor.sol';
import '@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol';
import '@openzeppelin/contracts/governance/extensions/GovernorVotes.sol';
import '@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol';
import '../Targeted/RIFGovernorTargeted.sol';

contract RIFGovernorFT is
    Governor,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    RIFGovernorTargeted
{
    constructor(IVotes _token)
        Governor('RIFGovernorFT')
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

    function quorumReached(uint256 proposalId) external view returns (bool) {
        return _quorumReached(proposalId);
    }

    function voteSucceeded(uint256 proposalId) external view returns (bool) {
        return _voteSucceeded(proposalId);
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
    ) public payable override(Governor, RIFGovernorTargeted) returns (uint256) {
        return super.execute(targets, values, calldatas, descriptionHash);
    }
}
