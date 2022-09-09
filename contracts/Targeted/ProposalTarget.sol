// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/governance/IGovernor.sol';

interface IProposalTarget {
    event ProposalProcessed(uint256 proposalId);

    function setGovernor(IGovernor _governor) external;

    function onProposalExecution(uint256 _proposalId) external;
}

contract ProposalTarget is IProposalTarget {
    IGovernor public governor;

    modifier onlyGovernor() {
        require(
            msg.sender == address(governor),
            'can be called only by the governor'
        );
        _;
    }

    constructor(IGovernor _governor) {
        _setGovernor(_governor);
    }

    // governor can assign a new governor
    function setGovernor(IGovernor _governor) external onlyGovernor {
        _setGovernor(_governor);
    }

    // executes by the governor on each proposal execution
    function onProposalExecution(uint256 _proposalId) external onlyGovernor {
        require(
            governor.state(_proposalId) == IGovernor.ProposalState.Executed,
            'Proposal was not executed yet'
        );
        emit ProposalProcessed(_proposalId);
    }

    function _setGovernor(IGovernor _governor) private {
        governor = _governor;
    }
}
