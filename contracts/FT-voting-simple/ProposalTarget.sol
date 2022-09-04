// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import './RIFGovernorFT.sol';

contract ProposalTarget {
    RIFGovernorFT governor;

    event ProposalProcessed(uint256 proposalId);

    modifier governorOnly() {
        require(
            msg.sender == address(governor),
            'can be called only by the governor'
        );
        _;
    }

    constructor() {
        governor = RIFGovernorFT(payable(msg.sender));
    }

    function onProposalExecution(uint256 _proposalId) public governorOnly {
        // for some reason these commented lines cause tx rejection on RSK, but not on others
        /* require(
            governor.state(_proposalId) == IGovernor.ProposalState.Executed,
            'Proposal was not executed yet'
        ); */
        emit ProposalProcessed(_proposalId);
    }
}
