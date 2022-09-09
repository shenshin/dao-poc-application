// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/governance/Governor.sol';
import '@openzeppelin/contracts/governance/extensions/GovernorSettings.sol';
import '../extensions/GovernorCountingQuadratic.sol';
import '@openzeppelin/contracts/governance/extensions/GovernorVotes.sol';
import '@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol';
import '../extensions/GovernorTargeted.sol';

contract GovernorFtQuadratic is
    Governor,
    GovernorSettings,
    GovernorVotes,
    GovernorCountingQuadratic,
    GovernorTargeted
{
    constructor(IVotes _token)
        Governor('GovernorFtQuadratic')
        GovernorSettings(
            0, /* voting delay, blocks */
            18, /* voting period, blocks */
            1 /* proposal threshold, votes */
        )
        GovernorVotes(_token)
    {}

    // The following functions are overrides required by Solidity.

    function votingDelay()
        public
        view
        override(IGovernor, GovernorSettings)
        returns (uint256)
    {
        return super.votingDelay();
    }

    function votingPeriod()
        public
        view
        override(IGovernor, GovernorSettings)
        returns (uint256)
    {
        return super.votingPeriod();
    }

    function proposalThreshold()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.proposalThreshold();
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
