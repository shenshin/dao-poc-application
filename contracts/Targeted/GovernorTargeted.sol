// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/governance/Governor.sol';
import './ProposalTarget.sol';

abstract contract GovernorTargeted is Governor {
    IProposalTarget public proposalTarget;

    function updateProposalTarget(IProposalTarget _newTarget)
        public
        virtual
        onlyGovernance
    {
        proposalTarget = _newTarget;
    }

    function execute(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) public payable virtual override returns (uint256) {
        uint256 proposalId = super.execute(
            targets,
            values,
            calldatas,
            descriptionHash
        );
        // call function on the target smart contract after the proposal execution
        if (address(proposalTarget) != address(0)) {
            proposalTarget.onProposalExecution(proposalId);
        }
        return proposalId;
    }
}
