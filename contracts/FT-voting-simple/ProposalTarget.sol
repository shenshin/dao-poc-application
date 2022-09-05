// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/governance/IGovernor.sol';

interface IProposalTarget {
    event ProposalProcessed(uint256 proposalId);

    function setGovernor(IGovernor _governor) external;

    function onProposalExecution(uint256 _proposalId) external;
}

contract ProposalTarget is IProposalTarget, Ownable {
    IGovernor public governor;

    modifier governorOnly() {
        require(
            msg.sender == address(governor),
            'can be called only by the governor'
        );
        _;
    }

    constructor(IGovernor _governor) {
        _setGovernor(_governor);
    }

    function setGovernor(IGovernor _governor) external onlyOwner {
        _setGovernor(_governor);
    }

    function onProposalExecution(uint256 _proposalId) external governorOnly {
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
